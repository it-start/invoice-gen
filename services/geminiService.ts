
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData, LeaseData, Asset, DomainType } from "../types";

// --- SCHEMAS ---

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

const leaseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reservationId: { type: Type.STRING },
    source: { type: Type.STRING },
    vehicle: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        details: { type: Type.STRING },
        plate: { type: Type.STRING }
      },
      required: ["name"]
    },
    pickup: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        time: { type: Type.STRING }
      }
    },
    dropoff: {
      type: Type.OBJECT,
      properties: {
        date: { type: Type.STRING, description: "YYYY-MM-DD" },
        time: { type: Type.STRING }
      }
    },
    pricing: {
      type: Type.OBJECT,
      properties: {
        daysRegular: { type: Type.NUMBER },
        priceRegular: { type: Type.NUMBER },
        daysSeason: { type: Type.NUMBER },
        priceSeason: { type: Type.NUMBER },
        deposit: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
      }
    },
    owner: {
      type: Type.OBJECT,
      properties: {
        surname: { type: Type.STRING },
        contact: { type: Type.STRING },
        address: { type: Type.STRING }
      }
    },
    renter: {
      type: Type.OBJECT,
      properties: {
        surname: { type: Type.STRING },
        contact: { type: Type.STRING },
        passport: { type: Type.STRING }
      }
    }
  },
  required: ["vehicle", "pickup", "dropoff", "pricing"]
};

const assetSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The concise name or title of the asset (e.g. 'BMW X5 2020' or 'Sunset Villa')." },
    domainType: {
      type: Type.STRING,
      enum: ["vehicle", "property", "equipment", "coworking"],
      description: "Classify the asset into one of these domains based on the text."
    },
    attributes: {
      type: Type.OBJECT,
      description: "Extract attributes matching the detected domain.",
      properties: {
        // Vehicle
        plate: { type: Type.STRING },
        vin: { type: Type.STRING },
        mileage: { type: Type.NUMBER },
        fuelType: { type: Type.STRING },
        // Property
        address: { type: Type.STRING },
        bedrooms: { type: Type.NUMBER },
        bathrooms: { type: Type.NUMBER },
        area: { type: Type.NUMBER },
        // Equipment
        serialNumber: { type: Type.STRING },
        modelYear: { type: Type.NUMBER },
        specs: { type: Type.STRING, description: "Technical specifications string" },
      }
    }
  },
  required: ["name", "domainType", "attributes"]
};

// --- API HELPER ---

const getAiClient = () => {
    let apiKey = '';
    try {
        // @ts-ignore
        apiKey = process.env.API_KEY;
    } catch (e) { }

    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
};

// --- PARSERS ---

export const parseInvoiceText = async (text: string): Promise<Partial<InvoiceData> | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract Russian invoice data. If field missing, leave null. Text: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: invoiceSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    const data = JSON.parse(jsonText);
    
    // Add IDs to items
    if (data.items && Array.isArray(data.items)) {
        data.items = data.items.map((item: any) => ({
            ...item,
            id: Math.random().toString(36).substr(2, 9)
        }));
    }
    return data as Partial<InvoiceData>;
  } catch (error) {
    console.error("Gemini Invoice Parse Error:", error);
    throw error;
  }
};

export const parseLeaseText = async (text: string): Promise<Partial<LeaseData> | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract vehicle lease agreement data. If field missing, leave null. Text: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: leaseSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText) as Partial<LeaseData>;
  } catch (error) {
     console.error("Gemini Lease Parse Error:", error);
     throw error;
  }
};

export const parseGenericAsset = async (text: string): Promise<Partial<Asset> | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this text and extract an asset structure. Classify it as vehicle, property, or equipment. Text: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: assetSchema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText) as Partial<Asset>;
  } catch (error) {
     console.error("Gemini Asset Parse Error:", error);
     throw error;
  }
};
