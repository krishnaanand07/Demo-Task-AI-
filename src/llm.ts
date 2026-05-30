import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.NVIDIA_API_KEY;

// Initialize the OpenAI SDK for xAI
const openai = new OpenAI({
  apiKey: apiKey || "dummy-key",
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// Using the 8B model instead of 70B because large schema generation on 70B 
// takes too long and triggers a 504 Gateway Timeout on NVIDIA's free tier.
export const MODEL_NAME = "meta/llama-3.1-8b-instruct";

async function generateWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are a helpful coding assistant that strictly follows instructions." },
          { role: "user", content: prompt }
        ],
      });
      
      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      attempt++;
      const isRetryable = error?.status === 429 || error?.status === 503 || error?.status === 504 || error?.status === 502 || error?.message?.includes("503") || error?.message?.includes("429") || error?.message?.includes("504");
      if (isRetryable && attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000;
        console.warn(`[LLM] API Error: ${error.message}. Retrying in ${delayMs}ms (Attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        throw error;
      }
    }
  }
  return "";
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
  return await generateWithRetry(fullPrompt);
}

export async function generateStructured<T>(prompt: string, schema: any, systemInstruction?: string): Promise<T> {
  const fullPrompt = `${systemInstruction || ''}\n\nEnsure you output strictly in JSON format. Do not include markdown formatting like \`\`\`json. Just the raw JSON object.\n\n${prompt}`;
  
  const text = await generateWithRetry(fullPrompt);
  
  try {
    // Strip markdown formatting if the model still includes it
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.slice(7);
    if (cleanedText.startsWith('```')) cleanedText = cleanedText.slice(3);
    if (cleanedText.endsWith('```')) cleanedText = cleanedText.slice(0, -3);
    
    return JSON.parse(cleanedText.trim()) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${text}`);
  }
}
