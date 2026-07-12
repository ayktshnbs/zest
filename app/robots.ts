// robots.txt: index the storefront, keep private/transactional areas out.

import type { MetadataRoute } from "next";

const SITE_URL = "https://www.zesthome.net";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/hesabim",
          "/odeme",
          "/sepet",
          "/favoriler",
          "/giris",
          "/uye-ol",
          "/sifre-sifirla",
          "/e-posta-dogrula",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
