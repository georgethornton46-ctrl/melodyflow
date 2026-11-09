import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP = ["/dashboard", "/studio", "/exports", "/settings", "/account", "/pricing"];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = req.nextUrl;

  // Kwop tracked link, intended plan, utm_* → first-party cookies (30 days)
  const cookieOpts = { maxAge: 60 * 60 * 24 * 30, sameSite: "lax" as const, path: "/" };
  const setTracking = (r: NextResponse) => {
    const k = url.searchParams.get("k");
    if (k && /^[A-Za-z0-9]{1,12}$/.test(k)) r.cookies.set("kwop_k", k, cookieOpts);
    const plan = url.searchParams.get("plan");
    if (plan && plan.length <= 40) r.cookies.set("mf_plan", plan.replace(/[^\w \-]/g, ""), cookieOpts);
    const utm: Record<string, string> = {};
    url.searchParams.forEach((v, key) => {
      if (key.startsWith("utm_") && key.length <= 20) utm[key] = v.slice(0, 80);
    });
    if (Object.keys(utm).length) r.cookies.set("mf_src", JSON.stringify(utm), cookieOpts);
    return r;
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return setTracking(res);

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = url.pathname;
  const redirect = (to: string) => {
    const r = NextResponse.redirect(new URL(to, req.url));
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return setTracking(r);
  };
  // logged-in users go straight to the app (unless they come back to finish a try)
  if (path === "/" && user && !url.searchParams.has("resume")) return redirect("/dashboard");
  if ((path === "/login" || path === "/signup") && user) return redirect("/dashboard");
  if (APP.some((p) => path === p || path.startsWith(p + "/")) && !user)
    return redirect(`/login?next=${encodeURIComponent(path + url.search)}`);
  return setTracking(res);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/og|favicon.ico|icon|apple-icon|manifest.webmanifest|vsl.mp4|.*\\.(?:png|svg|jpg|webp|ico|txt|xml)$).*)"],
};
