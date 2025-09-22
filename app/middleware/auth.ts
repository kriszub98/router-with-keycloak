// app/middleware/auth.ts
import { createContext, redirect } from "react-router";
import { getSession } from "../session.server";

export const userContext = createContext<{ id: string; token: string } | null>(
  null
);

export async function authMiddleware({ request, context, next }) {
  const session = await getSession(request);
  const userId = session.get("userId");
  const token = session.get("token");

  if (!userId || !token) {
    throw redirect("/login");
  }

  // Możesz w tym miejscu np. opcjonalnie zweryfikować token w API
  // await fetch("https://example.com/api/verify", { headers: { Authorization: `Bearer ${token}` } });

  context.set(userContext, { id: userId, token });

  return next();
}
