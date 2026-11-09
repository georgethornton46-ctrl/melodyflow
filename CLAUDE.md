# MelodyFlow — project memory

> From Voice Note to Sheet Music Instantly. Hum or play a melody → a clean song sheet (notes, guitar tab, chords) you can export, transpose and share.
> Built with the Kwop method (try-first funnel, paywall over the user's own result, embedded Whop checkout through Kwop). Market: United States. Language: English. Currency: USD.

## RESULT
**RESULT = "your song sheet"**
- Main button everywhere: **"Make my song sheet"** (arrow nudges).
- Creating screen: "Writing your song sheet…"
- Paywall title: "Your song sheet is ready." + personal line ("8 bars in A minor · 34 notes · 96 BPM — your melody, written down.")
- Unlock button: **"See my full sheet"** · sticky bar "See my full sheet · $0.30 / day"
- Sign-up sheet headline: "Save your song sheet"
- Notifications/emails speak of "your song sheet".

## Step 0 — what already sells (research, Nov 2026)
The brief named Soundbrenner and RoadRunner: **neither does this job** (Soundbrenner = metronome/wearable, RoadRunner/Roadie = tuner). Replaced with the three apps that really turn audio into notation:

| App | Landing | Sign-up / first result | Paywall | Plans |
|---|---|---|---|---|
| **Klangio Melody Scanner** (web + iOS) | "Turn music into sheet music", upload/record/YouTube in the hero, button "Transcribe" | Upload works before account; account to save | After the result: export formats other than PDF + longer sheets are locked | Free: 1-min recordings, 40 bars, PDF. Premium $5.99/mo · $44.99/yr |
| **ScoreCloud** (desktop + web) | "Turn your songs into sheet music", sing/play → score | Download app / account first | Pricing page, features gated | Free · Plus $4.99 · **Songwriter $10.99** (sing+play, lead sheets) · Pro $19.99 |
| **Songscription** (web) | "AI music transcription", drop zone in hero, "Try it free" | Upload → result in browser, 30-s free transcriptions | Longer audio + MIDI/MusicXML/Guitar Pro export gated | Free (30 s) · Plus (credits ≈ 300 min/mo) · Enterprise |

**Model picked: Songscription's structure** (drop zone in the hero, result in place, gating on length & export) + Kwop rules on top (no prices on landing, paywall over the user's own blurred result, per-day prices, embedded checkout). Market price point for hobbyists: **$5–11/month**, songwriter tier ≈ $10–11.

## Funnel type: TRY FIRST — and why
A hum is 10 seconds of effort and the result is computed in the browser + server in ~4 s with no AI cost, so the hero IS the product: record or upload, watch the notes appear, see the sheet half-blurred. No account before value.

### How the engine really works (no fake data)
1. **In the browser**: the take (mic recording via MediaRecorder/Web Audio, or an uploaded voice memo: m4a/mp3/wav/webm) is decoded with `AudioContext.decodeAudioData`, downmixed to mono, and a **YIN pitch tracker** extracts f0 + loudness every 10 ms (`lib/pitch.ts`). **The audio never leaves the device**; only the pitch curve (numbers) is sent.
2. **On the server** (`lib/music.ts`, `/api/transcribe`): segment notes (pitch stability + onsets), estimate tempo, quantize to a 16th grid, detect the key (Krumhansl–Schmuckler profiles), pick one diatonic chord per bar (template matching on the bar's pitch classes), compute guitar tab positions (standard tuning, lowest comfortable fret) and piano staff positions. Saved in `sheets`.
3. Locked view: the server only returns **bar 1–2 in clear** (notes + tab), the tempo, the waveform and the note count; for the locked bars it returns only a coarse **pitch contour** (real, rounded, no note names) that is drawn blurred; **key and chords are withheld** until paid.
4. "Try an example": a short built-in melody is synthesized in the browser (OfflineAudioContext, a sine/triangle "hum") and goes through the exact same pipeline.

## The funnel, screen by screen (exact copy)
1. **Landing hero** (`/`): label `[ VOICE MEMO → SONG SHEET ]`. Title: **"Hum it. Get the sheet music."** line 2 (grey gradient): "In 5 seconds." Sub: "Sing, hum or play a melody. MelodyFlow writes the **notes**, the **guitar tab** and the chords." The **Recorder card**: a big lime record button with a live waveform ring ("Tap to record · up to 30 s"), "Upload a voice memo" (file input, `accept="audio/*"`, opens Voice Memos/Files on iPhone), and chip "▶ Try an example (Twinkle-style hum)". Under: mono line "Your audio stays on your device · Free to try · No card".
2. **Recording**: timer, live waveform, "Stop & make my song sheet".
3. **The work** (in place, ≥3 s): steps tick one by one — "Listening to your take", "Finding every pitch", "Locking the tempo", "Detecting the key", "Matching the chords", "Writing notes & tab"; percent counts to 99 % until the server answers; then "Your song sheet is ready." with a lime pulse.
4. **Teaser (locked result)** in the hero card: their waveform (clear) · "34 notes · 96 BPM · 8 bars" (clear) · one clear insight ("Your melody spans 9 semitones — easy to sing.") · **bars 1–2 as staff + tab in clear** · bars 3+ and the chord line blurred behind a gradient with a lock · big blurred "Key: ■ ■ ■" card. Button **"See my full sheet"**.
5. **Sign-up sheet** (no account): "Save your song sheet" → Continue with Google / email+password → on success the try is attached to the account (device id) → **paywall opens immediately**.
6. **Paywall sheet** over the locked sheet: ✕ · "Your song sheet is ready." · personal line · "Choose your plan." + Monthly/Yearly (−20 %) · 3 radio cards (per-day price big) · "Continue with Pro" · "$X due today, then every month · Cancel anytime" · "Secure payment, processed by Whop" chips · "What you unlock with <Plan>" · 3 FAQs · small print · bottom repeat "Pick up where you left off".
7. **Checkout sheet** (Whop embedded via Kwop) → `onComplete` → `/api/checkout/confirm` → **unlock film** (3 scenes, 5 s) → the sheet unblurs in place.
8. Returning visitor: logged-in → `/dashboard`; if unpaid, dashboard shows their latest locked sheet with the sticky unlock bar.

## Plans & quotas (counted on the server per billing period, table `sheets` + `exports`)
Plans come from `GET KWOP_API` (names/ids/prices never hardcoded). Quotas are mapped by plan **rank** (cheapest → 0) in `lib/plans.ts`:

| Rank | Tag | Song sheets / month | Take length | Unlocks |
|---|---|---|---|---|
| 0 (Starter) | For catching ideas | 20 | 30 s | Full sheet (notes + tab + chords + key), PDF export, 30-day history |
| 1 (Pro) — Most popular | For writing real songs | 60 | 2 min | + Key Changer (all 12 keys, capo hint), unlimited history |
| 2 (Studio) | For bands & producers | 150 | 5 min | + MIDI & MusicXML export, compare takes side by side |

Free (no plan): 3 tries a day (device + IP, also when signed in), 30 s, result locked after bar 2.
### Prices (owner chose "keep" in step 0c — saved in Kwop, ids unchanged)
- **Starter** (1621) $5/mo = $0.17/day · yearly $48 ($0.13/day) — rank 0, tag "For catching ideas"
- **Pro** (1622) $9/mo = $0.30/day · yearly $86 ($0.24/day) — rank 1, **Most popular**, tag "For writing real songs"
- **Studio** (1623) $15/mo = $0.50/day · yearly $144 ($0.39/day) — rank 2, tag "For bands & producers"
Kwop feature lists were rewritten to honest ones (no stem separation / multi-track). Share links are on every paid plan.

## Visual direction (Music: dark & vibrant)
- Colors: bg `#060606`, surface `#0E0F0C`, card `#141511`, border `rgb(255 255 255 / .09)`, text `#F4F5EF`, muted `#9A9C92`, **brand lime `#C8FF3D`** (buttons, notes, ring), accent coral `#FF6B4A` (record dot, "live"), accent violet-blue `#5B6CFF` used only inside deep gradients (album-card backgrounds), light sections `#FAFAFA` with ink `#0B0B0A`.
- Fonts: **Space Grotesk** (display + body, 400–700) and **JetBrains Mono** (labels `[ LIKE THIS ]`, tab numbers, counts).
- 3 signature elements: (1) **the waveform ring** around the record button (live from the mic), (2) **the song-sheet card** — an album-like card with a gradient top, staff with lime noteheads and tab lines drawn in SVG, (3) **the piano-roll lane** — pitch bars sliding in during the work screen.
- Kwop-grade kit: dot grid hero with ellipse mask + top glow, floating rounded top bar (≤980 px), breathing pill CTA (60–68 px, glow 3.6 s, arrow nudge 2.6 s, press 95.5 %), reveals 14 px / 0.5 s cubic-bezier(.22,.8,.24,1) stagger 60 ms, count-ups 1.3 s, giant faded wordmark footer, prefers-reduced-motion respected.
- Magic moment on the landing page: the live recorder itself (try first) + the VSL right under it.

## Information architecture
- Public: `/`, `/signup`, `/login`, `/forgot`, `/reset`, `/terms`, `/privacy`, `/s/[id]` (public share page of a sheet when shared), `/pricing` (logged-in only; never linked from landing).
- App (sidebar desktop / bottom tabs phone): **Dashboard** (`/dashboard`: latest sheet, quota meter, quick record), **Studio** (`/studio`: record/upload + list of sheets; `/studio/[id]`: the sheet with Key Changer, chords, tab/notes toggle, rename, delete, share, export), **Exports** (`/exports`: history of PDF/MIDI/MusicXML downloads, re-download, delete), **Settings** (`/settings`: default view tab/notes/both, instrument, notation prefs), **Account** (`/account`: profile, plan & billing, change plan, cancel, delete account).
- Features → places: Voice Transcription = Studio; Chord Finder = chord line in every sheet; Export to PDF = sheet page + Exports; Key Changer = sheet page toolbar.

## Kwop API (server only, `lib/kwop.ts`)
`KWOP_API` env var (never in browser). GET plans · POST /checkout {plan, period, email, k} → {embed, ref, fallback_url} (409 payments_off) · POST /confirm {ref} · GET /plan?email= (cached 60 s; `getPlan(email, {fresh})`) · POST /cancel {email, except_ref?} · POST /event (fire & forget: signup, onboarding_done, aha, paywall_view, feature_used) · POST /connect {url}. `?k=` → cookie `kwop_k` (30 d) → `profiles.kwop_k`. flow.js only on `/`, `/signup`, `/login`.

## Data (Supabase, RLS on every table, `supabase/migrations`)
- `profiles` (id = auth uid, email, display_name, kwop_k, intended_plan, source, settings jsonb, answers jsonb, last_plan jsonb)
- `sheets` (id, user_id null for anonymous, device_id, ip_hash, title, data jsonb (notes, bars, key, chords, tempo), contour, waveform, duration, created_at, public bool)
- `exports` (id, user_id, sheet_id, format, key, created_at)
- Anonymous tries are written by the server with the service role; claimed at sign-up by device id.

## Tech
Next.js App Router + TS + Tailwind + shadcn-style components (local, in `components/ui`) + framer-motion + lucide-react. Supabase (Postgres + Auth). Vercel. No Gemini: the engine is DSP (no AI cost, no key needed).

## Verification loop (after every feature)
`npm run dev` → `node scripts/shot.mjs <path>` (Playwright screenshots 390×844 and 1440×900 into `.shots/`) → look at every image, console must be clean → fix → 3 passes → commit. `tests/e2e.spec.ts` covers landing → example → work → locked → sign-up → paywall → checkout sheet opens (never pay) → close → account. Run on phone + desktop before every deploy.

## Decisions log
- No Gemini key needed: transcription is deterministic signal processing, so it is free to run, private (audio stays on device) and works offline in the browser.
- No "Stem separation"/"Multi-track" (would need GPU audio models we don't run); replaced by honest features we ship (MIDI/MusicXML export, compare takes).
- Language menu: English only, so none in the top bar.
