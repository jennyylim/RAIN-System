
import { GoogleGenAI } from "@google/genai";
import { Asset, AssetStatus, RequestStatus } from "../types";

// This service is used to generate insights for the IT dashboard
export const getGeminiInsights = async (assets: Asset[], requests: any[]) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key not found. Mocking response.");
    return "API Key missing. Unable to generate live insights. However, your data indicates you have " + assets.filter(a => a.status === AssetStatus.FAULTY).length + " faulty assets needing attention.";
  }

  // Use the recommended model for text tasks: gemini-3-flash-preview
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an IT Asset Management AI Assistant. 
    Here is the current inventory summary:
    Total Assets: ${assets.length}
    In Stock: ${assets.filter(a => a.status === AssetStatus.IN_STOCK).length}
    Allocated: ${assets.filter(a => a.status === AssetStatus.ALLOCATED).length}
    Faulty: ${assets.filter(a => a.status === AssetStatus.FAULTY).length}
    Pending Requests: ${requests.filter(r => r.status === RequestStatus.PENDING).length}

    Please provide a brief, professional executive summary (max 3 sentences) identifying any risks (like low stock or high failure rate) and a recommended action.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this moment.";
  }
};

export const generatePolicyDraft = async (topic: string) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "API Key required for policy generation.";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a concise IT policy paragraph regarding: ${topic}. strict tone.`
        });
        return response.text;
    } catch (error) {
        return "Error generating policy.";
    }
}
