import { RequireAuth } from "../auth";

export default function AdminRoute() {
  return (
    <RequireAuth role="admin">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Admin Area</h2>
        <p>
          Only users with role <code>admin</code> can see this page.
        </p>
      </div>
    </RequireAuth>
  );
}
