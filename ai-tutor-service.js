import { AI_CONFIG } from './ai-config.js';

/**
 * Fetches strategic advice from the LLM.
 * @param {string} fen Current board position in FEN format.
 * @param {string[]} history Array of moves played so far.
 * @param {string} evaluation Current engine evaluation score.
 * @param {string} userQuestion Optional specific question from the user.
 * @returns {Promise<string>} The tutor's advice.
 */
export async function getTutorAdvice(fen, history, evaluation, userQuestion = null) {
    let prompt = `You are a Grandmaster Chess Tutor inside a DOS terminal. 
Analyze this chess position. 

CURRENT_STATE:
- FEN: ${fen}
- HISTORY: ${history.join(', ')}
- EVALUATION: ${evaluation}

`;

    if (userQuestion) {
        prompt += `USER_QUERY: "${userQuestion}"\n\nRESPONSE_GUIDELINES: Answer the user's question directly and concisely.\n`;
    } else {
        prompt += `RESPONSE_GUIDELINES: Identify one major strategic theme or a direct threat.\n`;
    }

    prompt += `
VOICE:
- High-intensity, ultra-concise, professional.
- Use square names (e4, d5).
- Max 2 sentences.
- No pleasantries.
`;

    try {
        const url = `${AI_CONFIG.API_URL}?key=${AI_CONFIG.API_KEY}`;

        // Structure for Gemini API
        const payload = {
            contents: [{
                role: 'user',
                parts: [{ text: `SYSTEM_INSTRUCTIONS: You are a professional chess tutor running inside a DOS terminal.\n\n${prompt}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI_API_ERROR: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const advice = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return advice || "[ERROR] NO_CONTENT_RETURNED";
    } catch (e) {
        console.error('[AI_SERVICE] HANDSHAKE_FAILED:', e);
        return `[ERROR] CORE_CONNECTION_TIMEOUT: ${e.message}`;
    }
}
