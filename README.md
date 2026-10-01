# Virtual assistant

2D Kinetic Cat stage with talk controls that require the browser microphone. No LiveKit, auth, or database.

Talk does not start capture until `getUserMedia` succeeds. Stop releases the mic track. Captions stay local placeholder copy (including Mochi empty / miss states).

## Package manager

Use **pnpm only**. Do not use npm or yarn — they will create the wrong lockfile (`package-lock.json` / `yarn.lock`). Corepack should pick up the `packageManager` field in `package.json`.

```bash
corepack enable
pnpm install
pnpm dev
```

Then open the URL printed by Next.js (this project’s `dev` script uses port **43123**). Allow or block the microphone from the browser prompt to see the talk states.

Other scripts:

```bash
pnpm lint
pnpm build
pnpm start
```
