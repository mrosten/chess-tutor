# AI-Assisted Chess Tutor: Implementation Plan

## Project Overview
A web-based chess tutor designed to guide players through games, providing real-time AI analysis and natural language explanations of moves and concepts.

## Tech Stack
- **Framework**: Vite + Vanilla JS/HTML/CSS (for speed and simplicity).
- **Chess Logic**: `chess.js` for move validation and game state.
- **Engine**: `Stockfish.js` (Web Worker) for move evaluation.
- **Styling**: Vanilla CSS with a premium "Grandmaster" aesthetic (Dark mode, glassmorphism).

## Features
1. **Interactive Chessboard**: Premium look with smooth animations and drag-and-drop.
2. **AI Analysis**: Real-time evaluation of the current position.
3. **Tutoring Mode**: 
   - Explains *why* a move is good or bad.
   - Suggests tactical themes (e.g., Pins, Forks, Skewers).
   - "Hints" that don't just give the move but describe the idea.
4. **Move History**: Visual log of the game with evaluation annotations (!, ?, !!).
5. **Dynamic Visuals**: Arrows and highlights for threats and suggested paths.

## Design Aesthetic
- **Colors**: Deep Midnight Blue (`#0f172a`), Royal Gold (`#fbbf24`), and Ghost White (`#f8fafc`).
- **Effects**: Backdrop-blur for UI panels, subtle glows for active pieces, smooth SVG piece rendering.
- **Typography**: `Outfit` or `Inter` from Google Fonts.

## Directory Structure
- `/myantigravity/chess-tutor/`
  - `index.html`: Main entry point.
  - `style.css`: Core design system and layout.
  - `app.js`: Application logic and engine integration.
  - `chess-logic.js`: Wrapper for chess.js.
  - `ai-tutor.js`: Logic for generating tutoring responses.
  - `assets/`: SVGs for pieces and icons.

## Next Steps
1. Initialize the project directory.
2. Create the foundational `style.css` with the design system.
3. Implement the chessboard UI.
4. Integrate Stockfish for position evaluation.
