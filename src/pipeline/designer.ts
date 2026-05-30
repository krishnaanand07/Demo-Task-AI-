import { generateStructured } from "../llm";
import { ExtractedIntent, SystemDesign, OnProgress } from "../types";

const SYSTEM_INSTRUCTION = `You are the System Designer of an AI compiler. 
Your job is to take the extracted intent and design the system architecture.
Return ONLY valid JSON matching this schema:
{
  "architecture": "description of architecture",
  "dataModels": [
    {
      "name": "ModelName",
      "description": "What it represents",
      "fields": ["field1", "field2"]
    }
  ],
  "userFlows": ["flow1", "flow2"]
}`;

export async function designSystem(intent: ExtractedIntent, onProgress?: OnProgress): Promise<SystemDesign> {
  const msg = "[Pipeline Stage 2] Designing System...";
  console.log(msg);
  onProgress?.({ stage: "System Design", status: "RUNNING", log: msg });
  
  const prompt = JSON.stringify(intent, null, 2);
  const design = await generateStructured<SystemDesign>(prompt, null, SYSTEM_INSTRUCTION);
  
  onProgress?.({ stage: "System Design", status: "SUCCESS", log: "System Architecture generated successfully." });
  return design;
}
