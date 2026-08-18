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

## Game rules

The complete, authoritative behavior spec lives in **`SPEC.md`** — deck, turn
structure, state machine, every rule, edge cases, and testing seams. This plan
records only *decisions*; for *behavior*, read `SPEC.md`.

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
  boot/          engine↔ui wiring, localStorage persistence, PWA registration
```

**Principle:** the engine is the asset; the UI is disposable. Engine code must
stay importable in Node (for tests) with no build step beyond `tsc`. The state
machine and the engine's public API (`legalMoves`, `applyAction`) are specified
in `SPEC.md` § State machine.

## Tech stack & tooling

- **pnpm**, **TypeScript** (strict), **Vite**, **Vitest**
- **ESLint** (typescript-eslint), **Prettier**, **husky** + **lint-staged**
- **PWA**: manifest + service worker + icons (installable, offline)
- **Deploy**: GitHub Actions builds `app/` and publishes to GitHub Pages
  (static output stays portable for Cloudflare later)

Feedback loops (per aihero.dev): `tsc` typecheck, Vitest, and pre-commit hooks
are the guardrails for AI-written code.

## Milestones

- **M0 — Scaffold & feedback loops.** Walking skeleton: Vite+TS, all checks
  wired, husky, PWA stub, CI deploy of a placeholder page.
- **M1 — Rules engine.** SPEC.md as pure, unit-tested logic.
- **M2 — UI & board.** SVG cards, tableaus, turn flow, one-thumb layout, EN/ZH.
- **M3 — AI opponent.** Heuristic play: distance gain, blocking, remedy/safety
  judgment, card counting.
- **M4 — Polish & ship.** PWA complete, localStorage save/resume, SFX + cozy
  music, animation, accessibility, GitHub Pages release.

## Risks & open questions

- **Fidelity details.** Hand size (6), 1000-km goal, and deck composition (see
  SPEC.md) are standard Mille Bornes. The original Palm build may vary slightly
  — verify if strict fidelity matters before M1.
- **Copyright.** Game mechanics aren't copyrightable, but all art, audio, and
  names must be original or CC0. No Mille Bornes trademark or card art.
- **Music.** Must source a CC0/licensed cozy loop or compose one in M4.
- **Future multiplayer.** The state-machine engine is designed for it, but a
  server/authority layer is a separate future project.
