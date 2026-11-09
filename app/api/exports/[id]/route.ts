import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { bad, json, UUID } from "@/lib/http";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  if (!UUID.test(id)) return bad("Not found", 404);
  const { error } = await supabaseAdmin().from("exports").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad("Could not delete. Try again.", 500);
  return json({ ok: true });
}
