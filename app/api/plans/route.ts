import { publicPlans } from "@/lib/plans-public";
import { bad, json } from "@/lib/http";

export async function GET() {
  try {
    return json({ plans: await publicPlans() });
  } catch {
    return bad("Plans are loading. Try again in a moment.", 503);
  }
}
