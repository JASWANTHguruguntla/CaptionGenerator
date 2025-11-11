import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CaptionResult, Hashtag } from "../types";

const getPlatformInstructions = (platform: string) => {
  switch (platform) {
    case "X":
      return 'For X (Twitter), the "title" caption must be under 280 characters and serve as a standalone tweet. The "medium" and "large" captions can be thread ideas or alternative tweets.';
    case "Facebook":
      return 'For Facebook, focus on community engagement. The "medium" caption should be conversational, and the "large" caption can be a longer story that encourages comments and shares.';
    case "LinkedIn":
      return 'For LinkedIn, maintain a professional tone. The "title" caption should be a strong hook. The "medium" and "large" captions should offer insights, ask professional questions, or tell a career-related story.';
    case "Instagram":
    default:
      return 'For Instagram, captions should be visually descriptive and engaging. The "large" caption can be a micro-blog post that tells a story or shares value.';
  }
};

const generatePrompt = (tone: string, platform: string) => `
You are a creative social media expert specializing in ${platform}. Your task is to generate three vivid captions for the given image, with a ${tone} tone.

Platform Guidelines: ${getPlatformInstructions(platform)}

General Instructions:
1. Generate three distinct captions tailored to the platform:
   * A "title" caption: very short, punchy, like a headline.
   * A "medium" caption: a standard, engaging caption.
   * A "large" caption: a more detailed, story-driven caption.
2. Incorporate relevant emojis naturally to boost engagement.
3. Suggest a list of 5-7 relevant hashtags. For each hashtag, provide a category from this list: ["general", "niche", "location", "trending"].
4. Do not assume details that are not clearly visible in the image.
5. Return the response in the specified JSON format.
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

  if (!API_KEY) {
    throw new Error(
      "AI client is not initialized. Please set VITE_API_KEY in your Vercel project settings."
    );
  }

  const ai = new GoogleGenerativeAI(API_KEY);
  const model = ai.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const textPart = {
    text: generatePrompt(tone, platform),
  };

  // Retry mechanism for 503 errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await model.generateContent({
        contents: [{ role: "user", parts: [textPart, imagePart] }],
      });

      const text = response.response.text();
      if (!text) throw new Error("Empty response from AI.");

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
      if (err?.status === "UNAVAILABLE" && attempt < 3) {
        console.warn(`Retrying... attempt ${attempt + 1}`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      console.error("Error generating caption:", err);
      throw err;
    }
  }

  throw new Error("Failed to generate caption after retries.");
};
