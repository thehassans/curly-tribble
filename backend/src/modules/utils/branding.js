export const BRANDING_ASSET_KEYS = ["headerLogo", "loginLogo", "favicon"];
export const BRANDING_TEXT_KEYS = [
  "title",
  "appName",
  "companyName",
  "portalName",
  "storeName",
  "staffLoginSubtitle",
  "shopLoginSubtitle",
  "footerText",
  "reportSignature",
  "reportFooterText",
  "websiteUrl",
];

export const DEFAULT_BRANDING = Object.freeze({
  headerLogo: null,
  loginLogo: null,
  favicon: null,
  title: "Magnetic E-commerce",
  appName: "Magnetic",
  companyName: "Magnetic E-commerce",
  portalName: "Magnetic E-commerce Management",
  storeName: "Magnetic Store",
  staffLoginSubtitle: "Sign in to your Magnetic E-commerce workspace",
  shopLoginSubtitle: "Access the Magnetic E-commerce shop operations console",
  footerText: "Powered by Magnetic E-commerce",
  reportSignature: "Magnetic E-commerce",
  reportFooterText: "All Rights Reserved",
  websiteUrl: "https://magnetic-ecommerce.example",
});

function sanitizeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const next = value.trim();
  return next || fallback;
}

function sanitizeAsset(value) {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next || null;
}

export function normalizeBrandingConfig(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    headerLogo: sanitizeAsset(source.headerLogo),
    loginLogo: sanitizeAsset(source.loginLogo),
    favicon: sanitizeAsset(source.favicon),
    title: sanitizeText(source.title, DEFAULT_BRANDING.title),
    appName: sanitizeText(source.appName, DEFAULT_BRANDING.appName),
    companyName: sanitizeText(source.companyName, DEFAULT_BRANDING.companyName),
    portalName: sanitizeText(source.portalName, DEFAULT_BRANDING.portalName),
    storeName: sanitizeText(source.storeName, DEFAULT_BRANDING.storeName),
    staffLoginSubtitle: sanitizeText(source.staffLoginSubtitle, DEFAULT_BRANDING.staffLoginSubtitle),
    shopLoginSubtitle: sanitizeText(source.shopLoginSubtitle, DEFAULT_BRANDING.shopLoginSubtitle),
    footerText: sanitizeText(source.footerText, DEFAULT_BRANDING.footerText),
    reportSignature: sanitizeText(source.reportSignature, DEFAULT_BRANDING.reportSignature),
    reportFooterText: sanitizeText(source.reportFooterText, DEFAULT_BRANDING.reportFooterText),
    websiteUrl: sanitizeText(source.websiteUrl, DEFAULT_BRANDING.websiteUrl),
  };
}
