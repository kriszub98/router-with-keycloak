// app/routes/logout.tsx
import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { getSession, sessionStorage } from "../session.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);

  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export default function LogoutPage() {
  return (
    <form method="post">
      <button type="submit">Wyloguj</button>
    </form>
  );
}
