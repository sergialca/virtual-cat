# Virtual assistant

First UI slice: a 2D talking-cat stage (placeholder avatar, talk control, captions). No live voice, auth, or database yet.

## Package manager

Use **pnpm only**. Do not use npm or yarn — they will create the wrong lockfile (`package-lock.json` / `yarn.lock`). Corepack should pick up the `packageManager` field in `package.json`.

```bash
corepack enable
pnpm install
pnpm dev
```

Then open the URL printed by Next.js (this project’s `dev` script uses port **43123**).

Other scripts:

```bash
pnpm lint
pnpm build
pnpm start
```
