export default function Index() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome</h1>
      <p>This is a public page. Try the protected routes below.</p>
      <ul className="list-disc ml-6">
        <li>
          <a className="underline" href="/dashboard">
            /dashboard
          </a>{" "}
          (requires login)
        </li>
        <li>
          <a className="underline" href="/admin">
            /admin
          </a>{" "}
          (requires role: <code>admin</code>)
        </li>
      </ul>
    </div>
  );
}
