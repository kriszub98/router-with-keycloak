import { queryOptions } from "@tanstack/react-query";

export interface AssortmentMenuItem {
  id: number;
  name: string;
  shortName: string;
  imageVersion: number | null;
}

async function getAssortmentMenu(): Promise<AssortmentMenuItem[]> {
  const response = await fetch("/api/assortments/menu", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać menu asortymentów");
  }

  return response.json();
}

export const assortmentMenuQueryOptions = queryOptions({
  queryKey: ["assortments", "menu"],
  queryFn: getAssortmentMenu,
  staleTime: 5 * 60 * 1000,
});
