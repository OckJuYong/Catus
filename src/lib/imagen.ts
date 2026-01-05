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
 * Style: 고양이가 그린 것처럼 순수하고 귀여운 유치원생 스타일
 */
export const generateDiaryImage = async (
  emotion: string,
  summary: string
): Promise<string | null> => {
  try {
    // Create a prompt based on emotion and summary
    const emotionStyles: Record<string, string> = {
      '행복': 'bright sunny yellow, big happy smiles, rainbow colors, hearts and stars',
      '슬픔': 'soft blue crayon strokes, tiny raindrops, small sad face, comforting clouds',
      '보통': 'peaceful green grass, simple house, friendly sun, calm day',
      '화남': 'red scribbles, puffy clouds, pouty expression, thunder shapes',
      '불안': 'wobbly lines, scattered dots, curly swirls, hiding cat',
    };

    const styleGuide = emotionStyles[emotion] || emotionStyles['보통'];

    // 고양이가 그린 것처럼 순수하고 귀여운 유치원생 스타일
    const prompt = `A cute, innocent children's drawing style illustration, as if drawn by a kindergartener or a cat with crayons.
Theme: ${summary}
Mood: ${emotion}
Style elements: ${styleGuide}

IMPORTANT STYLE REQUIREMENTS:
- Simple, chunky crayon or colored pencil strokes
- Imperfect but charming wobbly lines
- Bright, primary colors (red, yellow, blue, green)
- Adorable cat character as the main subject or narrator
- Childlike simplicity with big expressive eyes
- Cute doodle elements like stars, hearts, flowers
- Pastel soft background
- Hand-drawn, naive art style like a 5-year-old's drawing
- Pure, innocent, and heartwarming atmosphere

No text, no words, no letters in the image.
Square format, suitable for mobile app diary.`;

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
 * Style: 고양이가 그린 것처럼 순수하고 귀여운 유치원생 스타일
 */
export const generateImagePrompt = (emotion: string, summary: string): string => {
  const emotionKeywords: Record<string, string> = {
    '행복': 'bright sunny, rainbow, hearts, big smiles',
    '슬픔': 'soft blue, tiny raindrops, gentle',
    '보통': 'peaceful green, calm sunny day',
    '화남': 'red scribbles, puffy clouds',
    '불안': 'wobbly swirls, scattered dots',
  };

  const keywords = emotionKeywords[emotion] || emotionKeywords['보통'];

  return `Cute kindergartener's crayon drawing style, innocent cat character, ${keywords}, ${summary}, childlike naive art, chunky crayon strokes, pastel colors, no text, square format`;
};

export default generateDiaryImage;
