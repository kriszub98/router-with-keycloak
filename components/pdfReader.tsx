function base64ToBlobUrl(base64OrDataUrl: string): string {
  const isDataUrl = /^data:application\/pdf;base64,/.test(base64OrDataUrl);
  const base64 = isDataUrl
    ? base64OrDataUrl.split(",").slice(1).join(",")
    : base64OrDataUrl;

  // dekoduj do Uint8Array
  const binary = typeof window !== "undefined" ? window.atob(base64) : "";
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);

  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export type PdfModalProps = {
  open: boolean;
  onClose: () => void;
  /** base64 bez nagłówka albo pełny data URL */
  pdfBase64: string;
  title?: string;
  /**
   * Wymuś <iframe> zamiast <embed> (gdybyś chciał porównać zachowanie)
   */
  forceIframe?: boolean;
};

export default function PdfModal({
  open,
  onClose,
  pdfBase64,
  title = "Podgląd PDF",
  forceIframe = false,
}: PdfModalProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return; // generuj tylko gdy modal otwarty
    const objectUrl = base64ToBlobUrl(pdfBase64);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [open, pdfBase64]);

  const content = useMemo(() => {
    if (!url) return null;
    if (forceIframe) {
      return (
        <iframe
          src={url}
          title={title}
          className="h-full w-full rounded-xl"
          allow="fullscreen"
        />
      );
    }
    // <embed> zwykle działa stabilniej w Responsive Mode
    return (
      <embed
        src={url}
        type="application/pdf"
        className="h-full w-full rounded-xl"
      />
    );
  }, [url, title, forceIframe]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 active:scale-[.99]"
              >
                <X className="h-4 w-4" /> Zamknij
              </button>
            </div>

            {/* Kontener na PDF */}
            <div className="h-[80vh] w-full p-4 pt-3">
              <div className="h-full w-full overflow-hidden rounded-xl border">
                {content ?? (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    Ładowanie PDF…
                  </div>
                )}
              </div>
            </div>

            {/* Pasek akcji */}
            <div className="flex items-center justify-between gap-3 border-t bg-neutral-50 p-3">
              <div className="text-xs text-neutral-500">
                Używam {forceIframe ? "<iframe>" : "<embed>"} + Blob URL (nie
                data: URL).
              </div>
              {url && (
                <a
                  href={url}
                  download={"dokument.pdf"}
                  className="rounded-xl bg-black px-3 py-1.5 text-white hover:opacity-90"
                >
                  Pobierz PDF
                </a>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
