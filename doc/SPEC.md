# SPEC — Mille Bornes (Rally 1000) — v1

The canonical, implementation-grade behavioral spec. This is the single source
of truth for **what the game does**. `PLAN.md` owns *why & how* (vision,
decisions, architecture, milestones, risks); `TODO.md` owns *progress*. If this
file and `PLAN.md` disagree on behavior, this file wins.

## 1. Scope

- One human player vs. one computer opponent (AI).
- A single race to exactly 1000 km per game. No multi-hand scoring, no Extension.
- Full core Mille Bornes rules.
- **Deliberate deviation from the official 2-player variant:** we use the full
  106-card deck and a 1000 km goal. (The official 2-player rules remove 5 cards
  and play to 700 with an optional Extension.) Rationale: the Palm Rally 1000
  original is a 1v1 race to 1000, which is what we're recreating.
- Out of scope: point scoring, Extension, online multiplayer, AI difficulty
  tiers, native apps. (See `PLAN.md` § Non-goals.)

## 2. Glossary

- **Player / opponent** — the human and the AI respectively.
- **Hand** — a player's private cards.
- **Draw pile / discard pile** — face-down stock / face-up discard. Discarded
  cards are dead for the rest of the race.
- **Tableau** — a player's visible play area: Battle pile + Speed pile +
  Distance pile + Safety area.
- **Battle pile** — one stack holding Roll and the Stop / Out of Gas /
  Flat Tire / Accident triads with their remedies. Only the top card controls
  play.
- **Speed pile** — one stack holding Speed Limit / End of Limit. Only the top
  card controls speed.
- **Distance pile** — the player's played distance cards, summed.
- **Safety area** — up to four safeties (Right of Way, Extra Tank,
  Puncture-Proof, Driving Ace).
- **Moving** — able to play distance cards (see §7.1).
- **Speed-limited** — a Speed Limit is showing on the Speed pile.
- **Active hazard** — a hazard currently blocking a player.

## 3. Deck (106 playable cards)

| Family | Card | Count |
| --- | --- | --- |
| Distance | 25 km | 10 |
| Distance | 50 km | 10 |
| Distance | 75 km | 10 |
| Distance | 100 km | 12 |
| Distance | 200 km | 4 |
| Hazard | Stop | 5 |
| Hazard | Speed Limit | 4 |
| Hazard | Out of Gas | 3 |
| Hazard | Flat Tire | 3 |
| Hazard | Accident | 3 |
| Remedy | Roll | 14 |
| Remedy | End of Limit | 6 |
| Remedy | Gasoline | 6 |
| Remedy | Spare Tire | 6 |
| Remedy | Repairs | 6 |
| Safety | Right of Way | 1 |
| Safety | Extra Tank | 1 |
| Safety | Puncture-Proof | 1 |
| Safety | Driving Ace | 1 |

46 + 18 + 38 + 4 = **106** playable. (The physical box has 110; 4 are reference
cards not used in play.)

## 4. Setup

- Build and shuffle the 106-card deck. Shuffle uses an injectable RNG/seed so
  the engine stays deterministic in tests.
- Deal 6 cards to each player.
- Remaining cards form the draw pile; discard pile starts empty.
- Human goes first (v1 choice; the engine supports an arbitrary first player).

## 5. Turn structure

A turn = **draw, then play-or-discard**. After the deck empties, the draw is
skipped.

1. **Draw phase** — active player draws 1 (if the draw pile is non-empty).
2. **Play phase** — active player plays exactly 1 card **or** discards 1 card.
   Discard is always legal.
3. **Resolution** — hand returns to 6, then:
   - If the active player just played a **safety**: they immediately draw 1 and
     play/discard 1 more (a bonus). Each safety chains another draw + play.
     Hand always ends at 6.
   - If the active player just played a **hazard** on the opponent: enter the
     **coup-fourré opportunity** for the opponent (§8) before the opponent's
     next turn.
   - Otherwise: pass to the other player's draw phase.
4. On **deck exhaustion**, players skip draws and continue play/discard until
   the race ends (§9).

**Hand invariant:** a player always has exactly 6 cards at the end of their turn
(after all safety bonus plays).

## 6. State machine

Explicit phases:

| Phase | Meaning | Next |
| --- | --- | --- |
| `setup` | deal done | → `draw` (first player) |
| `draw` | active player draws 1 (skipped if pile empty) | → `play` |
| `play` | active player must play 1 or discard 1 | → `coup-opportunity` (hazard played on opponent) · → `draw`+`play` again for same player (safety) · → `game-over` (1000 reached) · → `draw` (other player) |
| `coup-opportunity` | opponent just played a hazard; victim may coup-fourré or decline | → resolve coup (victim) · → `draw` (victim) |
| `game-over` | 1000 km reached, or hands exhausted | terminal |

The engine's public API (the one seam everything else plugs into):

- `legalMoves(state) -> Move[]` — every legal move for the current phase/player.
- `applyAction(state, action) -> state` — the reducer; pure, immutable.

The AI and the UI both consume `legalMoves`; neither re-implements rules.

## 7. Rules

Per-player state the rules read/write:

- `battle` — top of Battle pile: `empty | roll | stop | out-of-gas | gasoline | flat-tire | spare-tire | accident | repairs`.
- `speed` — `none | speed-limit`.
- `distance` — sum of played distance cards.
- `safeties` — set ⊆ {right-of-way, extra-tank, puncture-proof, driving-ace}.
- `twoHundredsPlayed` — count of 200-km cards played (max 2).

### 7.1 Moving & distance

A player is **moving** iff:

- `battle == roll`, OR
- `right-of-way ∈ safeties` AND `battle ∉ {out-of-gas, flat-tire, accident}`.

A **distance card** of value `v` is legal iff all of:

- the player is moving,
- `distance + v ≤ 1000` (never overshoot),
- if speed-limited (which implies Right of Way is not in play): `v ∈ {25, 50}`,
- if `v == 200`: `twoHundredsPlayed < 2`.

### 7.2 Hazards (played on the opponent)

Triads:

| Hazard | Remedy | Safety |
| --- | --- | --- |
| Stop | Roll | Right of Way |
| Speed Limit | End of Limit | Right of Way |
| Out of Gas | Gasoline | Extra Tank |
| Flat Tire | Spare Tire | Puncture-Proof |
| Accident | Repairs | Driving Ace |

A **battle hazard** `H` (Stop / Out of Gas / Flat Tire / Accident) is legal on
the opponent iff:

1. the opponent has not played H's matching safety, AND
2. the opponent's Battle pile is *hazardable*:
   - `opponent.battle == roll`, OR
   - opponent has Right of Way AND `H ∈ {out-of-gas, flat-tire, accident}` AND
     `opponent.battle ∉ {stop, out-of-gas, flat-tire, accident}`.

Rule 2 forbids hazard-on-hazard and forbids Stop when Right of Way is in play.
(The second bullet is the one case a hazard lands on a non-Roll card.)

**Speed Limit** is legal on the opponent iff:

- the opponent has not played Right of Way, AND
- the opponent is not already speed-limited (`opponent.speed == none`).

Speed Limit is playable regardless of whether the opponent is moving.

### 7.3 Remedies (played on yourself)

- **Gasoline** — legal iff `battle == out-of-gas` → `battle = gasoline`.
- **Spare Tire** — legal iff `battle == flat-tire` → `battle = spare-tire`.
- **Repairs** — legal iff `battle == accident` → `battle = repairs`.
- **Roll** — legal iff `battle ∈ {empty, stop, gasoline, spare-tire, repairs}`
  → `battle = roll`. (Illegal when already rolling or when a hazard is showing.)
- **End of Limit** — legal iff speed-limited → `speed = none`.

After a non-Roll remedy (Gasoline / Spare Tire / Repairs), a Roll is still
required to move — unless Right of Way is in play.

### 7.4 Safeties (played on yourself)

Playable any time (as your play, or as a coup-fourré). Effects:

- **Right of Way** — prevents Stop and Speed Limit; discards any active Stop
  (`battle → empty`) and any active Speed Limit (`speed → none`); makes you
  moving without a Roll; lets you play 75/100/200 while speed-limited. Does
  **not** protect against Out of Gas / Flat Tire / Accident.
- **Extra Tank** — prevents Out of Gas; cancels an active Out of Gas.
- **Puncture-Proof** — prevents Flat Tire; cancels an active Flat Tire.
- **Driving Ace** — prevents Accident; cancels an active Accident.

A safety that cancels an active battle hazard clears the block (battle moves to
the corresponding remedy state: `out-of-gas → gasoline`, `flat-tire →
spare-tire`, `accident → repairs`); a Roll is still required to move (unless
Right of Way).

Playing **any** safety grants a bonus: draw 1, then play/discard 1 more.
Multiple safeties chain.

### 7.5 Discard

Always legal, even when a legal play exists. Discards are dead for the rest of
the race.

## 8. Coup Fourré

When the opponent plays a hazard on you and you hold (and haven't yet played)
the matching safety, you may declare **coup-fourré**.

- **Window** — immediately after the hazard is played, and before you draw your
  next card (before your next turn begins). Declining forfeits it.
- **Resolution**:
  1. Play the matching safety into your Safety area (marked crosswise).
  2. Discard the hazard from your Battle pile (or Speed pile, for Speed Limit
     via Right of Way). This *restores* the prior state — a Roll underneath is
     exposed again, so you're immediately moving (unlike a normal safety).
  3. Draw 1 to restore your hand to 6.
  4. Because a safety was played: draw 1 more and play/discard 1 (bonus turn).
- **Turn order (1v1)** — after your coup turn, play returns to the opponent.
  Net: the opponent attacked, you countered and took a bonus turn, then it's
  the opponent's turn again — you "steal" a turn.
- The safety now protects you for the rest of the race.

## 9. Winning & end

- **Win** — first to reach exactly 1000 km.
- **Deck exhaustion** — when the draw pile is empty, players skip draws and
  continue playing/discarding one card per turn. When all hands are exhausted
  and neither player has reached 1000 km, the race ends: higher distance wins;
  equal distance = draw.

## 10. Edge cases (test every one)

1. A distance card that would overshoot 1000 is illegal.
2. Max two 200-km cards per player; a third is illegal.
3. Speed-limited → only 25/50 legal; Right of Way lifts this (75/100/200 legal).
4. A hazard cannot be played on top of another hazard.
5. A hazard cannot be played on a non-moving opponent — except Speed Limit, and
   except Out of Gas / Flat Tire / Accident when the opponent has Right of Way.
6. A hazard whose matching safety is already played is illegal.
7. Speed Limit cannot be stacked (illegal when opponent already speed-limited).
8. A remedy is illegal unless its matching hazard is showing.
9. Roll is illegal when already rolling or when a hazard is showing.
10. After a non-Roll remedy, distance is still blocked until a Roll (unless
    Right of Way).
11. A safety cancels an active matching hazard but still requires a Roll to
    move (unless Right of Way).
12. Playing a safety grants draw + play again; chained safeties each grant
    another; hand always ends at 6.
13. Coup-fourré must be declared before the victim's next draw; declining
    forfeits it.
14. Coup-fourré discards the hazard (revealing the Roll), so the victim can
    play distance on their bonus turn.
15. Right of Way: Stop and Speed Limit are never legal against it; it discards
    any active Stop/Speed Limit when played.
16. With Right of Way, being stopped by Out of Gas / Flat Tire / Accident needs
    only the remedy (no Roll) to resume.
17. Discard is always legal.
18. Deck exhaustion: draws are skipped; play/discard continues; tiebreak =
    higher distance, tie = draw.
19. AI always emits a legal move; if none, it discards.

## 11. Testing seams

- Test only external behavior through `legalMoves` and `applyAction`: for a
  given state + action, assert the resulting state and legality. Never test
  internal helpers.
- RNG (shuffle, AI choice) is injectable/seeded so the engine is deterministic
  in tests.
- Every rule in §7–§9 and every edge case in §10 maps to at least one unit test.
- Tests are Vitest files colocated with the engine.

## 12. Out of scope

Point scoring, Extension, online multiplayer, AI difficulty tiers, native apps,
and languages beyond English/Chinese at launch. See `PLAN.md`.
