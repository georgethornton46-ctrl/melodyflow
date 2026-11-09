import type { Metadata } from "next";
import { Studio } from "./view";
export const metadata: Metadata = { title: "Studio" };
export default function Page() {
  return <Studio />;
}
