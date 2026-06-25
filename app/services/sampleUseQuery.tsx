import { useQuery } from "@tanstack/react-query";

type Product = {
  id: number;
  name: string;
  quantity: number;
};

async function getProducts(): Promise<Product[]> {
  const response = await fetch("http://localhost:8080/api/products");

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

export function ProductsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  if (isLoading) return <p>Loading...</p>;

  if (isError) {
    return <p>Error: {error.message}</p>;
  }

  return (
    <>
      <button onClick={() => refetch()}>Refresh</button>

      <ul>
        {data?.map((product) => (
          <li key={product.id}>
            {product.name} — {product.quantity}
          </li>
        ))}
      </ul>
    </>
  );
}
