export const IMAGE_ASSET_TYPES = [
  "Social post graphic",
  "Carousel slide",
  "Ad creative",
  "Product-style visual",
  "Brand background/template"
] as const;

export type ImageAssetType = (typeof IMAGE_ASSET_TYPES)[number];
