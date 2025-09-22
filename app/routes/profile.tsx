// app/routes/profile.tsx
import { userContext, authMiddleware } from "../middleware/auth";

export const middleware = [authMiddleware];

export async function loader({ context }) {
  const user = context.get(userContext);

  // przykładowe użycie tokena do pobrania danych z API
  const response = await fetch("https://example.com/api/me", {
    headers: { Authorization: `Bearer ${user.token}` },
  });
  const profile = await response.json();

  return { profile };
}

export default function ProfilePage({ loaderData }) {
  return (
    <div>
      <h1>Profil</h1>
      <p>Zalogowany jako {loaderData.profile.email}</p>
    </div>
  );
}
