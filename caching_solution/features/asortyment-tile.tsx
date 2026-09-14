// app/features/assortments/AssortmentTile.tsx
import { useQuery } from "@tanstack/react-query";
import type { AssortmentMenuItem } from "./asortyment.model";
import { assortmentImageQueryOptions } from "./asortyment.queries";

interface AssortmentTileProps {
  assortment: AssortmentMenuItem;
}

export function AssortmentTile({ assortment }: AssortmentTileProps) {
  const shouldLoadImage = assortment.hasImage;

  const imageQuery = useQuery({
    ...assortmentImageQueryOptions(assortment.id),
    enabled: shouldLoadImage,
  });

  return (
    <button type="button" className="assortment-tile">
      <div className="assortment-thumbnail">
        <span className="assortment-placeholder">{assortment.shortName}</span>

        {imageQuery.isSuccess && (
          <img
            src={imageQuery.data}
            alt=""
            width={320}
            height={240}
            className="assortment-image"
          />
        )}

        {imageQuery.isError && (
          <span
            className="assortment-image-error"
            title="Nie udało się pobrać zdjęcia"
          >
            !
          </span>
        )}
      </div>

      <span className="assortment-name">{assortment.name}</span>
    </button>
  );
}
