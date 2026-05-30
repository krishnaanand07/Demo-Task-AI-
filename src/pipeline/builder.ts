import * as fs from "fs";
import * as path from "path";
import { AppConfig } from "../engine/validator";
import { OnProgress } from "../types";

export async function generateApp(config: AppConfig, prompt: string, onProgress?: OnProgress): Promise<string> {
  const msg = "[Pipeline Stage 5] Building Application Files...";
  console.log(msg);
  onProgress?.({ stage: "Code Generation", status: "RUNNING", log: msg });
  
  // Create output directory
  const safeName = prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const timestamp = new Date().getTime();
  const outDir = path.join(__dirname, "../../../generated_apps", `${safeName}_${timestamp}`);
  
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, "frontend", "pages"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "backend"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "db"), { recursive: true });

  // 1. Generate SQL Database Schema
  generateDatabaseSchema(config, outDir);

  // 2. Generate Express Backend
  generateBackendServer(config, outDir);

  // 3. Generate React Frontend
  generateFrontendPages(config, outDir);

  const doneMsg = `[Pipeline Stage 5] Generation complete at ${outDir}`;
  console.log(doneMsg);
  onProgress?.({ stage: "Code Generation", status: "SUCCESS", log: doneMsg, data: { outDir } });
  return outDir;
}

function generateDatabaseSchema(config: AppConfig, outDir: string) {
  let sql = `-- Database Schema generated from System Design\n\n`;

  if (config.db && config.db.tables) {
    for (const table of config.db.tables) {
      sql += `CREATE TABLE ${table.name} (\n`;
      const columns = table.columns.map(col => {
        let def = `  ${col.name} `;
        
        switch (col.type) {
          case 'string': def += 'VARCHAR(255)'; break;
          case 'integer': def += 'INT'; break;
          case 'boolean': def += 'BOOLEAN'; break;
          case 'date': def += 'DATE'; break;
          case 'datetime': def += 'TIMESTAMP'; break;
          case 'float': def += 'FLOAT'; break;
          case 'json': def += 'JSON'; break;
          default: def += 'TEXT';
        }

        if (col.isPrimaryKey) def += ' PRIMARY KEY';
        if (!col.isNullable && !col.isPrimaryKey) def += ' NOT NULL';
        if (col.isUnique) def += ' UNIQUE';
        if (col.references) {
          def += ` REFERENCES ${col.references.table}(${col.references.column})`;
        }

        return def;
      });
      sql += columns.join(',\n');
      sql += `\n);\n\n`;
    }
  }

  fs.writeFileSync(path.join(outDir, "db", "schema.sql"), sql);
}

function generateBackendServer(config: AppConfig, outDir: string) {
  let code = `import express from 'express';\nimport cors from 'cors';\n\nconst app = express();\napp.use(cors());\napp.use(express.json());\n\n`;

  if (config.api && config.api.endpoints) {
    for (const endpoint of config.api.endpoints) {
      const expressMethod = endpoint.method.toLowerCase();
      code += `// ${endpoint.description || 'API Endpoint'}\n`;
      if (endpoint.authRequired) {
        code += `// Requires auth roles: ${endpoint.requiredRoles?.join(', ') || 'Any'}\n`;
      }
      code += `app.${expressMethod}('${config.api.baseUrl}${endpoint.path}', (req, res) => {\n`;
      
      // Simple mock response generator based on HTTP method
      if (expressMethod === 'get') {
        code += `  res.json({ message: 'Success', data: [] });\n`;
      } else {
        code += `  res.json({ message: 'Success', payload: req.body });\n`;
      }
      
      code += `});\n\n`;
    }
  }

  code += `app.listen(8080, () => {\n  console.log('Generated Backend listening on port 8080');\n});\n`;
  
  fs.writeFileSync(path.join(outDir, "backend", "server.ts"), code);
}

function generateFrontendPages(config: AppConfig, outDir: string) {
  if (config.ui && config.ui.pages) {
    for (const page of config.ui.pages) {
      // Basic React Functional Component generator
      const componentName = page.title.replace(/[^a-zA-Z0-9]/g, '');
      let code = `import React from 'react';\n\n`;
      code += `export default function ${componentName}Page() {\n`;
      code += `  return (\n    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>\n`;
      code += `      <h1>${page.title}</h1>\n`;
      code += `      <div className="layout-${page.layout}">\n`;
      
      if (page.components) {
        for (const comp of page.components) {
          code += `        <div className="component-${comp.type}" id="${comp.id}">\n`;
          code += `          {/* Render ${comp.type} component with props: ${JSON.stringify(comp.props)} */}\n`;
          code += `          <p>Placeholder for [${comp.type}]</p>\n`;
          code += `        </div>\n`;
        }
      }
      
      code += `      </div>\n    </div>\n  );\n}\n`;

      const fileName = `${componentName}.tsx`;
      fs.writeFileSync(path.join(outDir, "frontend", "pages", fileName), code);
    }
  }
}
