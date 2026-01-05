/**
 * Gemini Image Generation (Nano Banana) Client
 * Image generation for diary illustrations using Gemini 2.0 Flash
 */

const apiKey = import.meta.env.VITE_IMAGEN_API_KEY;

if (!apiKey) {
  throw new Error('Missing VITE_IMAGEN_API_KEY environment variable');
}

// Gemini 이미지 생성 모델 (Nano Banana)
// 참고: gemini-2.5-flash-image가 GA 버전이지만 API 키 문제로 2.0 사용
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp-image-generation';
const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiImageResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
}

/**
 * Generate diary illustration using Gemini Image Generation (Nano Banana)
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

    const apiUrl = `${API_BASE_URL}/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      }),
    });

    if (!response.ok) {
      console.error('Gemini Image API error:', response.status, await response.text());
      return null;
    }

    const data: GeminiImageResponse = await response.json();

    // Gemini 응답에서 이미지 찾기
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData?.mimeType?.startsWith('image/'));

    if (imagePart?.inlineData) {
      const { mimeType, data: base64Data } = imagePart.inlineData;
      return `data:${mimeType};base64,${base64Data}`;
    }

    console.warn('Gemini response did not contain an image');
    return null;
  } catch (error) {
    console.error('Image generation error:', error);
    return null;
  }
};

/**
 * Generate image prompt for external use
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
