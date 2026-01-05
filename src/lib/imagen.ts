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
 * Style: 달이(고양이)가 크레용으로 직접 그린 것 같은 투박하고 귀여운 그림
 */
export const generateDiaryImage = async (
  emotion: string,
  summary: string
): Promise<string | null> => {
  try {
    // 감정별 구체적이고 차별화된 스타일 (고양이가 그린 그림 컨셉)
    const emotionConfigs: Record<string, { colors: string; elements: string; mood: string }> = {
      '행복': {
        colors: 'warm yellow, orange, pink, bright green',
        elements: 'rainbow, hearts, stars, flowers blooming, sun with happy face, butterflies',
        mood: 'cheerful, energetic, celebratory'
      },
      '슬픔': {
        colors: 'soft blue, gray, pale purple, muted tones',
        elements: 'rain drops, clouds, fallen leaves, wilting flower, teardrop shapes',
        mood: 'gentle, quiet, melancholic but comforting'
      },
      '보통': {
        colors: 'soft green, light blue, beige, cream',
        elements: 'simple house, tree, floating clouds, coffee cup, peaceful scenery',
        mood: 'calm, peaceful, ordinary'
      },
      '화남': {
        colors: 'red, orange, dark purple, black accents',
        elements: 'storm clouds, lightning bolts, scattered scribbles, jagged lines',
        mood: 'intense but expressed cutely, frustrated'
      },
      '불안': {
        colors: 'pale yellow, gray-blue, lavender, uncertain tones',
        elements: 'swirling patterns, question marks, tangled lines, wobbly shapes',
        mood: 'uncertain, worried but seeking comfort'
      },
    };

    const config = emotionConfigs[emotion] || emotionConfigs['보통'];

    // 달이(고양이)가 크레용으로 그린 것 같은 투박하고 귀여운 그림
    const prompt = `Create a cute illustration that looks like it was drawn by a cat using crayons.

SCENE THEME (interpret visually, do not write text): ${summary}

EMOTION: ${emotion} feeling
- Color palette: ${config.colors}
- Visual elements: ${config.elements}
- Overall mood: ${config.mood}

ART STYLE (CRITICAL - this is the most important part):
- Looks like a cat tried to draw with crayons (clumsy paw grip)
- Kindergartener's crude crayon drawing look
- Chunky, wobbly, uneven crayon strokes
- Lines don't connect perfectly, shapes are imperfect
- Very simple shapes (circles, basic lines)
- Coloring goes outside the lines sometimes
- Pastel soft background with crayon texture
- Naive, innocent, endearingly messy art style
- Like something a 5-year-old or a cat would proudly draw

STRICT RULES:
- NO text, words, letters, or numbers anywhere
- NO realistic or professional art style
- NO detailed or complex illustrations
- Square format (1:1 aspect ratio)
- Must look genuinely childlike and crude (not polished)`;

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
 * Style: 달이(고양이)가 크레용으로 그린 것처럼 투박한 그림
 */
export const generateImagePrompt = (emotion: string, summary: string): string => {
  const emotionKeywords: Record<string, string> = {
    '행복': 'bright sunny, rainbow, hearts, butterflies',
    '슬픔': 'soft blue, tiny raindrops, gentle clouds',
    '보통': 'peaceful green, calm sunny day, simple house',
    '화남': 'red scribbles, stormy clouds, jagged lines',
    '불안': 'wobbly swirls, scattered dots, tangled lines',
  };

  const keywords = emotionKeywords[emotion] || emotionKeywords['보통'];

  return `Crude crayon drawing by a cat, kindergartener art style, ${keywords}, ${summary}, clumsy wobbly strokes, coloring outside lines, very simple shapes, pastel colors, no text, square format`;
};

export default generateDiaryImage;
