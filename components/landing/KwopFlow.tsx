import Script from "next/script";
/** Kwop's visit tracking: public pages only (landing, sign-up, log-in). */
export function KwopFlow() {
  return <Script src="https://kwop.io/flow.js" data-site="s_3c45ce0d54" strategy="afterInteractive" />;
}
