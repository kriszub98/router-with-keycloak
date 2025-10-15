// Reusable, headless-ish FileUpload that lifts state via props + callbacks
// - Parent owns the authoritative list of items (with server UUIDs etc.)
// - Child handles UI, progress, and selection; communicates via callbacks
// - Upload logic extracted to a service (uploadService) for testability

import React, { useRef, useState, type ChangeEvent } from "react";
import { Plus, Upload, X, Trash2 } from "lucide-react";
import type { AxiosProgressEvent } from "axios";
import axios from "axios";

// ==================== Types shared with parent ====================

export type LocalUploadItem = {
  tempId: string; // local-only identifier
  file: File; // File never leaves component tree unless you really need it
  name: string; // file.name snapshot
  size: number;
  mime: string;
  progress: number; // 0-100 during upload
  uploaded: boolean;
};

export type ServerFile = {
  uuid: string; // from server
  fileName: string;
};

export type UploadSuccess = {
  tempId: string; // so parent can reconcile local -> server
  server: ServerFile;
};

export type UploadFailure = {
  tempId: string;
  error: unknown;
};

// ==================== Upload service (decoupled) ====================

export type UploadServiceOptions = {
  url: string;
  tokenProvider?: () => Promise<string | undefined>; // e.g., Keycloak updateToken(60) then return token
  concurrency?: number; // default 3
  onProgress?: (tempId: string, e: AxiosProgressEvent) => void;
};

export async function uploadFiles(
  items: LocalUploadItem[],
  opts: UploadServiceOptions
): Promise<{ ok: UploadSuccess[]; fail: UploadFailure[] }> {
  const concurrency = Math.max(1, opts.concurrency ?? 3);

  const tasks = items.map((item) => async () => {
    const formData = new FormData();
    formData.append("file", item.file);

    const headers: Record<string, string> = {};
    if (opts.tokenProvider) {
      const token = await opts.tokenProvider();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await axios.post(opts.url, formData, {
      headers,
      onUploadProgress: (e) => opts.onProgress?.(item.tempId, e),
      maxBodyLength: Infinity,
    });

    // Adapt this mapping to your backend response shape
    const server: ServerFile = {
      uuid: res.data?.uuid ?? res.data?.data?.uuid ?? crypto.randomUUID(),
      fileName: res.data?.fileName ?? item.name,
    };

    const success: UploadSuccess = { tempId: item.tempId, server };
    return success;
  });

  const ok: UploadSuccess[] = [];
  const fail: UploadFailure[] = [];

  // Simple promise pool
  const pool: Promise<void>[] = [];
  let i = 0;
  const runNext = async (): Promise<void> => {
    if (i >= tasks.length) return;
    const idx = i++;
    try {
      const s = await tasks[idx]!();
      ok.push(s);
    } catch (error) {
      fail.push({ tempId: items[idx]!.tempId, error });
    }
    return runNext();
  };
  for (let k = 0; k < Math.min(concurrency, tasks.length); k++) {
    pool.push(runNext());
  }
  await Promise.all(pool);

  return { ok, fail };
}

// ==================== Child component (reusable) ====================

export type FileUploadProps = {
  // Controlled-ish: parent owns the canonical list, but child keeps local progress
  value: LocalUploadItem[];
  onChange: (next: LocalUploadItem[]) => void; // when selection/removal changes

  // Upload triggers
  uploadUrl: string;
  onUploaded?: (result: UploadSuccess) => void; // per-file callback
  onComplete?: (summary: {
    ok: UploadSuccess[];
    fail: UploadFailure[];
  }) => void; // all done
  tokenProvider?: UploadServiceOptions["tokenProvider"]; // Keycloak
  concurrency?: number;

  disabled?: boolean;
};

export function FileUpload({
  value,
  onChange,
  uploadUrl,
  onUploaded,
  onComplete,
  tokenProvider,
  concurrency,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const picked: LocalUploadItem[] = Array.from(e.target.files).map(
      (file) => ({
        tempId: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        name: file.name,
        size: file.size,
        mime: file.type,
        progress: 0,
        uploaded: false,
      })
    );
    onChange([...value, ...picked]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (tempId: string) =>
    onChange(value.filter((v) => v.tempId !== tempId));
  const clear = () => onChange([]);

  const startUpload = async () => {
    if (uploading || value.length === 0) return;
    setUploading(true);
    try {
      const { ok, fail } = await uploadFiles(
        value.filter((v) => !v.uploaded),
        {
          url: uploadUrl,
          tokenProvider,
          concurrency,
          onProgress: (tempId, e) => {
            const progress = Math.round(
              ((e.loaded ?? 0) * 100) / (e.total ?? 1)
            );
            onChange(
              value.map((it) =>
                it.tempId === tempId ? { ...it, progress } : it
              )
            );
          },
        }
      );

      // mark uploaded in value
      const updated = value.map((it) =>
        ok.some((s) => s.tempId === it.tempId)
          ? { ...it, uploaded: true, progress: 100 }
          : it
      );
      onChange(updated);

      ok.forEach((s) => onUploaded?.(s));
      onComplete?.({ ok, fail });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleSelect}
          className="hidden"
          id="file-picker"
          disabled={disabled || uploading}
        />
        <label
          htmlFor="file-picker"
          className="flex cursor-pointer items-center gap-2 rounded-md bg-grayscale-700 px-6 py-2 hover:opacity-90"
        >
          <Plus size={16} /> Select files
        </label>

        <button
          onClick={startUpload}
          disabled={disabled || uploading || value.length === 0}
          className="flex items-center gap-2"
        >
          <Upload size={16} /> Upload
        </button>

        <button
          onClick={clear}
          disabled={disabled || uploading || value.length === 0}
          className="flex items-center gap-2"
        >
          <Trash2 size={16} /> Clear
        </button>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((it) => (
            <li key={it.tempId} className="rounded-md bg-grayscale-700 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{it.name}</div>
                  <div className="text-xs text-grayscale-400">
                    {Math.round(it.size / 1024)} KB • {it.mime || "unknown"}
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={() => remove(it.tempId)}
                    className="bg-none p-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayscale-800">
                <div
                  className="h-full bg-primary-500 transition-all"
                  style={{ width: `${it.progress}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[10px]">
                {it.uploaded ? "Completed" : `${it.progress}%`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ==================== Example Parent ====================

export function ProductForm() {
  // Parent owns canonical state: including server UUIDs mapped to tempIds
  const [files, setFiles] = useState<LocalUploadItem[]>([]);
  const [images, setImages] = useState<ServerFile[]>([]); // final server-side files
  const [name, setName] = useState(""); // other product fields

  const handleUploaded = (r: UploadSuccess) => {
    // Reconcile local tempId with server UUID
    setImages((prev) => [...prev, r.server]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // At this point `images` has server UUIDs & names; submit full product payload
    const payload = { name, images };
    console.log("Submit product:", payload);
    // await api.post("/products", payload)
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm">Product name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-grayscale-600 bg-grayscale-700 p-2"
        />
      </div>

      <FileUpload
        value={files}
        onChange={setFiles}
        uploadUrl="/api/upload" // your endpoint
        tokenProvider={async () => {
          // e.g., await keycloak.updateToken(60); return keycloak.token;
          return undefined;
        }}
        concurrency={3}
        onUploaded={handleUploaded}
        onComplete={({ ok, fail }) => {
          console.log("Uploaded:", ok, "Failed:", fail);
        }}
      />

      <button type="submit" className="rounded-md bg-primary-600 px-4 py-2">
        Save product
      </button>
    </form>
  );
}
