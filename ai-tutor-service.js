import { AI_CONFIG } from './ai-config.js';

/**
 * Fetches strategic advice from the LLM.
 * @param {string} fen Current board position in FEN format.
 * @param {string[]} history Array of moves played so far.
 * @param {string} evaluation Current engine evaluation score.
 * @param {string} userQuestion Optional specific question from the user.
 * @returns {Promise<string>} The tutor's advice.
 */
export async function getTutorAdvice(fen, pgn, evaluation, userQuestion = null, legalMoves = "", chatHistory = []) {
    const turnColor = fen.split(' ')[1] === 'w' ? 'White' : 'Black';

    // Format history for the prompt
    const recentChat = chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

    let prompt = `You are a Grandmaster Chess Tutor inside a DOS terminal. 
You are advising the WHITE player (User). The opponent is Stockfish (Black).

CURRENT_STATE:
- FEN: ${fen}
- PGN_HISTORY: ${pgn}
- EVALUATION: ${evaluation}
- SIDE_TO_MOVE: ${turnColor}
- LEGAL_MOVES_FOR_PLAYER: ${legalMoves}

RECENT_CHAT_HISTORY:
${recentChat}

`;

    if (userQuestion) {
        prompt += `USER_QUERY: "${userQuestion}"\n\nRESPONSE_GUIDELINES: Answer the user's question directly and concisely in the context of the current position.\n`;
    } else {
        prompt += `RESPONSE_GUIDELINES: Provide high-level strategic advice. Focus on concepts like space, piece activity, king safety, and long-term plans. DO NOT suggest specific moves unless there is an immediate tactical threat (mate or hanging piece).\n`;
    }

    prompt += `
VOICE:
- High-intensity, ultra-concise, professional.
- Focus on concepts, not just moves.
- Max 2 sentences.
- No pleasantries.
`;

    try {
        const response = await fetch(AI_CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_CONFIG.POE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: 'system', content: 'You are a professional chess tutor running inside a DOS terminal.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI_API_ERROR: ${response.status} - ${errorText} (Model: ${AI_CONFIG.MODEL})`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "[ERROR] NO_CONTENT_RETURNED";
    } catch (e) {
        console.error('[AI_SERVICE] HANDSHAKE_FAILED:', e);
        return `[ERROR] CORE_CONNECTION_TIMEOUT: ${e.message}`;
    }
}
