import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const askMitigasiSchema = z.object({
  topic: z.string().min(3).max(120),
  context: z.string().min(10).max(500),
  location: z.string().min(2).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = askMitigasiSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Input tidak valid untuk Tanya AI.',
        },
        { status: 400 }
      );
    }

    const { topic, context, location } = parsed.data;

    const systemPrompt = [
      'Anda adalah asisten mitigasi banjir untuk warga Indonesia.',
      'Berikan jawaban singkat, praktis, aman, dan mudah dipahami.',
      'Gunakan bahasa Indonesia dengan format paragraf ringkas.',
      'Fokus pada langkah yang bisa dilakukan warga saat ini.',
      'Panjang jawaban maksimal 90 kata.',
    ].join(' ');

    const userPrompt = [
      `Topik: ${topic}`,
      `Konteks: ${context}`,
      `Lokasi: ${location ?? 'Area rawan banjir'}`,
      'Berikan rekomendasi tindakan prioritas dan 1 peringatan penting.',
    ].join('\n');

    const answer = await getAiAnswer(systemPrompt, userPrompt);

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          error: 'AI tidak mengembalikan jawaban.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error('Failed to handle AI mitigasi request:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Layanan AI sedang tidak tersedia. Periksa API key Gemini/OpenAI dan coba lagi.',
      },
      { status: 500 }
    );
  }
}

async function getAiAnswer(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (process.env.GEMINI_API_KEY) {
    const geminiAnswer = await askGemini(systemPrompt, userPrompt);
    if (geminiAnswer) {
      return geminiAnswer;
    }
  }

  if (process.env.OPENAI_API_KEY) {
    const openAiAnswer = await askOpenAi(systemPrompt, userPrompt);
    if (openAiAnswer) {
      return openAiAnswer;
    }
  }

  throw new Error('No AI provider configured or provider request failed.');
}

async function askGemini(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const model = process.env.GEMINI_MODEL ?? 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 180,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini request failed:', errorText);
      return null;
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch (error) {
    console.error('Gemini request error:', error);
    return null;
  }
}

async function askOpenAi(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 180,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const aiErrorText = await aiResponse.text();
      console.error('OpenAI request failed:', aiErrorText);
      return null;
    }

    const data = (await aiResponse.json()) as OpenAIChatResponse;
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.error('OpenAI request error:', error);
    return null;
  }
}
