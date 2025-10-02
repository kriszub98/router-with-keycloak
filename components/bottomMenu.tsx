import { NavLink } from "react-router-dom";
import { Home, Search, Bell, User } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200">
      <ul className="flex justify-around items-center h-14">
        <li>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-sm ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`
            }
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-sm ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`
            }
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">Search</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-sm ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`
            }
          >
            <Bell className="w-6 h-6" />
            <span className="text-xs">Alerts</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-sm ${
                isActive ? "text-blue-600" : "text-gray-500"
              }`
            }
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
