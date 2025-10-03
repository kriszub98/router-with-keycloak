import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

export default function TopNav({ logoSrc, logoAlt = "Company logo" }) {
  const { keycloak, initialized } = useKeycloak();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);

  // Ustal nazwę użytkownika z tokenu Keycloak
  const profileName =
    (initialized &&
      (keycloak?.tokenParsed?.name ||
        keycloak?.tokenParsed?.preferred_username ||
        keycloak?.tokenParsed?.email)) ||
    "Profil";

  // Zamknij dropdown po kliknięciu poza nim
  useEffect(() => {
    function onClickOutside(e) {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onEscape(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const handleLogout = () => {
    if (!keycloak) return;
    // Przekierowanie po wylogowaniu do strony startowej aplikacji
    keycloak.logout({ redirectUri: window.location.origin });
  };

  return (
    <header className="fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 z-50">
      <div className="mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="h-full flex items-center justify-between">
          {/* Lewa strona: logo */}
          <div className="flex items-center gap-3">
            <a href="/" className="inline-flex items-center">
              <img
                src={logoSrc}
                alt={logoAlt}
                className="h-8 w-auto select-none"
                draggable={false}
              />
            </a>
          </div>

          {/* Prawa strona: profil + chevron */}
          <div className="relative">
            <button
              ref={btnRef}
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="max-w-[30vw] truncate">{profileName}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            {open && (
              <div
                ref={menuRef}
                role="menu"
                aria-label="menu profilu"
                className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl border border-gray-200 bg-white shadow-lg focus:outline-none"
              >
                <ul className="py-1 text-sm text-gray-700">
                  <li>
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      Wyloguj
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
