# PLAN — Mille Bornes (Rally 1000)

## Vision

A cozy, minimalist web re-imagining of the Palm OS classic **Rally 1000** — a
Mille Bornes card game. You sit in a calm, warm card game against one computer
opponent and race to exactly 1000 km. Modern polished SVG cards, faithful to the
original mechanics, designed to feel great on a phone held in one hand.

## Non-goals (v1)

- ❌ Online multiplayer (architecture stays open for it).
- ❌ Multi-hand scoring to 5000 points; the "Extension" rule.
- ❌ Multiple AI difficulty levels.
- ❌ Native iOS/Android app (PWA now; Capacitor is a later bridge).

## Locked decisions

| Question | Decision |
| --- | --- |
| Opponent model | 1v1 vs. rule-based AI |
| Match structure | Single race to exactly 1000 km |
| Rules | Full core Mille Bornes (no Extension, no multi-hand scoring) |
| AI | One rule-based heuristic difficulty |
| Stack | TypeScript + Vite, no UI framework |
| Rendering | Inline SVG + CSS animation |
| i18n | English + Chinese at launch |
| Hosting | GitHub Pages → Cloudflare later |
| UX | Mobile-first portrait, one-thumb |
| Persistence | localStorage |
| Audio | CC0/self-composed music; Web Audio SFX |

## Game rules (spec)

**Goal.** Be first to reach **exactly 1000 km** (never overshoot).

**Deck (106 cards).**

- Distance (46): 25×10, 50×10, 75×10, 100×12, 200×4
- Hazards (18): Stop×5, Speed Limit×4, Out of Gas×3, Flat Tire×3, Accident×3
- Remedies (38): Roll×14, End of Limit×6, Gasoline×6, Spare Tire×6, Repairs×6
- Safeties (4): Right of Way, Extra Tank, Puncture-Proof, Driving Ace (×1 each)

**Setup.** Shuffle, deal 6 cards each, form draw + discard piles.

**Turn.** Draw 1 (while the pile lasts) → then **play 1 or discard 1** (hand
returns to 6). If no legal play, you must discard. After the deck empties, skip
the draw and keep playing/discarding one card per turn.

**Tableau.** Four areas per player:

- **Battle** (stacked): Stop/Roll, Out of Gas/Gasoline, Flat Tire/Spare Tire,
  Accident/Repairs — only the top card matters.
- **Speed**: Speed Limit / End of Limit.
- **Distance**: km cards, summed.
- **Safety**: the four safeties along the top.

**Legal plays.**

- *Distance* — only if "moving" (a Roll is showing in Battle, or Right of Way is
  active). May not exceed 1000 km total. While speed-limited, only 25/50 km.
  Max two 200-km cards per player.
- *Remedy* — on its matching hazard.
- *End of Limit* — on a Speed Limit.
- *Hazard* — on the opponent only if the opponent is "moving" and hasn't played
  the matching safety. Exception: Speed Limit may be played even if the
  opponent isn't moving.
- *Roll* — if a Stop or a remedy is showing, or Battle is empty.
- *Safety* — anytime. Then **draw immediately and play again**. A safety both
  corrects the matching hazard and prevents future ones of that type.
- *Discard* — always allowed (even with a legal play available).

**Right of Way.** Prevents and clears both Stop and Speed Limit; makes you
"moving" without needing a Roll. Still vulnerable to the other hazards.

**Coup Fourré.** When the opponent plays a hazard and you hold the matching
safety, you may immediately play it (sideways in the Safety area), the hazard is
discarded (revealing the Roll beneath), and you draw + play again. Must be
declared before the next play. In 1v1, this effectively means you steal the turn.

**Winning.** First to exactly 1000 km wins. If the deck exhausts and no one
reaches 1000, play out the hands; the higher distance wins (tie = draw).
*(Edge case — confirm against original Rally 1000 behavior if strict fidelity is
required; the standard-rule default above is acceptable for v1.)*

**Deferred (future).** Scoring (safety 100, all-four 300, coup-fourré 300,
trip 400, shutout 500, etc.) is a later milestone; v1 is a pure race.

## Architecture

```
src/
  engine/        pure rules — no DOM, no browser APIs
    types.ts     card & state types
    deck.ts      deck factory + shuffle
    rules.ts     legal-move computation
    game.ts      state machine + applyAction(state, action) -> state
    ai.ts        rule-based heuristic opponent
    score.ts     (deferred) point scoring
  ui/            thin DOM/SVG renderer
    render.ts    state -> DOM
    cards.ts     SVG card components
    tableau.ts   battle/speed/distance/safety areas
    input.ts     touch/click -> intents (actions)
  audio/         AudioManager + SFX
  i18n/          en.ts, zh.ts dictionaries
  app/           engine↔ui wiring, localStorage persistence, PWA registration
```

**Principle:** the engine is the asset; the UI is disposable. Engine code must
stay importable in Node (for tests) with no build step beyond `tsc`.

## Tech stack & tooling

- **pnpm**, **TypeScript** (strict), **Vite**, **Vitest**
- **ESLint** (typescript-eslint), **Prettier**, **husky** + **lint-staged**
- **PWA**: manifest + service worker + icons (installable, offline)
- **Deploy**: GitHub Actions builds `dist/` and publishes to GitHub Pages
  (static output stays portable for Cloudflare later)

Feedback loops (per aihero.dev): `tsc` typecheck, Vitest, and pre-commit hooks
are the guardrails for AI-written code.

## Milestones

- **M0 — Scaffold & feedback loops.** Walking skeleton: Vite+TS, all checks
  wired, husky, PWA stub, CI deploy of a placeholder page.
- **M1 — Rules engine.** Full spec above as pure, unit-tested logic.
- **M2 — UI & board.** SVG cards, tableaus, turn flow, one-thumb layout, EN/ZH.
- **M3 — AI opponent.** Heuristic play: distance gain, blocking, remedy/safety
  judgment, card counting.
- **M4 — Polish & ship.** PWA complete, localStorage save/resume, SFX + cozy
  music, animation, accessibility, GitHub Pages release.

## Risks & open questions

- **Fidelity details.** Hand size (6), 1000-km goal, and deck composition above
  are standard Mille Bornes. The original Palm build may vary slightly — verify
  if strict fidelity matters before M1.
- **Copyright.** Game mechanics aren't copyrightable, but all art, audio, and
  names must be original or CC0. No Mille Bornes trademark or card art.
- **Music.** Must source a CC0/licensed cozy loop or compose one in M4.
- **Future multiplayer.** The state-machine engine is designed for it, but a
  server/authority layer is a separate future project.
