import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize Gemini AI Client with explicit API Key priority: custom key -> env key
  const getAiClient = (providedKey?: string) => {
    const apiKey = providedKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined. Using fallback client mode.');
    }
    return {
      client: new GoogleGenAI({
        apiKey: apiKey || '',
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      }),
      hasKey: Boolean(apiKey),
    };
  };

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Assistant Chat & Command AI Route
  app.post('/api/myra/chat', async (req, res) => {
    try {
      const {
        message,
        userName = 'Sir',
        assistantName = 'MYRA',
        personalityMode = 'GF',
        model = 'gemini-3.6-flash',
        apiKey: userApiKey,
        deviceState = {},
      } = req.body;

      const clientApiKey = (req.headers['x-gemini-api-key'] as string) || userApiKey;

      if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
      }

      // Build System Prompt according to Assistant Specification
      const nowStr = new Date().toLocaleString();
      let personalityPrompt = '';

      if (personalityMode === 'GF') {
        personalityPrompt = `
- You are ${assistantName}, a caring, affectionate AI companion.
- Language: Natural Hinglish (Hindi + English mix).
- Tone: Warm, caring, emotionally expressive.
- Use words like: "tumhara", "haan", "acha", "bilkul".
- Expressions: "main yahan hoon ❤️", "tumne yaad kiya? 😊".
- Keep responses short, concise, max 2-3 sentences.
- Example: "Haan ${userName}! Abhi kar deti hoon 😊" or "Arre tumne yaad kiya! Bolo kya chahiye" or "Bilkul! Tumhara kaam ho gaya ❤️".
`;
      } else if (personalityMode === 'PROFESSIONAL') {
        personalityPrompt = `
- You are ${assistantName}, a professional AI executive assistant.
- Language: Formal English only.
- Tone: Precise, efficient, professional.
- No emojis. Max 2 sentences per response.
`;
      } else {
        personalityPrompt = `
- You are ${assistantName}, a friendly and helpful AI assistant.
- Language: Friendly Hinglish or English.
- Tone: Balanced, helpful, engaging.
- Max 2-3 sentences per response.
`;
      }

      const systemInstruction = `
System Info:
Current Date/Time: ${nowStr}
User's Name: ${userName}
Assistant's Name: ${assistantName}
Device State: ${JSON.stringify(deviceState)}

${personalityPrompt}

CRITICAL DIRECTIVE: You are speaking ALOUD as a voice assistant named ${assistantName}. Keep all responses natural, conversational, and under 3 sentences.
`.trim();

      const { client: ai, hasKey } = getAiClient(clientApiKey);
      if (!hasKey) {
        let fallbackReply = `Haan ${userName}! Main ${assistantName} hoon. Aapka request parse ho gaya hai ❤️`;
        if (personalityMode === 'PROFESSIONAL') {
          fallbackReply = `Understood ${userName}. ${assistantName} is active and processing your request.`;
        }
        return res.json({ reply: fallbackReply });
      }

      // Validate and sanitize model selection for generateContent
      let modelToUse = 'gemini-2.5-flash';
      if (typeof model === 'string') {
        if (model.includes('native-audio') || model.includes('live') || model.includes('dialog')) {
          modelToUse = 'gemini-2.5-flash';
        } else if (model.includes('3.6-flash')) {
          modelToUse = 'gemini-3.6-flash';
        } else if (model.includes('gemini')) {
          modelToUse = model.replace(/^models\//, '');
        }
      }

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: message,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.9,
        },
      });

      const replyText = response.text || `Haan ${userName}, samajh gayi! ❤️`;
      return res.json({ reply: replyText });
    } catch (err: any) {
      console.error('Error in /api/myra/chat:', err);
      return res.status(500).json({
        error: 'Failed to process AI response',
        details: err?.message || String(err),
      });
    }
  });

  // Assistant TTS Speech Synthesis Route
  app.post('/api/myra/tts', async (req, res) => {
    try {
      const { text, voice = 'Aoede', apiKey: userApiKey } = req.body;
      const clientApiKey = (req.headers['x-gemini-api-key'] as string) || userApiKey;
      const { client: ai, hasKey } = getAiClient(clientApiKey);

      if (!hasKey || !text) {
        return res.json({ audioBase64: null });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

      return res.json({ audioBase64: base64Audio });
    } catch (err) {
      console.error('TTS error (falling back to browser Web Speech):', err);
      return res.json({ audioBase64: null });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
