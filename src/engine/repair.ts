import { z } from "zod";
import { generateStructured } from "../llm";

export async function validateAndRepair<T>(
  jsonConfig: any,
  schema: z.ZodSchema<T>,
  schemaName: string,
  maxRetries: number = 2
): Promise<T> {
  let currentConfig = jsonConfig;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Engine] Validating ${schemaName} (Attempt ${attempt}/${maxRetries})...`);
    const validationResult = schema.safeParse(currentConfig);

    if (validationResult.success) {
      console.log(`[Engine] ${schemaName} is valid!`);
      return validationResult.data;
    }

    // Validation failed, let's repair
    const errors = validationResult.error.issues;
    console.warn(`[Engine] Validation failed for ${schemaName}. Found ${errors.length} errors.`);
    
    if (attempt === maxRetries) {
      throw new Error(`Failed to repair ${schemaName} after ${maxRetries} attempts.`);
    }

    console.log(`[Engine] Initiating repair loop...`);
    
    // Format error for LLM
    const errorDetails = errors.map((e: z.ZodIssue) => `- Path: ${e.path.join(".")} | Error: ${e.message}`).join("\n");
    
    const repairPrompt = `
You are the Repair Agent of an AI compiler.
The previous code generation for the ${schemaName} failed schema validation.

Errors found:
${errorDetails}

Current Invalid JSON:
${JSON.stringify(currentConfig, null, 2)}

Your task is to fix ONLY the errors mentioned above and return the corrected JSON.
Return ONLY valid JSON matching the exact schema requirements.`;

    try {
      currentConfig = await generateStructured<any>(repairPrompt, null, "You are a JSON repair bot.");
    } catch (e) {
      console.error(`[Engine] Repair LLM call failed:`, e);
      // Fallback: If LLM fails to even return JSON, we break or retry. Let loop handle it.
    }
  }

  throw new Error("Unexpected repair loop exit.");
}
