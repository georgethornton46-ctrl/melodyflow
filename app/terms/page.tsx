import type { Metadata } from "next";
import { Legal } from "@/components/landing/Legal";
export const metadata: Metadata = { title: "Terms", description: "The terms for using MelodyFlow." };
export default function Terms() {
  return (
    <Legal title="Terms of Service" updated="November 9, 2026">
      <p>These terms cover your use of MelodyFlow. By using it, you agree to them. They&apos;re short on purpose.</p>
      <h2>What MelodyFlow does</h2>
      <p>MelodyFlow turns a recording of a single melody (humming, singing, whistling or one instrument) into a song sheet: notes, guitar tab, a detected key and suggested chords. The result is generated automatically. It can simplify or miss fast notes, so check it by ear before you rely on it.</p>
      <h2>Your account</h2>
      <ul>
        <li>You need to be at least 13 years old to create an account.</li>
        <li>Keep your password safe. You&apos;re responsible for what happens in your account.</li>
        <li>Free use is limited to 3 song sheets a day, to keep the service fast for everyone.</li>
      </ul>
      <h2>Your music is yours</h2>
      <p>You keep every right to the melodies you record and the song sheets made from them. We only store what we need to show you your sheets. Only record music you have the right to use.</p>
      <h2>Plans and payments</h2>
      <ul>
        <li>Paid plans renew automatically every month or year until you cancel. Prices are in US dollars.</li>
        <li>Payments are processed by Whop through Kwop. We never see or store your card.</li>
        <li>You can cancel at any time from Account → Billing. You keep your plan until the end of the period you paid for.</li>
        <li>Each plan has a monthly number of song sheets. Unused song sheets don&apos;t roll over.</li>
      </ul>
      <h2>Fair use</h2>
      <p>Don&apos;t try to break, overload or reverse-engineer the service, or use it to harm others. We may suspend accounts that do.</p>
      <h2>No guarantee</h2>
      <p>MelodyFlow is provided as is. We work hard to keep it accurate and online, but we can&apos;t promise it will be perfect or always available. To the extent the law allows, our liability is limited to what you paid us in the last 12 months.</p>
      <h2>Changes</h2>
      <p>If we change these terms in a way that matters, we&apos;ll tell you in the app before it applies.</p>
      <h2>Contact</h2>
      <p>Questions? Reply to any email from us or write to the address on our Kwop page.</p>
    </Legal>
  );
}
