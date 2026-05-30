import * as fs from "fs";
import * as path from "path";
import { extractIntent } from "../pipeline/extractor";
import { designSystem } from "../pipeline/designer";
import { generateSchemas } from "../pipeline/generator";
import { refineSchemas } from "../pipeline/refiner";

interface DatasetItem {
  type: string;
  prompt: string;
}

async function runEvaluation() {
  const datasetPath = path.join(__dirname, "dataset.json");
  const dataset: DatasetItem[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  
  let successCount = 0;
  let totalTime = 0;
  const results: any[] = [];

  console.log(`Starting evaluation for ${dataset.length} prompts...\n`);

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    console.log(`[${i + 1}/${dataset.length}] Evaluating: "${item.prompt}"`);
    
    const startTime = Date.now();
    let success = false;
    let errorMsg = null;

    try {
      const intent = await extractIntent(item.prompt);
      const design = await designSystem(intent);
      const config = await generateSchemas(design);
      const finalConfig = await refineSchemas(config);
      success = true;
      successCount++;
    } catch (e: any) {
      errorMsg = e.message;
      console.error(`  -> Failed: ${errorMsg}`);
    }

    const duration = Date.now() - startTime;
    totalTime += duration;

    results.push({
      prompt: item.prompt,
      type: item.type,
      success,
      durationMs: duration,
      error: errorMsg
    });
  }

  const report = {
    totalEvaluated: dataset.length,
    successRate: `${(successCount / dataset.length) * 100}%`,
    averageLatencyMs: totalTime / dataset.length,
    results
  };

  fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(report, null, 2));
  console.log(`\nEvaluation complete! Success Rate: ${report.successRate}. Saved to results.json`);
}

runEvaluation();
