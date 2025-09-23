import * as React from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { AuthProvider, useAuth } from "./auth";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-zinc-50 text-zinc-900">
        <AuthProvider>
          <TopBar />
          <main className="max-w-4xl mx-auto p-6">{children}</main>
        </AuthProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

function TopBar() {
  const { state, logout } = useAuth();
  return (
    <header className="border-b bg-white">
      <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
        <a href="/" className="font-semibold">
          My App
        </a>
        <div className="text-sm">
          {state.authenticated && state.profile ? (
            <div className="flex items-center gap-3">
              <span>
                Hello, {state.profile.firstName ?? state.profile.username}
              </span>
              <button
                className="px-3 py-1 rounded-xl border"
                onClick={() => logout()}
              >
                Logout
              </button>
            </div>
          ) : (
            <span>Not signed in</span>
          )}
        </div>
      </div>
    </header>
  );
}
