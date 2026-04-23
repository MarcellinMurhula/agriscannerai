import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DiagnosisResult {
  diagnosis: string;
  status: 'healthy' | 'warning' | 'diseased';
  prediction: string;
  recommendations: string;
}

export async function diagnosePlant(base64Image: string): Promise<DiagnosisResult> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this plant photo for an artisanal farmer. 
Identify the plant and diagnose its health. 
Predict the future state of the plant and give clear recommendations.
Explain in French (as the user requested "plateforme web... pour agriculteur").

Response MUST be a JSON object with:
- diagnosis: A detailed description of the current health state.
- status: One of "healthy", "warning", or "diseased".
- prediction: What will happen to this plant in the near future.
- recommendations: Practical steps the farmer should take.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["healthy", "warning", "diseased"] },
          prediction: { type: Type.STRING },
          recommendations: { type: Type.STRING }
        },
        required: ["diagnosis", "status", "prediction", "recommendations"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  // Clean JSON string from potential markdown wrappers
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    return JSON.parse(cleanJson) as DiagnosisResult;
  } catch (e) {
    console.error("JSON parsing error:", e, "Original text:", text);
    throw new Error("Erreur de formatage de la réponse IA");
  }
}
