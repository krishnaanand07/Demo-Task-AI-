import express from "express";
import cors from "cors";
import path from "path";
import { extractIntent } from "../pipeline/extractor";
import { designSystem } from "../pipeline/designer";
import { generateSchemas } from "../pipeline/generator";
import { refineSchemas } from "../pipeline/refiner";
import { generateApp } from "../pipeline/builder";
import { AppConfig } from "../engine/validator";

export function startServer(port: number = parseInt(process.env.PORT || '3000')) {
  const app = express();
  
  // Allow all origins for SSE cross-origin support
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../../public")));

  // In-memory mock database
  const mockDb: Record<string, any[]> = {};
  
  let currentConfig: AppConfig | null = null;

  app.get("/api/compile", async (req, res) => {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const prompt = req.query.prompt as string;
    if (!prompt) {
      res.write(`data: ${JSON.stringify({ type: 'ERROR', message: "Prompt is required via query parameter ?prompt=" })}\n\n`);
      return res.end();
    }

    const onProgress = (event: any) => {
      res.write(`data: ${JSON.stringify({ type: 'PROGRESS', event })}\n\n`);
    };

    try {
      console.log(`\n--- Compiling: "${prompt}" ---`);
      
      const intent = await extractIntent(prompt, onProgress);
      const design = await designSystem(intent, onProgress);
      const initialConfig = await generateSchemas(design, onProgress);
      const finalConfig = await refineSchemas(initialConfig, onProgress);
      
      const outDir = await generateApp(finalConfig, prompt, onProgress);
      
      currentConfig = finalConfig;
      
      // Initialize mock db tables based on schema
      if (finalConfig.db && finalConfig.db.tables) {
        finalConfig.db.tables.forEach(table => {
          if (!mockDb[table.name]) {
            mockDb[table.name] = [];
          }
        });
      }

      onProgress({ stage: "Complete", status: "SUCCESS", log: "Compilation Finished", data: { generatedAppPath: outDir, config: finalConfig } });
      res.write(`data: ${JSON.stringify({ type: 'DONE' })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Compilation failed:", error);
      onProgress({ stage: "Pipeline", status: "FAILED", log: error.message || "Compilation failed" });
      res.write(`data: ${JSON.stringify({ type: 'ERROR', message: error.message })}\n\n`);
      res.end();
    }
  });

  // Generic dynamic API mock handler based on currentConfig
  app.use("/mock/api", (req, res) => {
    if (!currentConfig) {
      return res.status(400).json({ error: "No app compiled yet" });
    }

    const endpointPath = req.path.replace("/mock/api", "");
    const endpoint = currentConfig.api.endpoints.find(e => 
      e.method === req.method && e.path === endpointPath
    );

    if (!endpoint) {
      return res.status(404).json({ error: `Mock endpoint ${req.method} ${endpointPath} not found in generated schema` });
    }

    // Very simple mock behavior
    if (req.method === "GET") {
      res.json({ message: "Mock GET successful", data: [] });
    } else if (req.method === "POST") {
      res.json({ message: "Mock POST successful", created: req.body });
    } else {
      res.json({ message: `Mock ${req.method} successful` });
    }
  });

  // SPA catch-all: serve index.html for any non-API route
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Runtime] Server started at http://localhost:${port}`);
  });
}
