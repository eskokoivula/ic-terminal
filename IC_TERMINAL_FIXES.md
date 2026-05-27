# IC_TERMINAL.html — Fixes

---

## Fix 1 — Step 04 "IC Output": add description

**Location:** Process section, step 04

**Current:**
```
04   IC Output
     [no description]
```

**Replace with:**
```
04   IC Output
     An IC-ready memo. Conviction score, open risks, and an
     evidence ledger with every claim sourced and typed.
     Regenerates on every new input.
```

---

## Fix 2 — All 4 steps: add secondary monospace line

**Location:** Process section, all steps

**Replace current step copy with:**
```
01   Input                    deck · URL · notes · brief
     Deck, URL, brief, notes, founder claims.

02   Investigation            parallel agents · primary sources
     Agents test every claim across market, product,
     technical, traction, team, and risk.

03   Modeling                 3 scenarios stress-tested
     Economics and assumptions are modelled under
     bear, base, and bull conditions.

04   IC Output                ready for partner vote
     Conviction score, sourced evidence ledger, open
     risks. Regenerates on every new input.
```

---

## Fix 3 — Process section: contextual right-side visual per step

**Location:** Process section, right-side panel

**Current:** same particle animation shown for all 4 steps

**Change:** trigger a different visual as each step enters the viewport:

| Step | Visual |
|---|---|
| 01 Input | Minimal input form — URL field + deck upload area filling in |
| 02 Investigation | 9 agent nodes as parallel graph (reuse from Agent Architecture section below) |
| 03 Modeling | Bear / base / bull scenario chart or burn-multiple table |
| 04 IC Output | IC Memo thumbnail — conviction score + top 3 ledger rows (reuse from IC Memo section below) |

Assets for steps 02 and 04 already exist on the page — scroll-trigger wiring only.

---

## Fix 4 — Investigation copy: rewrite

**Location:** Process section, step 02 description (body copy, not the monospace line)

**Current:**
> "Agents test claims across market, product, technical, traction, team, and risk."

**Replace with:**
> "Every founder claim is tested against primary sources. Agents run in parallel. Contradictions surface automatically. No analyst decides what to skip."

---

## Fix 5 — Footer: remove or rename "TENSION"

**Location:** Footer nav

**Current:** `TENSION · PROCESS · SURFACE · DEMO · OUTPUT · CONTACT`

"TENSION" has no corresponding page section. Remove it or replace with a label that maps to an actual section.

---

## Fix 6 — Problem headline: "Venture" → "Investment"

**Location:** Problem section headline

**Current:** `"Venture diligence still begins with fragments."`

**Replace with:** `"Investment diligence still begins with fragments."`

---

*Fixes 1 and 2 are critical. Fixes 3–6 are high/medium priority.*
