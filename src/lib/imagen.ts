/**
 * Google Imagen (Nano Banana) Client
 * Image generation for diary illustrations
 */

const apiKey = import.meta.env.VITE_IMAGEN_API_KEY;

if (!apiKey) {
  throw new Error('Missing VITE_IMAGEN_API_KEY environment variable');
}

// Imagen API endpoint (using Vertex AI endpoint)
const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

interface ImagenResponse {
  predictions: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
}

/**
 * Generate diary illustration using Imagen
 */
export const generateDiaryImage = async (
  emotion: string,
  summary: string
): Promise<string | null> => {
  try {
    // Create a prompt based on emotion and summary
    const emotionStyles: Record<string, string> = {
      '행복': 'warm, bright colors, sunshine, smiling elements, cheerful atmosphere',
      '슬픔': 'soft blue tones, rain drops, gentle melancholy, peaceful sadness',
      '보통': 'neutral colors, calm everyday scene, peaceful ordinary moment',
      '화남': 'bold red accents, dynamic shapes, expressing frustration artistically',
      '불안': 'swirling patterns, muted colors, abstract uncertainty',
    };

    const styleGuide = emotionStyles[emotion] || emotionStyles['보통'];

    const prompt = `A beautiful, artistic diary illustration in a soft, dreamy watercolor style.
Theme: ${summary}
Mood: ${emotion}
Style: ${styleGuide}
The image should be suitable for a personal diary, with a gentle and introspective feel.
No text, no words, no letters in the image.
Aspect ratio: square, suitable for mobile app display.`;

    const response = await fetch(`${IMAGEN_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          safetyFilterLevel: 'block_some',
          personGeneration: 'dont_allow',
        },
      }),
    });

    if (!response.ok) {
      console.error('Imagen API error:', response.status, await response.text());
      return null;
    }

    const data: ImagenResponse = await response.json();

    if (data.predictions && data.predictions.length > 0) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      return `data:image/png;base64,${base64Image}`;
    }

    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
};

/**
 * Alternative: Generate image using Gemini's vision capabilities
 * Fallback if Imagen is not available
 */
export const generateImagePrompt = (emotion: string, summary: string): string => {
  const emotionKeywords: Record<string, string> = {
    '행복': 'joyful, sunny, bright',
    '슬픔': 'melancholic, blue, gentle rain',
    '보통': 'calm, neutral, everyday',
    '화남': 'intense, red, stormy',
    '불안': 'uncertain, swirling, muted',
  };

  const keywords = emotionKeywords[emotion] || emotionKeywords['보통'];

  return `Minimalist diary illustration, ${keywords}, ${summary}, soft watercolor style, no text, square format`;
};

export default generateDiaryImage;
