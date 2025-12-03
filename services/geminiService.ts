import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData } from "../types";

// Define the schema for structured output to ensure strict type safety from Gemini
const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    number: { type: Type.STRING, description: "Invoice number" },
    date: { type: Type.STRING, description: "Invoice date in YYYY-MM-DD format" },
    vatRate: { type: Type.NUMBER, description: "VAT rate (0, 10, 20). Use -1 if not specified or 'Without VAT'." },
    seller: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        inn: { type: Type.STRING },
        kpp: { type: Type.STRING },
        address: { type: Type.STRING },
        bankName: { type: Type.STRING },
        bik: { type: Type.STRING },
        accountNumber: { type: Type.STRING },
        correspondentAccount: { type: Type.STRING },
      },
      required: ["name"]
    },
    buyer: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        inn: { type: Type.STRING },
        address: { type: Type.STRING },
      },
      required: ["name"]
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
        },
        required: ["name", "quantity", "price"]
      }
    }
  },
  required: ["seller", "buyer", "items"]
};

export const parseInvoiceText = async (text: string): Promise<Partial<InvoiceData> | null> => {
  let apiKey = '';
  try {
    // In a bundler environment like Vite, process.env.API_KEY is replaced by the actual string value
    // defined in vite.config.ts. We access it directly here.
    // @ts-ignore
    apiKey = process.env.API_KEY;
  } catch (e) {
    // Ignore environment access error
  }

  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please select a valid key.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract invoice data from the following text. 
      If a field is missing, leave it null or empty string. 
      For dates, convert to YYYY-MM-DD. 
      
      Text to parse:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        temperature: 0.1, // Low temperature for factual extraction
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const data = JSON.parse(jsonText);
    
    // Post-processing to ensure data matches our internal structure (e.g. adding IDs to items)
    if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map((item: any) => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9)
        }));
    }

    return data as Partial<InvoiceData>;

  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw error;
  }
};