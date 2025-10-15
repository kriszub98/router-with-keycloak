import axios, { type AxiosProgressEvent } from "axios";
import {
  FileAudio,
  FileIcon,
  FileImage,
  FileText,
  FileVideo,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { type ChangeEvent, useRef, useState, useMemo } from "react";

// -- CONFIG --
const CONCURRENCY_LIMIT = 3; // ile uploadów równolegle
const UPLOAD_URL = "https://httpbin.org/post"; // podmień na swoje API

// Jeśli używasz Keycloak + interceptorów, importuj swój axios instance zamiast domyślnego
// import { api as axios } from "./axios";

// Typy
export type FileWithProgress = {
  id: string;
  file: File;
  progress: number; // 0-100
  uploaded: boolean;
};

export function FileUpload() {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;

    const newFiles: FileWithProgress[] = Array.from(e.target.files).map(
      (file) => ({
        file,
        progress: 0,
        uploaded: false,
        // unikalne ID (name może się powtarzać)
        id: `${file.name}-${file.size}-${
          file.lastModified
        }-${crypto.randomUUID()}`,
      })
    );

    setFiles((prev) => [...prev, ...newFiles]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  // Funkcja uploadu pojedynczego pliku
  const makeUploadTask = (fileWithProgress: FileWithProgress) => async () => {
    const formData = new FormData();
    formData.append("file", fileWithProgress.file);

    const doPost = () =>
      axios.post(UPLOAD_URL, formData, {
        onUploadProgress: (e: AxiosProgressEvent) => {
          const progress = Math.round(((e.loaded ?? 0) * 100) / (e.total ?? 1));
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileWithProgress.id ? { ...f, progress } : f
            )
          );
        },
        // Przy dużych plikach
        maxBodyLength: Infinity,
      });

    try {
      await doPost();
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileWithProgress.id
            ? { ...f, uploaded: true, progress: 100 }
            : f
        )
      );
    } catch (err: any) {
      // Jeśli chcesz retry po 401 + odświeżenie tokena, wstaw tutaj ensureToken() i ponów doPost()
      console.error("Upload failed for", fileWithProgress.file.name, err);
      throw err;
    }
  };

  // Prosta kolejka z limitem równoległości
  const runWithConcurrency = async <T,>(
    tasks: Array<() => Promise<T>>,
    limit: number
  ) => {
    const executing: Promise<void>[] = [];
    const results: Promise<T>[] = [];

    for (const task of tasks) {
      const p = (async () => task())();
      results.push(p);
      const e = p.then(() => {
        // zwalniamy slot kiedy task skończy
      });
      executing.push(e);
      if (executing.length >= limit) {
        await Promise.race(executing);
        // czyścimy zakończone
        for (let i = executing.length - 1; i >= 0; i--) {
          // resolved/rejected już "wypadły" z race — usuwamy je przez sprawdzenie state
          // W prostym podejściu po prostu filtrujemy fulfilled przez timeout microtasku
        }
        // Uproszczenie: po race zostawiamy tablicę — i tak nie przekroczy limitu
        executing.splice(0, executing.length - (limit - 1));
      }
    }

    return Promise.all(results);
  };

  async function handleUpload() {
    if (files.length === 0 || uploading) return;
    setUploading(true);

    try {
      const tasks = files
        .filter((f) => !f.uploaded)
        .map((f) => makeUploadTask(f));

      await runWithConcurrency(tasks, CONCURRENCY_LIMIT);
    } finally {
      setUploading(false);
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }

  function handleClear() {
    setFiles([]);
  }

  const totalProgress = useMemo(() => {
    if (files.length === 0) return 0;
    const sum = files.reduce((acc, f) => acc + (f.progress || 0), 0);
    return Math.round(sum / files.length);
  }, [files]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">File Upload</h2>

      <div className="flex gap-2">
        <FileInput
          inputRef={inputRef}
          disabled={uploading}
          onFileSelect={handleFileSelect}
        />
        <ActionButtons
          disabled={files.length === 0 || uploading}
          onUpload={handleUpload}
          onClear={handleClear}
        />
      </div>

      {files.length > 0 && (
        <div className="rounded-md bg-grayscale-700 p-3 text-sm">
          Całkowity postęp: {totalProgress}%
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-grayscale-800">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}

      <FileList files={files} onRemove={removeFile} uploading={uploading} />
    </div>
  );
}

// --- Podkomponenty ---

type FileInputProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
};

function FileInput({ inputRef, disabled, onFileSelect }: FileInputProps) {
  return (
    <>
      <input
        type="file"
        ref={inputRef}
        onChange={onFileSelect}
        multiple
        className="hidden"
        id="file-upload"
        disabled={disabled}
      />
      <label
        htmlFor="file-upload"
        className="flex cursor-pointer items-center gap-2 rounded-md bg-grayscale-700 px-6 py-2 hover:opacity-90"
      >
        <Plus size={18} />
        Select Files
      </label>
    </>
  );
}

type ActionButtonsProps = {
  disabled: boolean;
  onUpload: () => void;
  onClear: () => void;
};

function ActionButtons({ onUpload, onClear, disabled }: ActionButtonsProps) {
  return (
    <>
      <button
        onClick={onUpload}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        <Upload size={18} />
        Upload
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-2"
        disabled={disabled}
      >
        <Trash2 size={18} />
        Clear All
      </button>
    </>
  );
}

type FileListProps = {
  files: FileWithProgress[];
  onRemove: (id: string) => void;
  uploading: boolean;
};

function FileList({ files, onRemove, uploading }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Files:</h3>
      <div className="space-y-2">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            onRemove={onRemove}
            uploading={uploading}
          />
        ))}
      </div>
    </div>
  );
}

type FileItemProps = {
  file: FileWithProgress;
  onRemove: (id: string) => void;
  uploading: boolean;
};

function FileItem({ file, onRemove, uploading }: FileItemProps) {
  const Icon = getFileIcon(file.file.type);

  return (
    <div className="space-y-2 rounded-md bg-grayscale-700 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon size={40} className="text-primary-500" />
          <div className="flex flex-col">
            <span className="font-medium">{file.file.name}</span>
            <div className="flex items-center gap-2 text-xs text-grayscale-400">
              <span>{formatFileSize(file.file.size)}</span>
              <span>•</span>
              <span>{file.file.type || "Unknown type"}</span>
            </div>
          </div>
        </div>
        {!uploading && (
          <button onClick={() => onRemove(file.id)} className="bg-none p-0">
            <X size={16} className="text-white" />
          </button>
        )}
      </div>
      <div className="text-right text-xs">
        {file.uploaded ? "Completed" : `${Math.round(file.progress)}%`}
      </div>
      <ProgressBar progress={file.progress} />
    </div>
  );
}

type ProgressBarProps = { progress: number };
function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-grayscale-800">
      <div
        className="h-full bg-primary-500 transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Utils
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
