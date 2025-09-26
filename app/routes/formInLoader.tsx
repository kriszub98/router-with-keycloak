// src/router.tsx
import * as React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  useLoaderData,
  isRouteErrorResponse,
} from "react-router-dom";
import { authFetch } from "./auth/keycloak";

type User = { id: string; name: string; email: string };
type Profile = { avatarUrl?: string; roles: string[] };

export async function podstronaLoader({ params }: { params: { id?: string } }) {
  const id = params.id!;
  // 2 niezależne zapytania – uruchamiamy równolegle
  const [userRes, profileRes] = await Promise.all([
    authFetch(`/api/users/${id}`),
    authFetch(`/api/users/${id}/profile`),
  ]);

  if (!userRes.ok) {
    throw new Response("Nie udało się pobrać użytkownika", {
      status: userRes.status,
    });
  }
  if (!profileRes.ok) {
    throw new Response("Nie udało się pobrać profilu", {
      status: profileRes.status,
    });
  }

  const [user, profile] = (await Promise.all([
    userRes.json(),
    profileRes.json(),
  ])) as [User, Profile];

  // nic się nie mutuje – zwracamy gotowe dane
  return { user, profile };
}

function Podstrona() {
  const { user, profile } = useLoaderData() as { user: User; profile: Profile };
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="flex items-center gap-4">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={user.name}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
      </header>
      <section className="mt-6">
        <h2 className="text-lg font-medium">Role</h2>
        <ul className="list-disc pl-6">
          {profile.roles?.length ? (
            profile.roles.map((r) => <li key={r}>{r}</li>)
          ) : (
            <li>Brak ról</li>
          )}
        </ul>
      </section>
    </main>
  );
}

function ErrorBoundary() {
  const err = (window as any).rrError; // niepotrzebne, ale przykładowo
  return (
    <div className="m-6 rounded-xl border p-6 text-red-700">
      {isRouteErrorResponse(err) ? (
        <>
          <h1 className="text-xl font-semibold">Błąd {err.status}</h1>
          <p>{err.statusText || "Coś poszło nie tak."}</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Błąd</h1>
          <p>Nie udało się załadować danych.</p>
        </>
      )}
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/podstrona/:id",
    element: <Podstrona />,
    loader: podstronaLoader,
    shouldRevalidate: ({ currentParams, nextParams }) =>
      currentParams.id !== nextParams.id, // przeładuj TYLKO gdy zmienia się :id
    errorElement: <ErrorBoundary />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
