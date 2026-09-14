export interface AssortmentMenuItem {
  id: number;
  name: string;
  shortName: string;

  hasImage: boolean;
}

export interface AssortmentImageResponse {
  contentType: string;
  base64: string;
}
