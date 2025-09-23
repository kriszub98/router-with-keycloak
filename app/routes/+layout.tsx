import { Outlet, NavLink } from "react-router";
import { AuthProvider, useAuth } from "hooks/auth-context";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="p-4 bg-gray-800 text-white flex justify-between">
      <div className="space-x-4">
        <NavLink to="/" className="hover:underline">
          Home
        </NavLink>
        <NavLink to="/dashboard" className="hover:underline">
          Dashboard
        </NavLink>
      </div>
      {isAuthenticated && (
        <button onClick={logout} className="bg-red-600 px-4 py-1 rounded">
          Wyloguj
        </button>
      )}
    </nav>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}
