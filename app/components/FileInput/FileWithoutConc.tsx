import React, { useCallback, useRef, useState } from "react";

// Typy pomocnicze
type UploadStatus = "queued" | "uploading" | "done" | "error";

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number; // 0-100
  status: UploadStatus;
  xhr?: XMLHttpRequest; // do anulowania
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${value} ${sizes[i]}`;
}

export default function ImageUploader() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  // Dodanie plików do kolejki
  const enqueueFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const images = arr.filter((f) => f.type.startsWith("image/"));

    const newItems: UploadItem[] = images.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "queued",
    }));

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  // Obsługa wyboru z inputa
  const onSelectFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) enqueueFiles(e.target.files);
    },
    [enqueueFiles]
  );

  // Drag & Drop
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        enqueueFiles(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
    [enqueueFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.xhr && item.status === "uploading") {
        item.xhr.abort();
      }
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((x) => {
        if (x.id === id && x.status === "uploading" && x.xhr) {
          x.xhr.abort();
          return {
            ...x,
            status: "error",
            error: "Anulowano przez użytkownika",
          };
        }
        return x;
      });
      return [...next];
    });
  }, []);

  // Wysyłka wszystkich plików równolegle lub w partiach
  const uploadAll = useCallback(async () => {
    // jeśli chcesz limit równoległości, użyj puli; tu prostota: równolegle
    const queue = items.filter(
      (x) => x.status === "queued" || x.status === "error"
    );

    await Promise.all(
      queue.map(
        (item) =>
          new Promise<void>((resolve) => {
            const form = new FormData();
            // backend spodziewa się pola "files" (może być wiele)
            form.append("files", item.file, item.file.name);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload");

            // Jeżeli potrzebujesz headerów autoryzacyjnych:
            // xhr.setRequestHeader("Authorization", `Bearer ${token}`);

            xhr.upload.onprogress = (evt) => {
              if (!evt.lengthComputable) return;
              const percent = Math.round((evt.loaded / evt.total) * 100);
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id ? { ...x, progress: percent } : x
                )
              );
            };

            xhr.onloadstart = () => {
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id ? { ...x, status: "uploading", xhr } : x
                )
              );
            };

            xhr.onreadystatechange = () => {
              if (xhr.readyState === 4) {
                const success = xhr.status >= 200 && xhr.status < 300;
                setItems((prev) =>
                  prev.map((x) =>
                    x.id === item.id
                      ? {
                          ...x,
                          status: success ? "done" : "error",
                          error: success
                            ? undefined
                            : xhr.responseText || `HTTP ${xhr.status}`,
                          xhr: undefined,
                          progress: success ? 100 : x.progress,
                        }
                      : x
                  )
                );
                resolve();
              }
            };

            xhr.onerror = () => {
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id
                    ? {
                        ...x,
                        status: "error",
                        error: "Błąd sieci",
                        xhr: undefined,
                      }
                    : x
                )
              );
              resolve();
            };

            xhr.onabort = () => {
              setItems((prev) =>
                prev.map((x) =>
                  x.id === item.id
                    ? {
                        ...x,
                        status: "error",
                        error: "Anulowano",
                        xhr: undefined,
                      }
                    : x
                )
              );
              resolve();
            };

            xhr.send(form);
          })
      )
    );
  }, [items]);
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <h2>Uploader obrazów (z progressem)</h2>

      {/* Własny input + drag&drop */}
      <div
        ref={dropRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        style={{
          border: "2px dashed #999",
          padding: 24,
          borderRadius: 12,
          textAlign: "center",
          background: "#fafafa",
          cursor: "pointer",
        }}
        onClick={() => inputRef.current?.click()}
      >
        <p>
          <strong>Przeciągnij i upuść</strong> obrazy tutaj lub kliknij, aby
          wybrać.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={onSelectFiles}
          style={{ display: "none" }}
        />
        <small>Obsługiwane: *.png, *.jpg, *.jpeg, *.gif, ...</small>
      </div>

      {/* Lista plików */}
      {items.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 12,
                borderBottom: "1px solid #eee",
              }}
            >
              <img
                src={item.previewUrl}
                alt={item.file.name}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  borderRadius: 8,
                  background: "#f0f0f0",
                }}
              />
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{item.file.name}</div>
                  <div style={{ color: "#666" }}>
                    {formatBytes(item.file.size)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 8,
                    background: "#eee",
                    height: 8,
                    borderRadius: 9999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: "100%",
                      background:
                        item.status === "error" ? "#e11d48" : "#16a34a",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: item.status === "error" ? "#b91c1c" : "#555",
                  }}
                >
                  {item.status === "queued" && "Oczekuje"}
                  {item.status === "uploading" &&
                    `Wysyłanie... ${item.progress}%`}
                  {item.status === "done" && "Zakończono ✅"}
                  {item.status === "error" &&
                    `Błąd: ${item.error ?? "nieznany"}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {item.status === "uploading" ? (
                  <button
                    onClick={() => cancelUpload(item.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "#fef3c7",
                      border: "1px solid #f59e0b",
                    }}
                  >
                    Anuluj
                  </button>
                ) : (
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      background: "#fee2e2",
                      border: "1px solid #ef4444",
                    }}
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={uploadAll}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "#2563eb",
                color: "white",
                border: 0,
              }}
            >
              Wyślij
            </button>
            <button
              onClick={() => setItems([])}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              Wyczyść listę
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
