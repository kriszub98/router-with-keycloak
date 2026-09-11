// assortment-image.queries.ts
import { queryOptions } from "@tanstack/react-query";

interface AssortmentImageResponse {
  contentType: string;
  base64: string;
}

export function assortmentImageQueryOptions(id: number, imageVersion: number) {
  return queryOptions({
    queryKey: ["assortments", "thumbnail", id, imageVersion],

    queryFn: async (): Promise<AssortmentImageResponse> => {
      const response = await fetch(`/api/assortments/${id}/thumbnail-base64`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Nie udało się pobrać obrazu ${id}`);
      }

      return response.json();
    },

    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
