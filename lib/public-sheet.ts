import "server-only";
import { supabaseAdmin } from "./supabase/server";
import { toView, type SheetRow } from "./sheet-view";
import { UUID } from "./http";

export async function publicSheet(id: string) {
  if (!UUID.test(id)) return null;
  try {
    const { data } = await supabaseAdmin().from("sheets").select("*").eq("id", id).eq("public", true).maybeSingle();
    return data ? toView(data as SheetRow, true) : null;
  } catch {
    return null;
  }
}
