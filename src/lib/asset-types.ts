export const IMAGE_ASSET_TYPES = [
  "Social post graphic",
  "Slideshow frame",
  "Carousel slide",
  "Infographic carousel slide",
  "Ad creative",
  "Product-style visual",
  "Brand background/template"
] as const;

export type ImageAssetType = (typeof IMAGE_ASSET_TYPES)[number];

export const CONTENT_ASSET_TYPES = [
  "Social content",
  "Short-form video script",
  "Instagram/TikTok slideshow",
  "Carousel post",
  "LinkedIn infographic",
  "Ad creative copy",
  "Image asset brief",
  "Email campaign",
  "Landing page section",
  "UGC workflows",
  "Seedance video",
  "Competitive inspiration"
] as const;

export type ContentAssetType = (typeof CONTENT_ASSET_TYPES)[number];

export const PLANNED_CONTENT_ASSET_TYPES: ContentAssetType[] = [
  "UGC workflows",
  "Seedance video",
  "Competitive inspiration"
];
