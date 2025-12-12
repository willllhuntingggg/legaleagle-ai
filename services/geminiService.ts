import { GoogleGenAI, Type } from "@google/genai";
import { ContractStance, ReviewStrictness, RiskLevel, ContractSummary, RiskPoint } from "../types";

// Helper to get API key safely
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    console.warn("process.env is not defined, using empty key. Ensure API_KEY is injected.");
    return '';
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const generateContractSummary = async (text: string): Promise<ContractSummary> => {
  const prompt = `
    Analyze the following legal contract text and extract key information. 
    Return a JSON object.
    
    Text: "${text.substring(0, 10000)}..."
  `;

  // Use 'any' for schema type as strict typing for Schema interface might not be exported in all versions
  const schema: any = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, description: "Type of the contract (e.g., NDA, Sales Agreement)" },
      parties: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Names of the parties involved" },
      amount: { type: Type.STRING, description: "Total contract value or payment terms summary" },
      duration: { type: Type.STRING, description: "Start and end dates or duration" },
      mainSubject: { type: Type.STRING, description: "One sentence summary of what is being exchanged or agreed" },
    },
    required: ["type", "parties", "amount", "duration", "mainSubject"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const json = JSON.parse(response.text || "{}");
    return json as ContractSummary;
  } catch (error) {
    console.error("Summary generation failed:", error);
    return {
      type: "Unknown",
      parties: [],
      amount: "Unknown",
      duration: "Unknown",
      mainSubject: "Could not analyze text."
    };
  }
};

export const analyzeContractRisks = async (
  text: string, 
  stance: ContractStance, 
  strictness: ReviewStrictness,
  rulesContext: string
): Promise<RiskPoint[]> => {
  const prompt = `
    You are a senior legal consultant. Review the contract provided below.
    
    My Stance: ${stance}
    Review Strategy: ${strictness}
    Knowledge Base Rules to Apply: ${rulesContext}

    Identify risks based on my stance. For each risk, quote the *exact* original text snippet that is problematic. 
    Then provide a safer, rewritten version of that snippet that maintains the document structure but fixes the risk.
    
    Return a raw JSON array.
    
    Contract Text:
    "${text}"
  `;

  const schema: any = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        originalText: { type: Type.STRING, description: "The exact substring from the contract that contains the risk. Must match exactly." },
        riskDescription: { type: Type.STRING, description: "Short title of the risk" },
        reason: { type: Type.STRING, description: "Detailed explanation of why this is a risk for my stance" },
        level: { type: Type.STRING, enum: [RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW] },
        suggestedText: { type: Type.STRING, description: "The modified text to replace the original text." }
      },
      required: ["originalText", "riskDescription", "reason", "level", "suggestedText"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using flash for larger context window
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2 // Low temperature for precision in quoting text
      }
    });

    const rawRisks = JSON.parse(response.text || "[]");
    return rawRisks.map((r: any, index: number) => ({ ...r, id: `risk-${index}-${Date.now()}`, isAddressed: false }));
  } catch (error) {
    console.error("Risk analysis failed:", error);
    return [];
  }
};

export const draftNewContract = async (type: string, requirements: string): Promise<string> => {
  const prompt = `
    Draft a professional legal contract.
    Type: ${type}
    Requirements: ${requirements}
    
    Return only the contract text in Markdown format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Drafting failed.";
  } catch (error) {
    console.error("Drafting failed:", error);
    return "Error drafting contract.";
  }
};