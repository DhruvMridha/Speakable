# Speakyy

Speakyy is a voice-based language-practice MVP built with TanStack Start, React, and TypeScript. The browser's speech-recognition API captures learner speech, server functions send the transcript and conversation context to Gemini, and a server function synthesizes the tutor reply with Rime Coda.

## Requirements

- Node.js 22.6 or newer (the tests import TypeScript modules using Node's type stripping)
- npm
- A Gemini API key and a Rime API key for live tutor responses and audio
- A browser with the Web Speech Recognition API for spoken input (support varies by browser and device)

## Run locally

```powershell
npm install
Copy-Item .env.example .env
```

Set `GEMINI_API_KEY` and `RIME_API_KEY` in `.env`, then run:

```powershell
npm run dev
```

Open the URL printed by Vite. To preview the production Cloudflare build instead, run:

```powershell
npm run build
npm run preview
```

Do not commit `.env`; `.env.example` contains placeholders only.

## Checks

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

The tests cover browser-local session persistence and timestamp-derived duration. They do not test microphone hardware, browser permissions, or external provider connectivity.

## Data and integrations

- Learner language and practice defaults, session transcripts, and generated feedback are stored in the current browser's `localStorage` (up to 50 sessions). There is no authentication or database, and data does not sync across devices.
- Corrections and suggested phrases are shown only when generated from a real session transcript. Speakyy does not calculate proficiency scores, streaks, or long-term improvement.
- Rime Coda is configured with documented speakers for the supported languages: `astra` (English), `lark` (Spanish), `aurelie` (French), and `nadi` (Hindi).
- The LiveKit worker under `src/agent` is a separate, English-only integration and is not used by the browser practice flow. It has not been verified as a connected agent deployment.

## Deployment

The Vite configuration uses the repository's Lovable TanStack configuration, which currently selects Nitro's Cloudflare target. Before deploying:

1. Provide `GEMINI_API_KEY` and `RIME_API_KEY` as server-side environment secrets in the hosting environment. Never use `VITE_` prefixes for these keys.
2. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` in an environment with adequate disk space.
3. Confirm the Cloudflare account and deployment target, then deploy the generated worker with `npx wrangler deploy --config .output/server/wrangler.json` or use the existing Lovable-connected deployment flow. The Wrangler configuration is generated during build, not checked into source control.
4. After deployment, manually verify microphone permission, repeated turns, Gemini responses, language-matched Rime audio, session completion, and results/history on the production origin.

Local browser storage is origin-specific and is not a substitute for account-backed persistence. Add a database and authentication only when cross-device history is required and the project has the necessary configuration.