import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to env.txt
const envTxtPath = path.join(__dirname, '../src/expo-starter-frontend/icp/env.txt');
// Path to output file
const outputPath = path.join(__dirname, '../src/expo-starter-frontend/icp/env.generated.ts');

try {
  // Read env.txt
  const envContent = fs.readFileSync(envTxtPath, 'utf8');

  // Parse environment variables
  const envVars = {};
  const lines = envContent.split(/\r?\n/);

  lines.forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      const cleanValue = value.replace(/^['"]|['"]$/g, '');
      if (key && cleanValue) {
        envVars[key.trim()] = cleanValue;
      }
    }
  });

  // Generate TypeScript file content
  const tsContent = `// This file is auto-generated. Do not edit directly.
// Generated from env.txt by dfx deploy

export const ENV_VARS = ${JSON.stringify(envVars, null, 2)} as const;
`;

  // Write the file
  fs.writeFileSync(outputPath, tsContent);
  console.log('✅ env.generated.ts has been generated successfully.');

} catch (error) {
  console.error('Error generating env.generated.ts:', error);
  process.exit(1);
}