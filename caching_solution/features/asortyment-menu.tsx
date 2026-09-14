// app/features/assortments/AssortmentMenu.tsx
import { useQuery } from "@tanstack/react-query";
import { assortmentListQueryOptions } from "./asortyment.queries";
import { AssortmentTile } from "./asortyment-tile";

export function AssortmentMenu() {
  const {
    data: assortments = [],
    isError,
    error,
  } = useQuery(assortmentListQueryOptions);

  if (isError) {
    return (
      <p role="alert">
        {error instanceof Error ? error.message : "Nie udało się pobrać danych"}
      </p>
    );
  }

  return (
    <div className="assortment-grid">
      {assortments.map((assortment) => (
        <AssortmentTile key={assortment.id} assortment={assortment} />
      ))}
    </div>
  );
}
