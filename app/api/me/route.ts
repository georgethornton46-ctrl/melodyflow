import { me } from "@/lib/me";
import { json } from "@/lib/http";

export async function GET() {
  return json({ me: await me() });
}
