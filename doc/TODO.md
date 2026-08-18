# TODO — Mille Bornes (Rally 1000)

Scope & progress tracker. Work top-down; keep the current milestone checked off
before moving on. `[x]` = done, `[ ]` = not done.

## M0 — Scaffold & feedback loops ✅

- [x] `git init` repo, `.gitignore`, README
- [x] pnpm + Vite + TypeScript (strict) scaffold
- [x] scripts: `dev`, `build`, `typecheck` (tsc), `test` (vitest), `lint`, `format`
- [x] husky + lint-staged pre-commit hook running typecheck/test/lint/format
- [x] ESLint + Prettier config
- [x] PWA skeleton (manifest + service worker + icon)
- [x] GitHub Actions: build `app/` → deploy to GitHub Pages
- [x] verify: clean build, all checks green, placeholder page live

## M1 — Rules engine (pure, tested) ⬅️ NEXT

- [ ] card & state types (`engine/types.ts`)
- [ ] 106-card deck factory + shuffle (`engine/deck.ts`)
- [ ] deal 6/6, draw & discard piles
- [ ] immutable state + `applyAction(state, action)` (`engine/game.ts`)
- [ ] legal-move computation: distance / remedy / hazard / roll / safety / discard (`engine/rules.ts`)
- [ ] speed limit (25/50 cap) + two-200 cap + no-overshoot
- [ ] safety semantics incl. Right of Way (clears Stop/Speed Limit, moving w/o Roll)
- [ ] coup-fourré (immediate, horizontal, discard hazard, draw + replay, turn steal)
- [ ] win condition (exactly 1000 km) + deck-exhaustion tiebreak
- [ ] unit tests covering every rule + edge cases

## M2 — UI & board

- [ ] SVG card set (25/50/75/100/200, 5 hazards, 5 remedies, 4 safeties) — cohesive cozy theme
- [ ] tableau layout (battle / speed / distance / safety areas, draw & discard)
- [ ] mobile-first portrait, one-thumb action zone
- [ ] play / discard input + turn-flow rendering
- [ ] animations (card play, hazard flash, coup-fourré highlight)
- [ ] i18n: EN + ZH strings + language toggle

## M3 — AI opponent

- [ ] heuristic move scoring (distance gain, block opponent, save remedies/safeties)
- [ ] hazard targeting + coup-fourré (play vs. save) judgment
- [ ] card counting (track seen/discarded cards)
- [ ] tests: AI always emits legal moves; plays distance when unblocked

## M4 — Polish & ship

- [ ] localStorage save/resume + new game
- [ ] AudioManager + Web Audio SFX (play, hazard, coup-fourré, win)
- [ ] cozy CC0/self-composed background music + mute toggle
- [ ] accessibility pass (contrast, labels, reduced-motion)
- [ ] PWA complete (offline, install prompt, icon polish)
- [ ] GitHub Pages release + phone smoke test

## Backlog / future (NOT v1)

- [ ] online multiplayer (server authority + netcode)
- [ ] AI difficulty tiers
- [ ] full tabletop scoring (safeties/coup-fourré/trip bonuses, first to 5000)
- [ ] Extension rule
- [ ] more languages
- [ ] Cloudflare hosting
- [ ] Capacitor iOS/Android hybrid app
