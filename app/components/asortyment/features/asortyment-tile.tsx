// AssortmentTile.tsx
import { useState } from "react";
import type { AssortmentMenuItem } from "./asortyment.queries";
import "./asortyment-tile.css";

interface AssortmentTileProps {
  item: AssortmentMenuItem;
  priority: boolean;
}

export function AssortmentTile({ item, priority }: AssortmentTileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl =
    item.imageVersion !== null
      ? `/api/assortments/${item.id}/thumbnail?v=${item.imageVersion}`
      : null;

  return (
    <button type="button" className="assortment-tile">
      <div className="assortment-thumbnail">
        <span
          className={[
            "assortment-placeholder",
            imageLoaded && "assortment-placeholder--hidden",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {item.shortName}
        </span>

        {imageUrl && !imageFailed && (
          <img
            src={imageUrl}
            alt=""
            width={160}
            height={120}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={[
              "assortment-image",
              imageLoaded && "assortment-image--loaded",
            ]
              .filter(Boolean)
              .join(" ")}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
      </div>

      <span className="assortment-name">{item.name}</span>
    </button>
  );
}
