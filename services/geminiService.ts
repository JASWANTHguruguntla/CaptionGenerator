import { GoogleGenAI, Type } from "@google/genai";
import { CaptionResult, Hashtag } from '../types';

const getPlatformInstructions = (platform: string) => {
    switch(platform) {
      case 'X':
        return 'For X (Twitter), the "title" caption must be under 280 characters and serve as a standalone tweet. The "medium" and "large" captions can be thread ideas or alternative tweets.';
      case 'Facebook':
        return 'For Facebook, focus on community engagement. The "medium" caption should be conversational, and the "large" caption can be a longer story that encourages comments and shares.';
      case 'LinkedIn':
        return 'For LinkedIn, maintain a professional tone. The "title" caption should be a strong hook. The "medium" and "large" captions should offer insights, ask professional questions, or tell a career-related story.';
      case 'Instagram':
      default:
        return 'For Instagram, captions should be visually descriptive and engaging. The "large" caption can be a micro-blog post that tells a story or shares value.';
    }
}

const generatePrompt = (tone: string, platform: string) => `
You are a creative social media expert specializing in ${platform}. Your task is to generate three vivid captions for the given image, with a ${tone} tone.

Platform Guidelines: ${getPlatformInstructions(platform)}

General Instructions:
1.  Generate three distinct captions tailored to the platform:
    *   A "title" caption: very short, punchy, like a headline.
    *   A "medium" caption: a standard, engaging caption.
    *   A "large" caption: a more detailed, story-driven caption.
2.  Incorporate relevant emojis naturally to boost engagement.
3.  Suggest a list of 5-7 relevant hashtags. For each hashtag, provide a category from this list: ["general", "niche", "location", "trending"].
4.  Do not assume details that are not clearly visible in the image.
5.  Return the response in the specified JSON format.
`;

const schema = {
  type: Type.OBJECT,
  properties: {
    titleCaption: {
      type: Type.STRING,
      description: 'A very short, punchy, title-like caption with emojis.'
    },
    mediumCaption: {
        type: Type.STRING,
        description: 'A standard, engaging caption (1-2 sentences) with emojis.'
    },
    largeCaption: {
        type: Type.STRING,
        description: 'A more detailed, story-driven caption (3-4 sentences) with emojis.'
    },
    hashtags: {
      type: Type.ARRAY,
      description: 'An array of 5-7 categorized hashtags.',
      items: {
        type: Type.OBJECT,
        properties: {
          tag: { type: Type.STRING, description: 'The hashtag text, without the # symbol.' },
          category: { type: Type.STRING, description: 'The category: "general", "niche", "location", or "trending".' }
        },
        required: ['tag', 'category']
      }
    }
  },
  required: ['titleCaption', 'mediumCaption', 'largeCaption', 'hashtags']
};


export const generateCaptionForImage = async (imageBase64: string, mimeType: string, tone: string, platform: string): Promise<CaptionResult> => {
  const API_KEY = process.env.API_KEY;

  // Check for the AI client's existence before making a call.
  if (!API_KEY) {
    throw new Error("AI client is not initialized. Please set the API_KEY environment variable in your Vercel project settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const textPart = {
      text: generatePrompt(tone, platform),
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
    });

    const jsonString = response.text;
    
    if (!jsonString) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    
    let parsedJson: any;
    try {
        parsedJson = JSON.parse(jsonString);
        if (typeof parsedJson !== 'object' || parsedJson === null) {
            throw new Error('Parsed JSON is not an object.');
        }
    } catch (e) {
        console.error("Failed to parse AI response as JSON object:", e, "Response was:", jsonString);
        throw new Error("The AI returned a response in an unexpected format. Please try again.");
    }

    // Deep validation of the response object to prevent rendering crashes.
    const validatedHashtags = (Array.isArray(parsedJson.hashtags) ? parsedJson.hashtags : [])
        .map((ht: any): Hashtag | null => {
            if (typeof ht === 'object' && ht !== null && typeof ht.tag === 'string' && typeof ht.category === 'string') {
                return { tag: ht.tag.replace(/\s+/g, ''), category: ht.category };
            }
            return null;
        })
        .filter((ht): ht is Hashtag => ht !== null);

    const result: CaptionResult = {
      titleCaption: typeof parsedJson.titleCaption === 'string' ? parsedJson.titleCaption : 'No title caption generated.',
      mediumCaption: typeof parsedJson.mediumCaption === 'string' ? parsedJson.mediumCaption : 'No medium caption generated.',
      largeCaption: typeof parsedJson.largeCaption === 'string' ? parsedJson.largeCaption : 'No large caption generated.',
      hashtags: validatedHashtags,
    };

    return result;

  } catch (error) {
    console.error("Error generating caption:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Failed to generate caption. Please check the console for more details.");
  }
};