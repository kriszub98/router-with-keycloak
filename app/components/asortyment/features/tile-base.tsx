import { useQuery } from "@tanstack/react-query";
import { assortmentImageQueryOptions } from "./assortment-image.queries";

export function AssortmentTile({ item }: { item: AssortmentMenuItem }) {
  const imageQuery = useQuery({
    ...assortmentImageQueryOptions(item.id, item.imageVersion ?? 0),
    enabled: item.imageVersion !== null,
  });

  const imageSrc = imageQuery.data
    ? `data:${imageQuery.data.contentType};base64,${imageQuery.data.base64}`
    : null;

  return (
    <button className="assortment-tile" type="button">
      <div className="assortment-thumbnail">
        {!imageSrc && (
          <span className="assortment-placeholder">{item.shortName}</span>
        )}

        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            width={160}
            height={120}
            className="assortment-image assortment-image--loaded"
          />
        )}
      </div>

      <span>{item.name}</span>
    </button>
  );
}
