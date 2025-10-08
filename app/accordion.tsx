import React, { useMemo, useState, useId } from "react";

// ===== Types =====
export type WasteState = Record<string, { checked: boolean; notes: string }>;

export type AccordionRodzajeOdpadowProps = {
  items: string[]; // lista rodzajów odpadów
  title?: string; // tytuł akordeonu
  defaultOpen?: boolean; // czy akordeon jest startowo otwarty
  value?: WasteState; // tryb kontrolowany (stan z rodzica)
  onChange?: (next: WasteState) => void; // callback na zmianę stanu
  clearNotesOnUncheck?: boolean; // czyścić uwagi po odznaczeniu (domyślnie: tak)
};

// ===== Utils =====
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // usuń diakrytyki
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function baseFromItems(items: string[]): WasteState {
  const base: WasteState = {};
  for (const label of items) base[label] = { checked: false, notes: "" };
  return base;
}

function mergeState(base: WasteState, overlay?: WasteState): WasteState {
  if (!overlay) return base;
  const out: WasteState = { ...base };
  for (const k of Object.keys(overlay))
    if (k in out) out[k] = { ...out[k], ...overlay[k] };
  return out;
}

// ===== Component =====
export const AccordionRodzajeOdpadow: React.FC<
  AccordionRodzajeOdpadowProps
> = ({
  items,
  title = "Rodzaje odpadów",
  defaultOpen = false,
  value,
  onChange,
  clearNotesOnUncheck = true,
}) => {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);

  // Tryb kontrolowany vs niekontrolowany
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<WasteState>({});

  // Stan widoczny (zawsze ograniczony do `items`)
  const viewState = useMemo(() => {
    return mergeState(baseFromItems(items), isControlled ? value : internal);
  }, [items, value, internal, isControlled]);

  const setNext = (next: WasteState) => {
    if (isControlled) onChange?.(next);
    else {
      setInternal(next);
      onChange?.(next);
    }
  };

  const toggleItem = (label: string) => {
    const curr = viewState[label] ?? { checked: false, notes: "" };
    const nextChecked = !curr.checked;
    const nextNotes = nextChecked
      ? curr.notes
      : clearNotesOnUncheck
        ? ""
        : curr.notes;
    setNext({
      ...viewState,
      [label]: { checked: nextChecked, notes: nextNotes },
    });
  };

  const updateNotes = (label: string, notes: string) => {
    const curr = viewState[label] ?? { checked: false, notes: "" };
    if (!curr.checked) return; // uwagi tylko gdy zaznaczone
    setNext({ ...viewState, [label]: { ...curr, notes } });
  };

  const checkedCount = useMemo(
    () => Object.values(viewState).filter((v) => v.checked).length,
    [viewState]
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="border rounded-2xl shadow-sm bg-white">
        <button
          id={`${id}-button`}
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-left select-none"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="font-medium text-base md:text-lg">
            {title}
            {checkedCount > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                • zaznaczono {checkedCount}
              </span>
            )}
          </span>
          <svg
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div
          id={`${id}-panel`}
          role="region"
          aria-labelledby={`${id}-button`}
          className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${open ? "max-h-[1000px]" : "max-h-0"}`}
        >
          <ul className="divide-y">
            {items.map((label) => {
              const elId = `${id}-${slugify(label)}`;
              const { checked, notes } = viewState[label] ?? {
                checked: false,
                notes: "",
              };
              return (
                <li key={label} className="p-4">
                  <div className="flex items-start gap-3 md:gap-4">
                    <input
                      id={`${elId}-chk`}
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      checked={checked}
                      onChange={() => toggleItem(label)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`${elId}-chk`}
                        className="block font-medium"
                      >
                        {label}
                      </label>
                      <div className="mt-2">
                        <label htmlFor={`${elId}-notes`} className="sr-only">
                          Uwagi do {label}
                        </label>
                        <input
                          id={`${elId}-notes`}
                          type="text"
                          placeholder="Uwagi"
                          value={notes}
                          onChange={(e) => updateNotes(label, e.target.value)}
                          disabled={!checked}
                          className={`w-full rounded-xl border px-3 py-2 outline-none transition shadow-sm ${
                            checked
                              ? "bg-white border-gray-300 focus:ring-2 focus:ring-blue-500"
                              : "bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ===== Demo (możesz usunąć) =====
export default function Demo() {
  const [state, setState] = useState<WasteState>({});
  const items = useMemo(
    () => [
      "Papier i tektura",
      "Tworzywa sztuczne",
      "Szkło",
      "Metale",
      "Bioodpady",
    ],
    []
  );

  return (
    <div className="p-6 space-y-4">
      <AccordionRodzajeOdpadow items={items} defaultOpen onChange={setState} />
      <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-auto">
        {JSON.stringify(state, null, 2)}
      </pre>
    </div>
  );
}
