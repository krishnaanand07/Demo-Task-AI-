import { generateStructured } from "../llm";
import { SystemDesign, OnProgress } from "../types";
import { AppConfig, AppConfigSchema } from "../engine/validator";
import { validateAndRepair } from "../engine/repair";
import * as fs from "fs";

const SYSTEM_INSTRUCTION = `You are a deterministic application schema generator.

Rules:

* Return ONLY valid JSON
* No explanations
* No markdown
* No comments
* Stable structure
* Consistent naming
* Strict schema adherence

Requirements:

* Generate UI schema
* Generate API schema
* Generate DB schema
* Generate auth schema

Constraints:

* Use predictable naming
* Use reusable component patterns
* Ensure API and DB consistency
* Ensure auth consistency
* Ensure all pages have valid routes

The output must always follow the same structure and schema format EXACTLY as below:

EXPECTED JSON SCHEMA:
{
  "ui": {
    "theme": { "primaryColor": "string", "secondaryColor": "string" },
    "pages": [
      {
        "path": "string",
        "title": "string",
        "layout": "string",
        "components": [
          {
            "id": "string",
            "type": "string",
            "props": {},
            "children": [] // optional recursive components
          }
        ]
      }
    ]
  },
  "api": {
    "baseUrl": "/api",
    "endpoints": [
      {
        "path": "string",
        "method": "GET|POST|PUT|DELETE|PATCH",
        "description": "string",
        "requestSchema": {},
        "responseSchema": {},
        "authRequired": boolean,
        "requiredRoles": ["string"]
      }
    ]
  },
  "db": {
    "tables": [
      {
        "name": "string",
        "columns": [
          {
            "name": "string",
            "type": "string|integer|boolean|date|datetime|float|json",
            "isPrimaryKey": boolean,
            "isNullable": boolean,
            "isUnique": boolean,
            "references": { "table": "string", "column": "string" } // optional
          }
        ]
      }
    ]
  },
  "auth": {
    "roles": [
      { "name": "string", "permissions": ["string"] }
    ],
    "defaultRole": "string"
  }
}

Return ONLY this valid JSON object, without any markdown formatting.`;

export async function generateSchemas(design: SystemDesign, onProgress?: OnProgress): Promise<AppConfig> {
  const msg = "[Pipeline Stage 3] Generating Schemas (UI, API, DB, Auth)...";
  console.log(msg);
  onProgress?.({ stage: "Schema Generation", status: "RUNNING", log: msg });
  
  const prompt = `System Design:\n${JSON.stringify(design, null, 2)}\n\nGenerate the complete AppConfig JSON.`;
  const rawConfig = await generateStructured<any>(prompt, null, SYSTEM_INSTRUCTION);
  
  // Validate and Repair
  const validConfig = await validateAndRepair<AppConfig>(
    rawConfig,
    AppConfigSchema,
    "AppConfig",
    3 // up to 3 repair attempts
  );
  
  onProgress?.({ stage: "Schema Generation", status: "SUCCESS", log: "Schemas generated and validated successfully." });
  return validConfig;
}
