// import { Chess } from '...'; // Now loaded via index.html script tag
const Chess = window.Chess;
import engine from './stockfish-engine.js';
import { getTutorAdvice } from './ai-tutor-service.js';

console.log('[MAIN] Script loaded.');
console.log('[MAIN] Chess object:', typeof Chess);
const game = new Chess();
console.log('[MAIN] Game initialized. FEN:', game.fen());
const boardElement = document.getElementById('chess-board');
const statusElement = document.getElementById('game-status');
const moveListElement = document.getElementById('move-list');
const engineEvalElement = document.getElementById('engine-eval');

// Piece SVG Map (Standard Pieces)
const pieceMap = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

let selectedSquare = null;
let isEngineThinking = false;
let chatHistory = [];

// Engine Setup
engine.onMessage = (line) => {
    if (line.startsWith('bestmove')) {
        const moveStr = line.split(' ')[1];
        if (moveStr && moveStr !== '(none)') {
            const from = moveStr.substring(0, 2);
            const to = moveStr.substring(2, 4);
            const promo = moveStr.substring(4, 5) || 'q';

            console.log(`[ENGINE] RECEIVED_MOVE: ${moveStr}`);
            const move = game.move({ from, to, promotion: promo });

            if (move) {
                renderBoard();
                addTutorMessage("system", `[CPU_MOVE] ${move.san} EXECUTED.`);
                isEngineThinking = false;

                // Trigger LLM strategic advice
                const currentEval = engineEvalElement.innerText;
                const currentFen = game.fen();
                const currentPgn = game.pgn();
                const legalMoves = game.moves().join(', ');

                (async () => {
                    const advice = await getTutorAdvice(currentFen, currentPgn, currentEval, null, legalMoves, chatHistory);
                    addTutorMessage("ai", `[TUTOR] ${advice}`);
                })();
            } else {
                console.error('[ENGINE] FAILED_TO_APPLY_MOVE:', moveStr);
                isEngineThinking = false;
            }
        } else {
            isEngineThinking = false;
        }
    } else if (line.includes('score cp')) {
        const parts = line.split(' ');
        const scoreIdx = parts.indexOf('cp') + 1;
        const score = parseInt(parts[scoreIdx]) / 100;
        // If it's black's turn, the score from Stockfish is relative to black. 
        // We usually show evaluation from White's perspective.
        const evalScore = game.turn() === 'b' ? -score : score;
        engineEvalElement.innerText = `EVAL: ${evalScore > 0 ? '+' : ''}${evalScore.toFixed(2)}`;
    } else if (line.includes('score mate')) {
        const parts = line.split(' ');
        const mateIdx = parts.indexOf('mate') + 1;
        const mateIn = parts[mateIdx];
        engineEvalElement.innerText = `EVAL: M${mateIn}`;
    }
};

function renderBoard() {
    boardElement.innerHTML = '';
    const board = game.board();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const file = String.fromCharCode(97 + c);
            const rank = (8 - r);
            const squareName = file + rank;

            square.id = `sq-${squareName}`;
            square.classList.add('square');
            square.classList.add((r + c) % 2 === 0 ? 'light' : 'dark');

            if (c === 0) {
                const rankLabel = document.createElement('span');
                rankLabel.classList.add('coordinate', 'rank');
                rankLabel.innerText = rank;
                square.appendChild(rankLabel);
            }
            if (r === 7) {
                const fileLabel = document.createElement('span');
                fileLabel.classList.add('coordinate', 'file');
                fileLabel.innerText = file;
                square.appendChild(fileLabel);
            }

            // Highlight Last Move
            const history = game.history({ verbose: true });
            if (history.length > 0) {
                const lastMove = history[history.length - 1];
                if (squareName === lastMove.from || squareName === lastMove.to) {
                    square.classList.add('last-move');
                }
            }

            const piece = board[r][c];
            if (piece) {
                const img = document.createElement('img');
                img.src = pieceMap[piece.type === 'p' ? (piece.color === 'w' ? 'P' : 'p') : (piece.color === 'w' ? piece.type.toUpperCase() : piece.type)];
                img.classList.add('piece');
                img.classList.add(piece.color === 'w' ? 'white-piece' : 'black-piece');
                img.draggable = false;
                square.appendChild(img);
            }

            square.addEventListener('click', () => handleSquareClick(squareName));
            boardElement.appendChild(square);
        }
    }
    updateStatus();
    updateMoveHistory();
}

function handleSquareClick(square) {
    if (isEngineThinking || game.game_over()) return;

    if (selectedSquare === square) {
        selectedSquare = null;
        clearHighlights();
        return;
    }

    if (selectedSquare) {
        try {
            const move = game.move({
                from: selectedSquare,
                to: square,
                promotion: 'q'
            });

            if (move) {
                selectedSquare = null;
                clearHighlights();
                renderBoard();

                addTutorMessage("ai", `[USER_MOVE] ${move.san} REGISTERED. ANALYZING...`);
                isEngineThinking = true;

                // On mobile, hide terminal so user sees the engine reply eventually
                if (window.innerWidth <= 850) {
                    terminalContainer.classList.remove('active');
                    toggleBtn.innerText = 'TERMINAL_ON';
                }

                engine.analyze(game.fen());
            } else {
                const piece = game.get(square);
                if (piece && piece.color === game.turn()) {
                    selectedSquare = square;
                    highlightSquare(square);
                } else {
                    selectedSquare = null;
                    clearHighlights();
                }
            }
        } catch (e) {
            selectedSquare = null;
            clearHighlights();
        }
    } else {
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            highlightSquare(square);
        }
    }
}

function highlightSquare(square) {
    clearHighlights();
    const el = document.getElementById(`sq-${square}`);
    if (el) el.classList.add('selected');

    const moves = game.moves({ square, verbose: true });
    moves.forEach(m => {
        const targetEl = document.getElementById(`sq-${m.to}`);
        if (targetEl) targetEl.classList.add('possible-move');
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'possible-move');
    });
}

function addTutorMessage(type, text) {
    const tutorChat = document.getElementById('tutor-chat');
    const msg = document.createElement('div');
    msg.classList.add('message', type);
    msg.innerText = text;
    tutorChat.appendChild(msg);
    tutorChat.scrollTop = tutorChat.scrollHeight;

    // Only store AI and User Chat (for history context)
    if (type === 'ai' || type === 'user-chat') {
        const role = type === 'ai' ? 'assistant' : 'user';
        chatHistory.push({ role: role, content: text });
        if (chatHistory.length > 20) chatHistory.shift(); // Keep last 20 messages
    }
}

function updateStatus() {
    const moveColor = game.turn() === 'b' ? 'BLACK' : 'WHITE';
    let status = `TURN: ${moveColor}`;

    if (game.in_checkmate()) {
        status = `GAME_OVER: ${moveColor}_CHECKMATE`;
        addTutorMessage("ai", `[CRITICAL] CHECKMATE DETECTED.`);
    } else if (game.in_draw()) {
        status = 'GAME_OVER: DRAW';
        addTutorMessage("ai", `[STATUS] DRAW DETECTED.`);
    } else if (game.in_check()) {
        status += ' (IN_CHECK)';
    }
    statusElement.innerText = status;
}

function updateMoveHistory() {
    moveListElement.innerHTML = '';
    const history = game.history();
    for (let i = 0; i < history.length; i += 2) {
        const item = document.createElement('div');
        item.classList.add('history-item');
        item.innerHTML = `${Math.floor(i / 2) + 1}# <strong>${history[i]}</strong> ${history[i + 1] || ''}`;
        moveListElement.appendChild(item);
    }
    moveListElement.scrollLeft = moveListElement.scrollWidth;
}

document.getElementById('new-game').addEventListener('click', () => {
    game.reset();
    engine.stop();
    isEngineThinking = false;
    renderBoard();
    const tutorChat = document.getElementById('tutor-chat');
    tutorChat.innerHTML = '<div class="message system">[SYSTEM] RESETTING_STATE... OK.</div>';
});

const terminalInput = document.getElementById('terminal-input');

terminalInput.addEventListener('input', () => {
    // Auto-expand height
    terminalInput.style.height = 'auto';
    terminalInput.style.height = (terminalInput.scrollHeight) + 'px';
});

terminalInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent newline in textarea

        const input = terminalInput.value.trim();
        if (!input) return;

        // Clear input and reset height
        terminalInput.value = '';
        terminalInput.style.height = 'auto';

        const cmd = input.toLowerCase();

        // 1. Check for Terminal Commands
        if (['undo', 'back', 'takeback', 'u'].includes(cmd)) {
            addTutorMessage("system", `> ${input} [REVERTING_STATE...]`);
            game.undo(); // Undo CPU move
            game.undo(); // Undo User move
            renderBoard();
            addTutorMessage("system", `[SYSTEM] STATE_RESTORED. MAKE YOUR MOVE.`);
            return;
        }

        if (cmd === 'clear' || cmd === 'cls') {
            document.getElementById('tutor-chat').innerHTML = '';
            addTutorMessage("system", `[SYSTEM] TERMINAL_CLEARED.`);
            return;
        }

        if (['new', 'reset', 'restart'].includes(cmd)) {
            addTutorMessage("system", `> ${input} [RESETTING...]`);
            game.reset();
            engine.stop();
            isEngineThinking = false;
            renderBoard();
            document.getElementById('tutor-chat').innerHTML = '<div class="message system">[SYSTEM] RESETTING_STATE... OK.</div>';
            return;
        }

        // 2. Check if input is a valid chess move (Standard Algebraic Notation)
        try {
            const move = game.move(input);
            if (move) {
                addTutorMessage("system", `> ${input} [COMMAND_ACCEPTED]`);
                clearHighlights();
                renderBoard();

                addTutorMessage("ai", `[USER_MOVE] ${move.san} REGISTERED. ANALYZING...`);
                isEngineThinking = true;

                // On mobile, hide terminal
                if (window.innerWidth <= 850 && terminalContainer.classList.contains('active')) {
                    toggleTerminal();
                }

                engine.analyze(game.fen());
                return;
            }
        } catch (err) {
            // Not a valid move
        }

        // FALLBACK: Input is a question/comment
        addTutorMessage("user-chat", `> ${input}`);
        terminalInput.disabled = true;

        try {
            const advice = await getTutorAdvice(
                game.fen(),
                game.pgn(),
                engineEvalElement.innerText,
                input,
                game.moves().join(', '),
                chatHistory
            );
            addTutorMessage("ai", `[TUTOR] ${advice}`);
        } catch (err) {
            console.error(err);
            addTutorMessage("system", `[ERROR] COMMAND_EXECUTION_FAILED.`);
        } finally {
            terminalInput.disabled = false;
            terminalInput.focus();
        }
    }
});

// Focus terminal on click anywhere in the container, but ONLY if not selecting text
// And IGNORE clicks on the header/toggle bar itself
document.querySelector('.terminal-container').addEventListener('mousedown', (e) => {
    // If we click the header, we're toggling, not typing
    if (e.target.closest('.terminal-header')) return;

    // If the click is on the history/chat text, let the user select it
    if (e.target.closest('.terminal-output')) return;

    // For other areas, focus the input on the next tick to avoid interrupting clicks
    setTimeout(() => {
        if (window.getSelection().toString().length === 0) {
            terminalInput.focus();
        }
    }, 10);
});

// Mobile Toggle Logic (Header Bar)
const terminalHeader = document.querySelector('.terminal-header');
const toggleBtn = document.getElementById('toggle-terminal');
const terminalContainer = document.querySelector('.terminal-container');

function toggleTerminal() {
    const isActive = terminalContainer.classList.toggle('active');
    if (toggleBtn) toggleBtn.innerText = isActive ? 'TERMINAL_OFF' : 'TERMINAL_ON';

    // Ensure we see the header when collapsing
    if (!isActive) {
        terminalContainer.scrollTop = 0;
    }
}

terminalHeader.addEventListener('click', toggleTerminal);
if (toggleBtn) toggleBtn.addEventListener('click', toggleTerminal);

// Update addTutorMessage to ensure visibility on mobile when AI speaks
const originalAddTutorMessage = addTutorMessage;
addTutorMessage = (type, text) => {
    originalAddTutorMessage(type, text);

    // On mobile, if the AI is giving advice, pop the terminal open
    if (type === 'ai' && text.includes('[TUTOR]') && window.innerWidth <= 850) {
        if (!terminalContainer.classList.contains('active')) {
            toggleTerminal();
        }
    }
}

renderBoard();
