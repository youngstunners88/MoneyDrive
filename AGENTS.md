# Project Guidance

## User Preferences

- Always fetch ICP skills before writing Motoko or canister code — skills.internetcomputer.org

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from `src/backend/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Learnings

- Before writing any ICP/Motoko/canister code, fetch the relevant skill from https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.md — fetch index at https://skills.internetcomputer.org/.well-known/skills/index.json first
- Skills relevant to MoneyDrive: https-outcalls (for ElevenLabs/OpenRouter/Tavily/SnapScan), internet-identity (for auth), stable-memory (for Nduna data), motoko (general), llm (AI integration)
- MoneyDrive HTTP outcalls pattern: caffeineai-http-outcalls@0.1.0, is_replicated=?false for non-consensus, 50M-100M cycles, transform=null OK for non-replicated calls
- MoneyDrive persistence: enhanced orthogonal persistence via --default-persistent-actors — no explicit stable keyword needed, all actor vars auto-persist
- Internet Identity mainnet canister ID: rdmx6-jaaaa-aaaaa-aaadq-cai — never hardcode a different ID
- Never store identity/delegation in localStorage — use @icp-sdk/auth built-in session management
- mops.toml verified versions: moc 1.3.0, core 2.2.0, caffeineai packages 0.1.0
