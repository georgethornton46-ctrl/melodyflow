import { getUser, supabaseAdmin } from "@/lib/supabase/server";
import { entitlement } from "@/lib/plans-server";
import { toView, type SheetRow } from "@/lib/sheet-view";
import { bad, json, UUID } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID.test(id)) return bad("Not found", 404);
  const device = new URL(req.url).searchParams.get("device");
  const user = await getUser();
  const { data } = await supabaseAdmin().from("sheets").select("*").eq("id", id).maybeSingle();
  if (!data) return bad("Not found", 404);
  const row = data as SheetRow & { device_id: string };
  const mine = (user && row.user_id === user.id) || (!row.user_id && device && row.device_id === device);
  if (!mine) return bad("Not found", 404);
  const { tier } = await entitlement(user && row.user_id === user.id ? user.email : null);
  return json({ sheet: toView(row, !!tier) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  if (!UUID.test(id)) return bad("Not found", 404);
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title.replace(/[<>]/g, "").trim().slice(0, 80) || "Untitled melody";
  if (typeof body.public === "boolean") {
    const { tier } = await entitlement(user.email);
    if (body.public && !tier) return bad("Sharing is part of every plan", 402);
    patch.public = body.public;
  }
  if (!Object.keys(patch).length) return bad("Nothing to change");
  const { data, error } = await supabaseAdmin().from("sheets").update(patch).eq("id", id).eq("user_id", user.id).select("*").maybeSingle();
  if (error || !data) return bad("Not found", 404);
  const { tier } = await entitlement(user.email);
  return json({ sheet: toView(data as SheetRow, !!tier) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return bad("Sign in first", 401);
  if (!UUID.test(id)) return bad("Not found", 404);
  const { error } = await supabaseAdmin().from("sheets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return bad("Could not delete. Try again.", 500);
  return json({ ok: true });
}
