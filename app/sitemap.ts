import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/signup", "/login", "/terms", "/privacy"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly", priority: p ? 0.5 : 1 }));
}
