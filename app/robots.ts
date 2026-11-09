import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/s/"], disallow: ["/api/", "/dashboard", "/studio", "/exports", "/settings", "/account", "/pricing", "/dev"] }], sitemap: `${SITE_URL}/sitemap.xml` };
}
