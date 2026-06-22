export type BrandColors = {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  textPrimary?: string;
  textSecondary?: string;
  link?: string;
  success?: string;
  warning?: string;
  error?: string;
};

export type BrandFont = {
  family?: string;
};

export type BrandTypography = {
  fontFamilies?: {
    primary?: string;
    heading?: string;
    code?: string;
  };
  fontSizes?: {
    h1?: string;
    h2?: string;
    h3?: string;
    body?: string;
  };
  fontWeights?: {
    light?: number;
    regular?: number;
    medium?: number;
    bold?: number;
  };
  lineHeights?: {
    heading?: string;
    body?: string;
  };
};

export type BrandProfile = {
  logo?: string;
  colors?: BrandColors;
  fonts?: BrandFont[];
  typography?: BrandTypography;
  spacing?: {
    baseUnit?: number;
    borderRadius?: string;
    padding?: Record<string, unknown>;
    margins?: Record<string, unknown>;
  };
  components?: {
    buttonPrimary?: {
      background?: string;
      textColor?: string;
      borderRadius?: string;
    };
    buttonSecondary?: {
      background?: string;
      textColor?: string;
      borderColor?: string;
      borderRadius?: string;
    };
    input?: Record<string, unknown>;
  };
  icons?: Record<string, unknown>;
  images?: {
    logo?: string;
    favicon?: string;
    ogImage?: string;
  };
  animations?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  personality?: Record<string, unknown>;
};

export type BrandExtraction = {
  sourceUrl: string;
  title?: string;
  description?: string;
  branding: BrandProfile;
  capturedAt: string;
  rawMetadata?: Record<string, unknown>;
};

export function normalizeWebsiteUrl(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Enter a website URL.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }

  return parsed.toString();
}

export function getColorEntries(colors?: BrandColors) {
  return Object.entries(colors ?? {}).filter((entry): entry is [string, string] => {
    const value = entry[1];
    return typeof value === "string" && value.trim().length > 0;
  });
}

