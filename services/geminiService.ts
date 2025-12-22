
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Always use gemini-3-flash-preview for text tasks and Type for responseSchema.
export const generateAdCopy = async (productName: string, points: number): Promise<{ title: string; description: string }> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini");
    return {
      title: `Special Offer: ${productName}`,
      description: `Check out our amazing ${productName} and earn ${points} points!`
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a catchy, short ad title (max 5 words) and a description (max 20 words) for a product called "${productName}". The user gets ${points} reward points.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A catchy, short ad title (max 5 words)',
            },
            description: {
              type: Type.STRING,
              description: 'A brief ad description (max 20 words)',
            },
          },
          propertyOrdering: ["title", "description"],
        },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      title: `${productName} Promo`,
      description: `Experience the best ${productName} in Dubai! Visit us now to claim your rewards.`
    };
  }
};
