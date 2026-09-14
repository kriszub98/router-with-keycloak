// app/features/assortments/assortment.queries.ts
import { queryOptions } from "@tanstack/react-query";

import type {
  AssortmentImageResponse,
  AssortmentMenuItem,
} from "./asortyment.model";
import { apiFetch } from "~/api/api.client";
import { ONE_DAY } from "~/query-client";

export const assortmentKeys = {
  all: ["assortments"] as const,

  list: () => [...assortmentKeys.all, "list"] as const,

  images: () => [...assortmentKeys.all, "image"] as const,

  image: (assortmentId: number) =>
    [...assortmentKeys.images(), assortmentId] as const,
};

export const assortmentListQueryOptions = queryOptions({
  queryKey: assortmentKeys.list(),

  queryFn: async (): Promise<AssortmentMenuItem[]> => {
    const response = await apiFetch("/api/assortments/menu");

    if (!response.ok) {
      throw new Error(`Nie udało się pobrać asortymentów: ${response.status}`);
    }

    return response.json();
  },

  staleTime: 5 * 60 * 1000,
});

/**
 * Opcje dla funkcji zwracającej obraz.
 * staleTime - 1 dzień
 * gcTime - 1 dzień
 * @param assortmentId
 * @returns
 */
export function assortmentImageQueryOptions(assortmentId: number) {
  return queryOptions({
    queryKey: assortmentKeys.image(assortmentId),

    queryFn: async (): Promise<string> => {
      const response = await apiFetch(`/api/assortments/${assortmentId}/image`);

      if (!response.ok) {
        throw new Error(
          `Nie udało się pobrać obrazu ${assortmentId}: ` + response.status,
        );
      }

      const image: AssortmentImageResponse = await response.json();

      return `data:${image.contentType};base64,${image.base64}`;
    },

    staleTime: ONE_DAY,
    gcTime: ONE_DAY,

    retry: 1,
    refetchOnWindowFocus: false,
  });
}
