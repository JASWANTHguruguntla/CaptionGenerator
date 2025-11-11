import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CaptionResult, Hashtag } from "../types";

const getPlatformInstructions = (platform: string) => {
  switch (platform) {
    case "X":
      return 'For X (Twitter), captions must be under 280 characters and concise.';
    case "Facebook":
      return 'For Facebook, captions should encourage engagement and sharing.';
    case "LinkedIn":
      return 'For LinkedIn, maintain a professional tone, add insights or questions.';
    case "Instagram":
    default:
      return 'For Instagram, captions should be visual, fun, and engaging.';
  }
};

const generatePrompt = (tone: string, platform: string) => `
You are a creative social media expert for ${platform}.
Generate 3 captions for an image with a ${tone} tone.

Platform Guidelines: ${getPlatformInstructions(platform)}

Each caption type:
1. "titleCaption" – short, catchy, 1 line with emojis.
2. "mediumCaption" – engaging 1–2 sentence caption.
3. "largeCaption" – storytelling style, 3–4 sentences.

Also provide 5–7 hashtags, each with:
{ "tag": string, "category": "general" | "niche" | "location" | "trending" }

Respond **only in valid JSON** matching the schema.
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
    throw new Error("VITE_API_KEY not found. Please set it in your Vercel settings.");

  const ai = new GoogleGenerativeAI(API_KEY);

  // 🧠 Fallback model sequence
  const modelNames = ["gemini-2.5-flash-lite", "gemini-1.5-flash", "gemini-1.0-pro"];

  const imagePart = { inlineData: { data: imageBase64, mimeType } };
  const textPart = { text: generatePrompt(tone, platform) };

  for (const modelName of modelNames) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const model = ai.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        });

        console.log(`⚙️ Using model: ${modelName} (Attempt ${attempt})`);

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
          mediumCaption: parsed.mediumCaption || "No medium caption generated.",
          largeCaption: parsed.largeCaption || "No large caption generated.",
          hashtags: validatedHashtags,
        };
      } catch (err: any) {
        // Retry and fallback logic
        if (err?.status === "UNAVAILABLE" || err?.code === 503) {
          console.warn(
            `🚧 Model ${modelName} overloaded. Retrying (${attempt}/3)...`
          );
          await new Promise((res) => setTimeout(res, 3000));
          if (attempt === 3) {
            console.warn(`⚠️ Switching to fallback model after ${modelName}`);
            break;
          }
          continue;
        }

        if (modelName === modelNames.at(-1)) throw err;
      }
    }
  }

  throw new Error("All models unavailable. Please try again later.");
};
