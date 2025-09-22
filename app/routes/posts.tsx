// app/routes/posts.tsx
import type { LoaderFunctionArgs } from "react-router";
import { userContext, authMiddleware } from "../middleware/auth";

// Typ danych posta
type Post = {
  id: string;
  title: string;
  content: string;
};

// ✅ Middleware chroni dostęp do strony
export const middleware = [authMiddleware];

export async function loader({ context }: LoaderFunctionArgs) {
  const user = context.get(userContext);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  // 📡 pobieramy dane z API przy pomocy tokena
  const response = await fetch("https://example.com/api/posts", {
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  if (!response.ok) {
    throw new Response("Błąd pobierania postów", { status: response.status });
  }

  const posts: Post[] = await response.json();
  return { posts };
}

export default function PostsPage({
  loaderData,
}: {
  loaderData: { posts: Post[] };
}) {
  return (
    <div>
      <h1>Posty</h1>
      <ul>
        {loaderData.posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
