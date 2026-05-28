# Big Two (Cho Dai Di / Pusoy Dos)

A client-side, single-player Big Two table for the browser — you versus three bots. Built with React, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Rules implemented

- Card order: 3 (low) … A … 2 (high); suits: ♦ < ♣ < ♥ < ♠
- Combinations: single, pair, triple, and 5-card poker hands (straight → straight flush hierarchy)
- Opening play must include **3♦**
- Beat the pile with the same length and combination type (or higher 5-card category)
- Three passes clear the table; last player to play leads
- Scoring: 1× / 2× / 3× penalty multipliers for 1–9, 10–12, and 13 cards left

## Project structure

- `src/game/cards.ts` — ranking, classification, `validateAndComparePlay`
- `src/game/gameLogic.ts` — deal, turns, passes, game over
- `src/game/ai.ts` — lowest valid bot play
- `src/components/` — table UI
