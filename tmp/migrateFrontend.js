import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../frontend/src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach( f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
};

walk(root, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if it doesn't contain supabase
  if (!content.includes('supabase')) return;

  // 1. Fix imports
  // If it's a deep module, we might need a different path. 
  // For simplicity, I'll use @api or relative if I can determine it.
  // Actually, I'll just use a pattern that works for most components in src/modules/...
  content = content.replace(/import \{ supabase \} from '.*?\/lib\/supabase';/g, "import { genericApi } from '../../api/genericApi';");

  // 2. list
  content = content.replace(/const \{ data, error \} = await supabase\s*\.from\('(.*?)'\)\s*\.select\('\*'\)(?:\s*\.order\(.*?\))?;/gs, "const data = await genericApi.list('$1');");

  // 3. update
  // Pattern: .update({...}).eq('id', id)
  content = content.replace(/const \{ error \} = await supabase\s*\.from\('(.*?)'\)\s*\.update\(\s*(\{[\s\S]*?\}|.*)\s*\)\s*\.eq\('id', (.*?)\);/gs, "await genericApi.update('$1', $3, $2);");

  // 4. insert
  content = content.replace(/const \{ error \} = await supabase\s*\.from\('(.*?)'\)\s*\.insert\(\[?\s*(\{[\s\S]*?\}|.*)\s*\]?\);/gs, "await genericApi.create('$1', $2);");

  // 5. delete
  content = content.replace(/const \{ error \} = await supabase\s*\.from\('(.*?)'\)\s*\.delete\(\)\s*\.eq\('id', (.*?)\);/gs, "await genericApi.delete('$1', $2);");

  // 6. Cleanup
  content = content.replace(/if \(error\) throw error;/g, "");

  fs.writeFileSync(filePath, content);
  console.log(`Migrated: ${filePath}`);
});
