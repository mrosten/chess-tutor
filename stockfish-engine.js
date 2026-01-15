class StockfishEngine {
    constructor() {
        console.log('[ENGINE] Initializing Stockfish...');
        try {
            console.log('[ENGINE] Using ASM version...');
            this.worker = new Worker('public/stockfish-asm.js');
            this.onMessage = null;

            this.worker.onmessage = (event) => {
                const line = event.data;
                console.log('[ENGINE] <<', line);

                if (this.onMessage) {
                    this.onMessage(line);
                }
            };

            this.worker.onerror = (err) => {
                console.error('[ENGINE] Worker Error:', err);
            };

            // Initialize engine
            this.sendMessage('uci');
            this.sendMessage('isready');
        } catch (e) {
            console.error('[ENGINE] Failed to create Worker:', e);
        }
    }

    sendMessage(message) {
        console.log('[ENGINE] >>', message);
        this.worker.postMessage(message);
    }

    setDifficulty(level) {
        this.sendMessage(`setoption name Skill Level value ${level}`);
    }

    analyze(fen, timeLimit = 1000) {
        this.sendMessage('isready'); // Ensure engine is ready before move
        this.sendMessage(`position fen ${fen}`);
        this.sendMessage(`go movetime ${timeLimit}`);
    }

    stop() {
        this.sendMessage('stop');
    }
}

export default new StockfishEngine();
