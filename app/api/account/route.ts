import { cancel } from "@/lib/kwop";
import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { bad, json } from "@/lib/http";

/** Delete my account and all its data (sheets, exports, profile cascade). */
export async function DELETE() {
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  if (user.email) await cancel(user.email).catch(() => null);
  const { error } = await supabaseAdmin().auth.admin.deleteUser(user.id);
  if (error) return bad("Could not delete your account. Try again.", 500);
  return json({ ok: true });
}
