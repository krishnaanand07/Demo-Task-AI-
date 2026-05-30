import { generateStructured } from "../llm";
import { ExtractedIntent, OnProgress } from "../types";

const SYSTEM_INSTRUCTION = `You are an AI intent extraction engine.

Your job is to convert vague natural language software requirements into structured application intent JSON.

Requirements:

* Return ONLY valid JSON
* No explanations
* No markdown
* No extra text

Extract:

* appType
* coreFeatures
* userRoles
* entities
* workflows
* assumptions
* ambiguities
* requiredPages
* authRequirements

The output must be deterministic and structured.`;

export async function extractIntent(prompt: string, onProgress?: OnProgress): Promise<ExtractedIntent> {
  const msg = "[Pipeline Stage 1] Extracting Intent...";
  console.log(msg);
  onProgress?.({ stage: "Intent Extraction", status: "RUNNING", log: msg });
  
  const intent = await generateStructured<ExtractedIntent>(prompt, null, SYSTEM_INSTRUCTION);
  
  onProgress?.({ stage: "Intent Extraction", status: "SUCCESS", log: "Intent successfully extracted." });
  return intent;
}
