import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

type UploadStatus = "idle" | "uploading" | "error" | "done";

interface UploadFileState {
  id: string; // uuid
  file: File;
  fileName: string;
  progress: number; // 0–100
  status: UploadStatus;
  error?: string;
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // prosty fallback
  return "xxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// czytanie CAŁEGO pliku jako base64 (bez prefixu data:...)
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

// TODO: Podmień na swój hook Keycloaka
function useKeycloakToken(): string | null {
  const token = "DUMMY_TOKEN_Z_KEYCLOAKA";
  return token;
}

export const ImageUploadWholeFile: React.FC = () => {
  const [files, setFiles] = useState<UploadFileState[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const token = useKeycloakToken();
  const navigate = useNavigate();

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: UploadFileState[] = Array.from(selected).map((file) => ({
      id: generateUuid(),
      file,
      fileName: file.name,
      progress: 0,
      status: "idle",
    }));

    setFiles(newFiles);
    setMessage(null);
    setGlobalError(null);
  };

  // upload pojedynczego, pełnego pliku jako base64 (1 request)
  const uploadSingleFile = async (
    fileState: UploadFileState
  ): Promise<UploadFileState> => {
    if (!token) {
      throw new Error("Brak tokenu Keycloak – użytkownik nie jest zalogowany.");
    }

    const { file, id, fileName } = fileState;

    let current: UploadFileState = {
      ...fileState,
      status: "uploading",
      progress: 0,
      error: undefined,
    };
    setFiles((prev) => prev.map((f) => (f.id === id ? current : f)));

    try {
      const base64 = await readFileAsBase64(file);

      // payload, który Twój backend oczekuje: uuid, base64, nazwa_zdjęcia
      const payload = JSON.stringify({
        uuid: id,
        base64,
        fileName, // nazwa_zdjęcia
      });

      // Używamy XHR, żeby mieć realny upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", "/api/upload-file", true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");

        // Pasek postępu – progres wysyłania requestu
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            current = { ...current, progress };
            setFiles((prev) => prev.map((f) => (f.id === id ? current : f)));
          } else {
            // jeśli lengthComputable = false, możesz np. robić "fake progress"
            // ale na razie tego nie ruszamy
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              const text = xhr.responseText || xhr.statusText;
              reject(
                new Error(
                  `Błąd uploadu (status ${xhr.status}): ${text || "nieznany błąd"}`
                )
              );
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error("Błąd sieci podczas uploadu."));
        };

        xhr.send(payload);
      });

      current = {
        ...current,
        status: "done",
        progress: 100,
      };
      setFiles((prev) => prev.map((f) => (f.id === id ? current : f)));
      return current;
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Nieznany błąd uploadu.";
      current = {
        ...current,
        status: "error",
        error: msg,
      };
      setFiles((prev) => prev.map((f) => (f.id === id ? current : f)));
      throw err;
    }
  };

  const handleUploadAll = async () => {
    setMessage(null);
    setGlobalError(null);

    if (!files.length) {
      setGlobalError("Najpierw wybierz zdjęcia.");
      return;
    }

    try {
      const results: UploadFileState[] = [];
      for (const f of files) {
        if (f.status === "done") {
          results.push(f);
          continue;
        }
        const updated = await uploadSingleFile(f);
        results.push(updated);
      }

      const allOk = results.every((f) => f.status === "done");
      if (allOk) {
        setMessage("Zdjęcia zostały przesłane.");
        // ewentualnie:
        // navigate("/success");
      } else {
        setGlobalError("Niektóre zdjęcia nie zostały poprawnie przesłane.");
      }
    } catch {
      setGlobalError(
        "Wystąpił błąd podczas wysyłania zdjęć. Sprawdź szczegóły przy plikach."
      );
    }
  };

  const handleRetryFile = async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    try {
      await uploadSingleFile(file);
    } catch {
      // błąd już obsłużony wewnątrz uploadSingleFile
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">Upload zdjęć (pełne pliki)</h1>

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="block w-full text-sm"
      />

      {globalError && <div className="text-red-600 text-sm">{globalError}</div>}

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f) => (
            <div
              key={f.id}
              className="border rounded-lg p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{f.fileName}</span>
                <span>{f.progress}%</span>
              </div>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${f.progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span>Status: {f.status}</span>
                {f.status === "error" && (
                  <button
                    type="button"
                    className="px-2 py-1 border rounded text-xs"
                    onClick={() => handleRetryFile(f.id)}
                  >
                    Ponów
                  </button>
                )}
              </div>

              {f.error && (
                <div className="text-red-600 text-xs">Błąd: {f.error}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleUploadAll}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:bg-gray-400"
        disabled={!files.length}
      >
        Wyślij zdjęcia
      </button>

      {message && <div className="text-green-700 text-sm">{message}</div>}
    </div>
  );
};
