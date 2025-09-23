import { RequireAuth, useAuth } from "../auth";

export default function DashboardRoute() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { state } = useAuth();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <pre className="p-4 bg-zinc-100 rounded-xl overflow-auto text-xs">
        {JSON.stringify(state.profile, null, 2)}
      </pre>
    </div>
  );
}
