# Mille Bornes (Rally 1000) — Project Agent Instructions

A cozy, mobile-first web re-imagining of the Palm OS classic **Rally 1000**
(a Mille Bornes card game). You race a computer opponent to 1000 km.

This file is authoritative for this repo and supersedes the parent repo's
`AGENTS.md` where they conflict.

## Locked decisions (do not relitigate without asking)

- **v1 = 1v1 vs. a rule-based AI.** No online multiplayer yet — but keep the
  architecture open for it.
- **Match = a single race to exactly 1000 km.** No multi-hand scoring, no
  "Extension" rule.
- **Rules = full Mille Bornes core:** all four card families, hazard/remedy/
  safety triads, coup-fourré, speed limit, max two 200-km cards per player,
  never overshoot 1000. Full spec in `PLAN.md` § Game rules.
- **AI = one rule-based heuristic difficulty.**
- **Stack = TypeScript + Vite. No UI framework.** A pure game engine plus a thin
  DOM/SVG renderer.
- **Art = inline SVG** cards and board; CSS transforms/transitions for motion.
- **i18n = English + Chinese** at launch; architecture must allow more later.
- **Hosting = GitHub Pages now, Cloudflare later.** Keep the build output static
  and portable.
- **UX = mobile-first portrait, one-thumb play.** Desktop is a wider view of the
  same layout.
- **Persistence = localStorage** for in-progress games.
- **Audio = no copyrighted assets.** Now: an `AudioManager` stub + Web Audio SFX.
  Later: a cozy CC0 (or self-composed) background loop.

## Feedback loops (always run, always green)

The engine is pure logic and must be fully unit-tested. Before every commit:

```bash
pnpm typecheck   # tsc
pnpm test        # vitest
pnpm lint        # eslint
pnpm format      # prettier
```

Husky + lint-staged enforce these in a pre-commit hook. If a hook fails, fix the
code — do **not** bypass with `--no-verify`.

## Architecture principles

- Game rules live in `src/engine/` with **zero DOM/browser dependencies**.
  Every rule is a pure function over an immutable game state.
- `src/ui/` renders state and dispatches intents. The UI never computes rules.
- Model the game as a **state machine**: explicit states (draw, play/discard,
  coup-fourré, game-over) and explicit transitions. This is what makes a future
  online/multiplayer port feasible.
- Shape the core as `applyAction(state, action) -> state`. Keep it pure,
  deterministic, and unit-testable.

## Conventions

- Commit messages: short imperative summary, one logical change per commit
  (e.g. `add coup-fourré resolution`).
- Tests live beside the engine (`*.test.ts`) and cover every rule, including
  edge cases (overshoot prevention, two-200 limit, coup-fourré timing).
- Before any `gh` command: `gh auth switch --user piiaho`; switch back to
  `horaceho` when finished.
- When a rule is ambiguous, check `PLAN.md` first; if still ambiguous, ask
  before coding.

## Rules source of truth

Mille Bornes (1954, Edmond Dujardin). Deck = 106 cards: 46 distance, 18 hazard,
38 remedy, 4 safety. Full breakdown in `PLAN.md`.
