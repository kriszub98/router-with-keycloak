import { useFetch } from "hooks/useFetch";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
};

export function loader() {
  return null;
}

// Komponent
export function DashboardPage() {
  const {
    data: user,
    error,
    loading,
  } = useFetch("https://jsonplaceholder.typicode.com/users/1");
  if (loading) {
    return <div className="w-full flex justify-center">Loading</div>;
  }
  if (!user) {
    return <div className="w-full flex justify-center">Noone with that id</div>;
  }
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>{user.id}</p>
    </div>
  );
}
