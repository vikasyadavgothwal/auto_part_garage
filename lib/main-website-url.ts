const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const mainWebsiteUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()

  return configuredUrl
    ? trimTrailingSlash(configuredUrl)
    : process.env.NODE_ENV === "production"
      ? "https://websitedesignersdubai.ae"
      : "/"
};
