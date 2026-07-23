const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const mainWebsiteUrl = () => {
  if (
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
  ) {
    return "http://localhost:3001";
  }

  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://websitedesignersdubai.ae",
  );
};
