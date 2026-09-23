# SKILL-AUDIT.md — MoneyDrive Autonomous Audit & Debug Skill

> **Auto-applied to all MoneyDrive audit, fix, QA, and security dispatches.**
> Encodes best practices from [obra/superpowers](https://github.com/obra/superpowers) and [SocratiCode](https://github.com/giancarloerra/SocratiCode). Every agent handling MoneyDrive code MUST follow these protocols in order.

---

## 1. SYSTEMATIC-DEBUGGING

Never fix what you cannot first reproduce. Follow these four phases in strict sequence:

### Phase 1 — Reproduce
- Identify the exact inputs and conditions that trigger the bug.
- Write the minimal reproduction case before touching any code.
- If you cannot reproduce it, do not guess — gather more information first.

### Phase 2 — Root Cause
- Trace the failure to the deepest possible cause, not the surface symptom.
- Ask "why?" at least 3 times before accepting an explanation.
- Map the full call chain: frontend action → hook → actor call → canister method → state mutation.

### Phase 3 — Defense-in-Depth
- Fix the root cause AND add a guard so the same class of bug cannot recur.
- If the root cause is in Motoko, also check all sibling methods for the same pattern.
- If the root cause is in a React hook, check all other hooks for the same anti-pattern.

### Phase 4 — Verification
- Run the full build pipeline after every fix: `caffeine check --fix && caffeine build`.
- Confirm the reproduction case no longer triggers the bug.
- Check that adjacent code (same file, same actor mixin) still compiles cleanly.

---

## 2. VERIFICATION-BEFORE-COMPLETION

A task is NOT done until these conditions are met:

| Condition | Check |
|---|---|
| Build passes | `caffeine check --fix && caffeine build` exits 0 |
| No TypeScript errors | `tsc --noEmit` passes |
| No new lint warnings | ESLint/Prettier clean |
| Adjacent code checked | Sibling files reviewed for same bug class |
| Reproduction case tested | Confirmed fixed, not just assumed |

**Never declare a task complete with a failing build.** If a typecheck error is introduced as a side effect, fix it in the same commit before returning a result.

---

## 3. SECURITY-AUDIT-METHODOLOGY

Run this checklist on every audit dispatch. Derived from SocratiCode's codebase intelligence approach.

### 3.1 Data Flow Mapping
- Trace every user-supplied value from UI input → hook → actor call → canister state.
- Identify all public-facing canister methods (no `private` keyword, called via `actor.method()`).
- Document: what goes in, what is stored, what is returned.

### 3.2 Public Endpoint Checklist
For every `public` canister method, verify all of:
- [ ] **Authentication**: Is `msg.caller` verified against `driverId` or admin principal?
- [ ] **Rate limiting**: Is there a per-caller daily cap or cooldown?
- [ ] **Input validation**: Are strings length-capped? Are numbers range-checked?
- [ ] **Payload size cap**: Are array/blob inputs bounded (e.g. max 100 items, max 10KB)?
- [ ] **Return data masking**: Are API keys, merchant IDs, or other secrets stripped before returning?

### 3.3 State Mutation Checklist
For every function that writes to canister state, verify:
- [ ] **Caller verification**: `assert(msg.caller == driverId or msg.caller == admin)`
- [ ] **Idempotency**: Can this be called twice with the same inputs without double-writing? (Critical for referral bonuses, payment confirmations)
- [ ] **Overflow guard**: Are Nat additions bounded? Is there a max balance/cap?
- [ ] **Upgrade safety**: Is the backing data structure a `stable var`? Are `preupgrade`/`postupgrade` hooks present?

### 3.4 External Call Checklist
For every HTTP outcall (ElevenLabs, OpenRouter, SnapScan, Tavily, Hunter.io, etc.):
- [ ] **Timeout guard**: Is there a max wait time (≤30s)?
- [ ] **Error handling**: Is the failure case handled gracefully (fallback, not crash)?
- [ ] **Key exposure**: Is the API key fetched from secure canister state, never from frontend?
- [ ] **HMAC verification**: For webhooks (SnapScan), is the signature verified before processing?

### 3.5 Frontend Security Checklist
- [ ] No API keys, SnapScan merchant IDs, or secrets stored in `localStorage` or `sessionStorage`.
- [ ] No PII (driver names, phone numbers, earnings) cached in browser storage.
- [ ] All sensitive data fetched fresh from the actor on each session.
- [ ] `useActor` is the ONLY data source for persistent state — no Context-based stores as primary source.

---

## 4. STRESS-TEST-METHODOLOGY

Run these test vectors against every public canister method and critical UI flow.

### 4.1 Boundary Inputs
| Input type | Test values |
|---|---|
| String | `""`, `"a"`, 255-char string, 10,000-char string, unicode/emoji, SQL/JS injection fragments |
| Number (Nat) | `0`, `1`, `999999999999`, `MAX_NAT` |
| Number (Int) | `-1`, `0`, `MAX_INT`, `MIN_INT` |
| Float (avoid — use Nat) | `0.0`, negative, `NaN` proxy strings |
| Array | `[]`, single item, 1000 items, items with null-like values |
| Optional | `null` (for `?T` args), missing fields |

### 4.2 Concurrent Mutations
- Simulate the same driver calling `logTrip()`, `claimReferralBonus()`, or `confirmPayment()` twice simultaneously.
- Verify idempotency: second call must not double-write state.
- Check for TOCTOU (time-of-check/time-of-use) race conditions in multi-step flows.

### 4.3 Auth Bypass Vectors
- Call every protected mutation with a random/anonymous principal.
- Call driver-scoped methods with another valid driver's principal.
- Call admin-only methods with a driver principal.
- Verify all assertions produce `#err` or `trap`, not silent success.

### 4.4 Payload Size Attacks
- Send 10,000-item arrays to bulk log endpoints (`logPassengerOrder`, `logExpense`, etc.).
- Send 1MB blobs to any endpoint accepting `Blob` or `Text`.
- Verify size caps are enforced before any state write occurs.

### 4.5 Missing/Partial Data
- Call endpoints with all optional fields omitted.
- Send requests with partial structs (missing non-optional fields should fail at type level; verify this).
- Verify graceful error messages, not traps or panics.

---

## 5. MONEYDRIVER-SPECIFIC PATTERNS

These are hard rules for MoneyDrive. Any code that violates these patterns is a bug.

### Backend (Motoko)
| Rule | Enforcement |
|---|---|
| All mutations verify caller | `assert(msg.caller == driverId or isAdmin(msg.caller))` |
| SnapScan webhooks verify HMAC | Reject any webhook without valid signature |
| Currency in Nat only | Never use `Float` for Rand amounts — use `Nat` (e.g. `R15.50` = `1550`) |
| Referral bonuses are idempotent | Use a `Set<(referrer, referee)>` to gate single-credit per pair |
| ElevenLabs/OpenRouter max 30s | Wrap every outcall with a timeout check |
| All HashMap/TrieMap state is stable | Back with `stable var` entries, use `preupgrade`/`postupgrade` |
| logX() functions cap payload | Max 100 items per call, max 10KB per entry |
| No secrets in query returns | Strip API keys, merchant IDs from any `query` method response |

### Frontend (React/TypeScript)
| Rule | Enforcement |
|---|---|
| No secrets in localStorage | SnapScan merchant IDs, API keys must NEVER be cached in browser storage |
| No PII in browser storage | Driver earnings, trip data, personal info fetched fresh from actor |
| useActor is the source of truth | No Context/Redux stores holding canonical data |
| All currency displayed as Rand | Divide Nat storage value by 100 for display: `(amount / 100).toFixed(2)` |
| Every async action has error state | Loading + error + success states required for all mutations |
| Bolt driver sales restriction | UI must show after-trip-only warning for Bolt platform users |

### API / Integration
| Rule | Enforcement |
|---|---|
| ElevenLabs voice ID | Always use `mJZEpDe9qAKz9yOOwCD8` |
| SnapScan webhook URL | Registered in SnapScan dashboard, HMAC verified on receipt |
| Tavily/Hunter.io keys | Stored in admin canister state, never in frontend |
| OpenRouter model selector | Curated list only — no user-controlled model strings passed to API |

---

## 6. AUDIT OUTPUT FORMAT

When completing an audit dispatch, return findings in this structure:

```
## Audit Findings

### CRITICAL (fix before any deployment)
- [HIGH-XXX] <file>:<line> — <description> — <fix>

### IMPORTANT (fix in current sprint)
- [MEDIUM-XXX] <file>:<line> — <description> — <fix>

### HARDENING (fix before next major release)
- [LOW-XXX] <file>:<line> — <description> — <fix>

### PASSED (verified clean)
- <item> — verified
```

Severity mapping:
- **CRITICAL**: Auth bypass, secret exposure, data loss, double-spend
- **IMPORTANT**: Missing validation, idempotency gap, timeout risk, rate-limit missing
- **HARDENING**: Upgrade safety, logging gaps, graceful degradation improvements

---

*This skill file is version-controlled with MoneyDrive. Update it when new patterns are discovered or new attack vectors are identified. Last updated: April 2026.*
