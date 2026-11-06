# SOLWorld & SOLREViBE (`SOL-World`) — Agent & Co-Editing Rules

## 1. Ownership & Multi-Site Deployment Context
- **Repository**: `gerardrickjardin/SOL-World` (`origin/main`)
- **Co-Developers**:
  - **Lucas Huff** (`@LucasSOLT`, `233151608+LucasSOLT@users.noreply.github.com`) — Owner / Lead Developer
  - **Gerard Rick Jardin** (`@gerardrickjardin`, `gerard@soltheory.com`, `gerardrickjardin@gmail.com`) — Coworker / Co-Developer
- **Vercel Projects (Team Scope: `gerard-6963s-projects`)**:
  1. **SOLWorld** (`sol-world`, Root Directory = `/`) → `https://sol-world.vercel.app`
  2. **21 Games / SOL GaMES** (`sol-world`, Subpath `/solgames/`) → `https://sol-world.vercel.app/solgames/` (built from `../21-Games-Website`)
  3. **SOLREViBE** (`sol-revibe`, Root Directory = `solrevibe`) → `https://www.solrevibe.com`
  4. **SOL Drive** (`sol-world`, Subpath `/soldrive/`) → compiled from `soldrive_src/` via `.github/workflows/build-soldrive.yml`

---

## 2. Mandatory Co-Editing & Build Guardrails

1. **Pre-Edit Pull**:
   ```bash
   git fetch origin
   git status
   git pull --rebase origin main
   ```
2. **Root `SOL-World` Build (`dist/` & `public/` Tracked in Git)**:
   - Run `npm run build` (`node build.js`) after editing root `SOL-World` files.
   - **CRITICAL SECRET SAFETY**: `SOL-World/build.js` replaces `%VITE_ELEVENLABS_API_KEY%` and `%VITE_GEMINI_API_KEY%` with environment variable values inside tracked `dist/` and `public/` files. Never run `node build.js` with raw production API keys exported in your shell prior to `git commit`.
3. **Blanket `*.png` Rule in `.gitignore`**:
   - `.gitignore` contains `*.png`. Whenever you add a new `.png` asset anywhere in `SOL-World`, `solrevibe/`, or `solgames/`, you **must** force-stage it:
     ```bash
     git add -f path/to/image.png
     ```
4. **`solrevibe/` Dual-Route HTML Files**:
   - Inside `solrevibe/`, both `customer.html` (uses `assets/...`) and `customer/index.html` (uses `../assets/...`) are tracked in Git and are **not** synced by `build.js`.
   - The same applies to `order.html` + `order/index.html` and `roi-calculator.html` + `roi-calculator/index.html`.
   - Always update both the `.html` file and its `<slug>/index.html` counterpart (preserving `assets/` vs `../assets/` relative paths) when editing those pages.
5. **`solgames/` (21 Games Static Export)**:
   - Do **not** hand-edit compiled chunks in `solgames/`. Make source edits in `/Users/lucashuff/.gemini/antigravity/scratch/21-Games-Website` and run `npm run deploy:solworld` to regenerate `solgames/`.
6. **`soldrive_src/` Auto-Commit Workflow**:
   - Pushing to `soldrive_src/**` triggers `.github/workflows/build-soldrive.yml`, which auto-commits compiled assets back to `main`. Always run `git pull --rebase origin main` after pushing `soldrive_src` changes.
