import type { Metadata } from "next";
import { Legal } from "@/components/landing/Legal";
export const metadata: Metadata = { title: "Privacy", description: "What MelodyFlow keeps, and why." };
export default function Privacy() {
  return (
    <Legal title="Privacy Policy" updated="November 9, 2026">
      <p>The short version: your recordings never leave your device, we keep as little as we can, and you can delete everything in two taps.</p>
      <h2>Your recordings</h2>
      <p>When you record or upload audio, it is analyzed right in your browser. <b>The audio itself is never uploaded or stored.</b> Only the pitch curve (numbers describing which notes you sang and when) and a small waveform picture are sent to our server to write your song sheet.</p>
      <h2>What we keep</h2>
      <ul>
        <li>Your email address, and your name if you add one or sign in with Google.</li>
        <li>Your song sheets (notes, tempo, key, chords, title) and your export history.</li>
        <li>Your settings and basic usage (how many song sheets you made this month), to apply your plan&apos;s limits.</li>
        <li>Before you sign up: a random device id stored in your browser, and a one-way hash of your IP address, used only to limit free tries to 3 a day.</li>
        <li>If you came from a creator&apos;s link, the short code of that link, so the creator can be credited.</li>
      </ul>
      <h2>Payments</h2>
      <p>Payments are handled by Whop through Kwop. We receive whether you have an active plan and when it renews. We never see your card details.</p>
      <h2>Services we use</h2>
      <ul>
        <li>Supabase: database and sign-in (United States).</li>
        <li>Vercel: hosting.</li>
        <li>Kwop: plans, payments and visit analytics by Kwop on our public pages (home, sign-up, log-in). It is not used inside the app.</li>
        <li>Google: only if you choose &ldquo;Continue with Google&rdquo;.</li>
      </ul>
      <p>We don&apos;t sell your data, and we don&apos;t use your melodies to train AI models.</p>
      <h2>Your choices</h2>
      <ul>
        <li>Delete any song sheet from its page.</li>
        <li>Delete your whole account and all its data from Account → Delete my account.</li>
        <li>Shared links are off by default. You choose which sheets are public, and you can turn a link off at any time.</li>
      </ul>
      <h2>Cookies</h2>
      <p>We use first-party cookies to keep you signed in and to remember which link you came from (30 days). No advertising cookies.</p>
      <h2>Contact</h2>
      <p>For any privacy question or request, write to us from the email on your account.</p>
    </Legal>
  );
}
