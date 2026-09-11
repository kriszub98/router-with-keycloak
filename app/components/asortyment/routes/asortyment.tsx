// app/routes/assortments.tsx
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "../../query-client";
import type { Route } from "../../+types/root";
import { assortmentMenuQueryOptions } from "~/features/asortyment.queries";
import { AssortmentTile } from "~/features/asortyment-tile";

export async function clientLoader(_: Route.ClientLoaderArgs) {
  await queryClient.query(assortmentMenuQueryOptions);

  return null;
}

export function HydrateFallback() {
  return <div>Ładowanie menu asortymentów…</div>;
}

export default function AssortmentsRoute() {
  const {
    data: items = [],
    isError,
    error,
  } = useQuery(assortmentMenuQueryOptions);

  if (isError) {
    return (
      <div role="alert">
        {error instanceof Error ? error.message : "Nie udało się pobrać menu"}
      </div>
    );
  }

  return (
    <div className="assortment-grid">
      {items.map((item, index) => (
        <AssortmentTile key={item.id} item={item} priority={index < 8} />
      ))}
    </div>
  );
}
