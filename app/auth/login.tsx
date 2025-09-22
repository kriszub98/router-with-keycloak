// app/routes/login.tsx
import { Form, useActionData, type ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { sessionStorage } from "../session.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // 📡 wysyłamy dane do API logowania
  const response = await fetch("https://example.com/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    return { error: "Błąd serwera" };
  }

  const result = await response.json();

  if (!result.success) {
    return { error: result.message ?? "Niepoprawne dane logowania" };
  }

  // ✅ zapisujemy userId i token do sesji
  const session = await sessionStorage.getSession();
  session.set("userId", result.userId);
  session.set("token", result.token);

  return redirect("/profile", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export default function LoginPage() {
  const actionData = useActionData<{ error?: string }>();

  return (
    <div>
      <h1>Logowanie</h1>
      <Form method="post">
        <input name="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Hasło" />
        <button type="submit">Zaloguj</button>
      </Form>
      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
    </div>
  );
}
