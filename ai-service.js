import { CONFIG } from './config.js';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Returns current AI provider and model metadata.
 */
export function getAIStatus() {
    return {
        provider: 'Google Gemini',
        model: CONFIG.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
        isConfigured: Boolean(CONFIG.GEMINI_API_KEY && CONFIG.GEMINI_API_KEY.startsWith('AIza'))
    };
}

/**
 * Validates and sanitizes user input before sending to API.
 * @param {string} text - The raw user input.
 * @param {number} maxLength - Maximum allowed characters.
 * @returns {{ valid: boolean, sanitized: string, error: string|null }}
 */
export function validateInput(text, maxLength = 300) {
    if (!text || text.trim().length === 0) {
        return { valid: false, sanitized: '', error: 'Input cannot be empty.' };
    }
    const sanitized = text.trim();
    if (sanitized.length > maxLength) {
        return { valid: false, sanitized: '', error: `Input exceeds ${maxLength} character limit. Currently: ${sanitized.length} characters.` };
    }
    return { valid: true, sanitized, error: null };
}

/**
 * Classifies API errors into user-friendly categories.
 * @param {Error|object} error - The original error.
 * @returns {string} - User-friendly error message.
 */
export function classifyError(error) {
    const msg = (error && (error.message || error.error || '')) + '';
    if (msg.includes('401') || msg.includes('Unauthorized') || msg.includes('Invalid key') || msg.includes('API_KEY_INVALID')) {
        return 'API Key Error: Invalid Gemini API key. Please check GEMINI_API_KEY in config.js.';
    }
    if (msg.includes('402') || msg.includes('credits') || msg.includes('balance') || msg.includes('RESOURCE_EXHAUSTED')) {
        return 'Quota exceeded. Please check your Gemini API quota.';
    }
    if (msg.includes('429') || msg.includes('rate-limited')) {
        return 'Rate limit reached. Please wait a moment and try again.';
    }
    if (msg.includes('404') || msg.includes('NOT_FOUND')) {
        return 'Model not found. Please verify GEMINI_MODEL in config.js.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        return 'Network error. Please check your internet connection and try again.';
    }
    return 'Sorry, an unexpected error occurred. Please try again. 🙏';
}

// ─── Local Electoral Knowledge Engine (Zero-Downtime Fallback) ──────────────
const ELECTORAL_KB = [
    {
        keywords: ['age', 'old', '18', 'eligibility', 'eligible', 'उम्र', 'आयु', 'पात्रता'],
        en: "To vote in Indian elections, you must be an Indian citizen and at least 18 years of age on any of the four qualifying dates (January 1, April 1, July 1, or October 1). You also need to be registered on the electoral roll. 🗳️",
        hi: "भारत में मतदान करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए और आपका नाम मतदाता सूची (इलेक्टोरल रोल) में पंजीकृत होना चाहिए। वर्ष में 4 अर्हक तिथियां (1 जनवरी, 1 अप्रैल, 1 जुलाई, 1 अक्टूबर) हैं। 🗳️"
    },
    {
        keywords: ['evm', 'electronic voting machine', 'मशीन', 'ईवीएम', 'machine'],
        en: "An EVM (Electronic Voting Machine) is a tamper-proof standalone device consisting of two units: the Control Unit (with the Presiding Officer) and the Balloting Unit (in the voting compartment). EVMs are standalone battery-powered units with NO connection to the internet, Wi-Fi, or Bluetooth. 🔒",
        hi: "ईवीएम (इलेक्ट्रॉनिक वोटिंग मशीन) एक स्टैंडअलोन सुरक्षित उपकरण है जिसमें कंट्रोल यूनिट और बैलेटिंग यूनिट होती है। यह इंटरनेट, ब्लूटूथ या किसी बाहरी नेटवर्क से कभी नहीं जुड़ती, जिससे यह पूर्णतः सुरक्षित रहती है। 🔒"
    },
    {
        keywords: ['vvpat', 'paper slip', 'slip', 'पर्ची', 'वीवीपीएटी', 'audit'],
        en: "VVPAT (Voter Verifiable Paper Audit Trail) allows voters to verify their vote. When you press a button on the EVM, the VVPAT prints a slip displaying the candidate's serial number, name, and symbol for 7 seconds behind a transparent window before dropping it into a sealed box. 📄",
        hi: "VVPAT (वोटर वेरिफिएबल पेपर ऑडिट ट्रेल) एक स्वतंत्र सत्यापन प्रणाली है। वोट डालने पर 7 सेकंड के लिए एक पर्ची दिखती है जिसमें आपका चुना हुआ उम्मीदवार, चुनाव चिह्न और क्रमांक दिखता है, जिसके बाद वह सुरक्षित बॉक्स में गिर जाती है। 📄"
    },
    {
        keywords: ['nota', 'none of the above', 'नोटा'],
        en: "NOTA ('None of the Above') is the final option on the EVM ballot unit. It enables a voter to reject all contesting candidates while maintaining ballot secrecy. It was introduced in India in 2013 following a landmark Supreme Court directive. ❌",
        hi: "नोटा (None of the Above) ईवीएम पर अंतिम बटन होता है। यह मतदाता को किसी भी उम्मीदवार को न चुनने का अधिकार देता है। इसे 2013 में सर्वोच्च न्यायालय के ऐतिहासिक निर्णय के बाद लागू किया गया था। ❌"
    },
    {
        keywords: ['register', 'apply', 'voter id', 'epic', 'form 6', 'कार्ड', 'पंजीकरण', 'पहचान पत्र'],
        en: "You can register as a new voter online via the official ECI Voters' Services Portal (voters.eci.gov.in) or the Voter Helpline App by submitting Form 6. You will need proof of age (e.g., Aadhaar/Birth Certificate), proof of residence, and a photograph. 📋",
        hi: "नए मतदाता के रूप में पंजीकरण के लिए आप चुनाव आयोग के पोर्टल (voters.eci.gov.in) पर या वोटर हेल्पलाइन ऐप के जरिए 'फॉर्म 6' (Form 6) ऑनलाइन भर सकते हैं। 📋"
    },
    {
        keywords: ['document', 'id proof', 'aadhaar', 'आधार', 'दस्तावेज', 'documents'],
        en: "Along with your EPIC (Voter ID), the Election Commission accepts 12 alternative photo identity documents for voting: Aadhaar Card, PAN Card, Driving License, Indian Passport, MNREGA Job Card, Bank/Post Office passbook with photo, and official service ID cards. 🪪",
        hi: "वोटर आईडी (EPIC) के अलावा यदि आपका नाम मतदाता सूची में है, तो आप आधार कार्ड, पैन कार्ड, ड्राइविंग लाइसेंस, पासपोर्ट, या बैंक पासबुक जैसे 12 मान्य फोटो पहचान पत्रों से मतदान कर सकते हैं। 🪪"
    }
];

function getFallbackAnswer(query, language = 'en') {
    const q = query.toLowerCase();
    for (const item of ELECTORAL_KB) {
        if (item.keywords.some(k => q.includes(k))) {
            return language === 'hi' ? item.hi : item.en;
        }
    }
    if (language === 'hi') {
        return "नमस्ते! स्मार्टवोट इंडिया में आपका स्वागत है। भारत निर्वाचन आयोग (ECI) द्वारा आयोजित स्वतंत्र और निष्पक्ष चुनाव हमारे लोकतंत्र की नींव हैं। आप ईवीएम, वीवीपीएटी, नोटा, मतदाता सूची, या मतदान प्रक्रिया से जुड़ा कोई भी प्रश्न पूछ सकते हैं! 🇮🇳";
    }
    return "Namaste! Welcome to SmartVote India. Free, fair, and transparent elections organized by the Election Commission of India (ECI) empower our democracy. Ask me anything about EVMs, VVPAT verification, NOTA rights, or voting registration! 🇮🇳🗳️";
}

/**
 * Sends a message to Gemini AI via Google Generative Language API.
 * Falls back to local knowledge base if the API is unavailable.
 * @param {string} userMessage - The message from the user.
 * @param {string} systemPrompt - The system instruction for the AI.
 * @param {Array} history - Previous conversation history.
 * @param {string} language - Target language ('en' or 'hi').
 * @returns {Promise<string>} - The AI response text.
 */
export async function sendMessageToAI(userMessage, systemPrompt, history = [], language = 'en') {
    const validation = validateInput(userMessage);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const geminiKey = CONFIG.GEMINI_API_KEY || '';
    const geminiModel = CONFIG.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

    const langInstruction = language === 'hi'
        ? "\nCRITICAL: You MUST respond in Hindi (हिन्दी) only. Do not use English for the body of the response."
        : "\nCRITICAL: You MUST respond in English only.";

    // Build Gemini-format conversation contents
    const contents = [];

    // Format previous history
    if (Array.isArray(history)) {
        for (const msg of history.slice(-6)) {
            if (msg.role && msg.parts && msg.parts[0]?.text) {
                contents.push({
                    role: msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.parts[0].text }]
                });
            } else if (msg.role && msg.content) {
                contents.push({
                    role: msg.role === 'model' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }
    }

    contents.push({
        role: 'user',
        parts: [{ text: validation.sanitized }]
    });

    // Try Gemini API if key is present
    if (geminiKey && geminiKey.startsWith('AIza')) {
        try {
            const url = `${GEMINI_ENDPOINT}/${geminiModel}:generateContent?key=${geminiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: contents,
                    systemInstruction: {
                        parts: [{ text: systemPrompt + langInstruction }]
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (reply && reply.trim()) {
                    return reply.trim();
                }
            } else {
                const err = await response.json().catch(() => ({}));
                console.warn('[SmartVote AI] Gemini API error:', err);
            }
        } catch (netErr) {
            console.warn('[SmartVote AI] Network issue with Gemini:', netErr.message);
        }
    }

    // Graceful fallback to knowledge base if API unavailable
    return getFallbackAnswer(validation.sanitized, language);
}

// Backward compatibility alias
export const sendMessageToGemini = sendMessageToAI;

/**
 * Analyzes a news article or claim for sentiment, sensationalism, and credibility.
 * Uses Google Gemini API with heuristic fallback.
 * @param {string} text - The news text to analyze.
 * @param {string} language - Target language ('en' or 'hi').
 * @returns {Promise<Object>} - Analysis results.
 */
export async function analyzeNews(text, language = 'en') {
    const validation = validateInput(text, 500);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    const geminiKey = CONFIG.GEMINI_API_KEY || '';
    const geminiModel = CONFIG.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

    const langInstruction = language === 'hi'
        ? "IMPORTANT: Provide the 'description' in Hindi (हिन्दी). The 'verdict' MUST remain in English (one of: 'Likely Factual', 'Potentially Sensationalized', 'High Risk')."
        : "Provide 'description' in English. The 'verdict' MUST be one of: 'Likely Factual', 'Potentially Sensationalized', 'High Risk'.";

    const prompt = `Analyze the following news article or claim for sentiment, emotional intensity (magnitude), and potential sensationalism/bias.

Text: "${validation.sanitized}"

${langInstruction}

You MUST return ONLY a valid JSON object with these exact fields:
{
  "sentiment": <number between -1 and 1>,
  "magnitude": <number between 0 and 5>,
  "isSensational": <true or false>,
  "verdict": "<one of: Likely Factual, Potentially Sensationalized, High Risk>",
  "description": "<2-3 sentence explanation>"
}`;

    if (geminiKey && geminiKey.startsWith('AIza')) {
        try {
            const url = `${GEMINI_ENDPOINT}/${geminiModel}:generateContent?key=${geminiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: prompt }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{ text: 'You are an objective election integrity and news analysis AI. Always return strictly valid JSON only.' }]
                    },
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 450
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return {
                            sentiment: typeof parsed.sentiment === 'number' ? parsed.sentiment : 0,
                            magnitude: typeof parsed.magnitude === 'number' ? parsed.magnitude : 1,
                            isSensational: Boolean(parsed.isSensational),
                            verdict: ['Likely Factual', 'Potentially Sensationalized', 'High Risk'].includes(parsed.verdict)
                                ? parsed.verdict
                                : 'Potentially Sensationalized',
                            description: parsed.description || 'Analysis completed.'
                        };
                    }
                }
            } else {
                const err = await response.json().catch(() => ({}));
                console.warn('[analyzeNews] Gemini API error:', err);
            }
        } catch (err) {
            console.warn(`[analyzeNews] Gemini API call failed:`, err.message);
        }
    }

    // Heuristic analysis fallback
    const lower = validation.sanitized.toLowerCase();
    const sensationalTerms = ['shocking', 'exposed', 'rigged', 'conspiracy', 'viral', 'secret hack', 'unbelievable', 'banned', 'धमाका', 'खुलासा', 'फर्जी'];
    let sensationalCount = 0;
    sensationalTerms.forEach(term => { if (lower.includes(term)) sensationalCount++; });

    let isSensational = sensationalCount > 0;
    let verdict = 'Likely Factual';
    let sentiment = 0.2;
    let magnitude = 1.0;
    let description = '';

    if (sensationalCount >= 2) {
        verdict = 'High Risk';
        sentiment = -0.6;
        magnitude = 4.0;
        isSensational = true;
        description = language === 'hi' 
            ? 'इस सामग्री में अत्यधिक उत्तेजक और असत्यापित दावे हैं। आधिकारिक चुनाव आयोग स्रोतों से पुष्टि करें।'
            : 'This content contains emotionally charged keywords and unverified electoral claims. Cross-check with official election authorities.';
    } else if (sensationalCount === 1) {
        verdict = 'Potentially Sensationalized';
        sentiment = -0.2;
        magnitude = 2.4;
        isSensational = true;
        description = language === 'hi'
            ? 'इस समाचार में कुछ अतिशयोक्तिपूर्ण भाषा का प्रयोग पाया गया है। सावधानीपूर्वक तथ्य जांच करें।'
            : 'Contains sensational framing or exaggerated claims. Verification with reputable news outlets is recommended.';
    } else {
        verdict = 'Likely Factual';
        sentiment = 0.2;
        magnitude = 1.0;
        isSensational = false;
        description = language === 'hi'
            ? 'यह रिपोर्ट संतुलित और तथ्यात्मक प्रतीत होती है। चुनाव संबंधी सामान्य सूचना के अनुरूप है।'
            : 'The report uses balanced terminology consistent with authentic election reporting.';
    }

    return {
        sentiment,
        magnitude,
        isSensational,
        verdict,
        description
    };
}
