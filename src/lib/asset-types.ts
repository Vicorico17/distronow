export const IMAGE_ASSET_TYPES = [
  "Social post graphic",
  "Carousel slide",
  "Ad creative",
  "Product-style visual",
  "Brand background/template"
] as const;

export type ImageAssetType = (typeof IMAGE_ASSET_TYPES)[number];

export const CONTENT_ASSET_TYPES = [
  "Social content",
  "Slideshows and carousels",
  "Image assets",
  "UGC workflows",
  "Seedance video"
] as const;

export type ContentAssetType = (typeof CONTENT_ASSET_TYPES)[number];

export const PLANNED_CONTENT_ASSET_TYPES: ContentAssetType[] = ["UGC workflows", "Seedance video"];
