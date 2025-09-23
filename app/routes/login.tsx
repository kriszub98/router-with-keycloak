import { useAuth } from "hooks/auth-context";

export default function Login() {
  const { login } = useAuth();

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={login}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Zaloguj przez Keycloak
      </button>
    </div>
  );
}
