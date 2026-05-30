import { generateStructured } from "../llm";
import { AppConfig, AppConfigSchema } from "../engine/validator";
import { validateAndRepair } from "../engine/repair";
import { ValidationOutput, OnProgress } from "../types";

const VALIDATOR_INSTRUCTION = `You are a cross-layer consistency engine for an AI application compiler.

Validate consistency across:

* UI schema
* API schema
* Database schema
* Auth schema

Rules:

1. Every UI data dependency must map to an API endpoint.
2. Every API entity must exist in the database schema.
3. Auth roles must match route permissions.
4. Component IDs must be unique.
5. Form fields must map to backend fields.
6. Protected pages must require authentication.

Return ONLY structured JSON.

Output Format:
{
"isConsistent": true,
"errors": [],
"warnings": [],
"checkedRelations": {
"uiToApi": true,
"apiToDb": true,
"authToRoutes": true
}
}`;

export async function refineSchemas(config: AppConfig, onProgress?: OnProgress): Promise<AppConfig> {
  const msg = "[Pipeline Stage 4] Running Semantic Validation Engine...";
  console.log(msg);
  onProgress?.({ stage: "Validation", status: "RUNNING", log: msg });
  
  const validationPrompt = `Validate this schema:\n${JSON.stringify(config, null, 2)}`;
  const validation = await generateStructured<ValidationOutput>(validationPrompt, null, VALIDATOR_INSTRUCTION);
  
  if (validation.isConsistent) {
    const successMsg = "[Pipeline Stage 4] Schema passed semantic validation natively.";
    console.log(successMsg);
    onProgress?.({ stage: "Validation", status: "SUCCESS", log: successMsg });
    return config; // It's completely valid, no need to regenerate the whole config!
  }
  
  const failMsg = `[Pipeline Stage 4] Semantic validation failed with ${validation.errors.length} errors. Running targeted repairs...`;
  console.log(failMsg);
  onProgress?.({ stage: "Validation", status: "FAILED", log: failMsg, data: validation.errors });
  onProgress?.({ stage: "Repair", status: "RUNNING", log: "Initiating Auto-Repair engine..." });
  
  const REPAIR_INSTRUCTION = `You are a repair engine for an AI software generation pipeline.

Your task is to repair ONLY invalid sections of generated application schemas.

Rules:

* preserve valid modules
* regenerate only failed module
* maintain cross-layer consistency
* return ONLY valid JSON
* no explanations
* no markdown

Input:

* failed module
* validation errors
* current system schema

Repair Goals:

* fix schema mismatches
* fix missing fields
* fix invalid JSON
* restore consistency
* preserve architecture

Output Format:
{
"repairedModule": {},
"repairSummary": {
"fixedIssues": [],
"preservedModules": [],
"consistencyStatus": true
}
}`;

  let currentConfig = { ...config };
  
  // Group errors by affected module (e.g. "ui", "api", "db", "auth")
  const modulesToRepair = [...new Set(validation.errors.map(e => e.affectedModule))];
  
  for (const moduleName of modulesToRepair) {
    // Only attempt repair if the module is a top-level config key
    if (!moduleName || typeof (currentConfig as any)[moduleName] === 'undefined') continue;
    
    const repMsg = `[Pipeline Stage 4] Repairing module: ${moduleName}...`;
    console.log(repMsg);
    onProgress?.({ stage: "Repair", status: "REPAIRING", log: repMsg });
    
    const moduleErrors = validation.errors.filter(e => e.affectedModule === moduleName);
    const repairPrompt = `
failed module: "${moduleName}"

validation errors:
${JSON.stringify(moduleErrors, null, 2)}

current system schema:
${JSON.stringify(currentConfig, null, 2)}
`;
    
    const repairOutput = await generateStructured<any>(repairPrompt, null, REPAIR_INSTRUCTION);
    
    // Dynamically merge the repaired module back into the main configuration!
    if (repairOutput && repairOutput.repairedModule) {
      (currentConfig as any)[moduleName] = repairOutput.repairedModule;
      const fixMsg = `[Pipeline Stage 4] Successfully patched ${moduleName}. Fixed issues: ${repairOutput.repairSummary?.fixedIssues?.join(", ")}`;
      console.log(fixMsg);
      onProgress?.({ stage: "Repair", status: "REPAIRING", log: fixMsg, data: repairOutput.repairSummary });
    }
  }
  
  // Ensure the refined version still matches the schema after all patches are applied!
  const validConfig = await validateAndRepair<AppConfig>(
    currentConfig,
    AppConfigSchema,
    "RefinedAppConfig",
    3 // up to 3 repair attempts for syntax/type mismatch
  );

  onProgress?.({ stage: "Repair", status: "SUCCESS", log: "All repairs completed and schema validated." });
  return validConfig;
}
