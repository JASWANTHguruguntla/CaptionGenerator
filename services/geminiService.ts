import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CaptionResult, Hashtag } from "../types";

const getPlatformInstructions = (platform: string) => {
  switch (platform) {
    case "X":
      return 'For X (Twitter), the "title" caption must be under 280 characters.';
    case "Facebook":
      return 'For Facebook, focus on community engagement.';
    case "LinkedIn":
      return 'For LinkedIn, maintain a professional tone and offer insights.';
    case "Instagram":
    default:
      return 'For Instagram, captions should be visually descriptive and engaging.';
  }
};

const generatePrompt = (tone: string, platform: string) => `
You are a creative social media expert specializing in ${platform}. 
Your task is to generate three vivid captions for the given image, with a ${tone} tone.

Platform Guidelines: ${getPlatformInstructions(platform)}

General Instructions:
1. Generate three distinct captions:
   - "title": short and punchy
   - "medium": engaging and 1–2 sentences
   - "large": story-style with 3–4 sentences
2. Use natural emojis.
3. Suggest 5–7 hashtags with a "category" field (general, niche, trending, or location).
4. Output valid JSON only.
`;

const schema = {
  type: SchemaType.OBJECT,
  properties: {
    titleCaption: { type: SchemaType.STRING },
    mediumCaption: { type: SchemaType.STRING },
    largeCaption: { type: SchemaType.STRING },
    hashtags: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          tag: { type: SchemaType.STRING },
          category: { type: SchemaType.STRING },
        },
        required: ["tag", "category"],
      },
    },
  },
  required: ["titleCaption", "mediumCaption", "largeCaption", "hashtags"],
};

export const generateCaptionForImage = async (
  imageBase64: string,
  mimeType: string,
  tone: string,
  platform: string
): Promise<CaptionResult> => {
  const API_KEY = import.meta.env.VITE_API_KEY;
  if (!API_KEY)
    throw new Error("VITE_API_KEY not found. Please set it in Vercel.");

  const ai = new GoogleGenerativeAI(API_KEY);
  const modelNames = ["gemini-2.5-flash-lite", "gemini-1.5-flash"]; // fallback order

  const imagePart = { inlineData: { data: imageBase64, mimeType } };
  const textPart = { text: generatePrompt(tone, platform) };

  for (const modelName of modelNames) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Attempt ${attempt} with model ${modelName}`);
        const model = ai.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        const response = await model.generateContent({
          contents: [{ role: "user", parts: [textPart, imagePart] }],
        });

        const text = response.response.text();
        if (!text) throw new Error("Empty response from AI model.");
        const parsed = JSON.parse(text);

        const validatedHashtags = Array.isArray(parsed.hashtags)
          ? parsed.hashtags
              .filter(
                (ht: any) =>
                  typeof ht.tag === "string" && typeof ht.category === "string"
              )
              .map((ht: any) => ({
                tag: ht.tag.replace(/\s+/g, ""),
                category: ht.category,
              }))
          : [];

        return {
          titleCaption: parsed.titleCaption || "No title caption generated.",
          mediumCaption:
            parsed.mediumCaption || "No medium caption generated.",
          largeCaption: parsed.largeCaption || "No large caption generated.",
          hashtags: validatedHashtags,
        };
      } catch (err: any) {
        if (err?.status === "UNAVAILABLE" && attempt < 3) {
          console.warn(`Model overloaded, retrying in 3s... (${attempt}/3)`);
          await new Promise((res) => setTimeout(res, 3000));
          continue;
        }
        if (attempt === 3 && modelName !== modelNames.at(-1)) {
          console.warn(`Switching to fallback model: ${modelNames[1]}`);
          break;
        }
        if (attempt === 3) {
          console.error("Error generating caption:", err);
          throw err;
        }
      }
    }
  }

  throw new Error("All models failed after retries.");
};
