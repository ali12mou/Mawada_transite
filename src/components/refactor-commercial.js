const fs = require('fs');

const file = 'D:\\coding\\systeme-transit-transports\\src\\components\\CommercialChamber.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('FormComponents')) {
  // Find last import
  const lastImportMatched = [...content.matchAll(/^import.*$/gm)].pop();
  const lastImportIndex = content.lastIndexOf(lastImportMatched[0]) + lastImportMatched[0].length;
  const importStmt = `\nimport { FormLabel, FormInput, FormSelect, PrimaryButton, SecondaryButton } from './common/FormComponents';`;
  content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
}

// 2. Replace label
content = content.replace(/<label className=\{labelClass\}>([\s\S]*?)<\/label>/g, '<FormLabel>$1</FormLabel>');

// 3. Replace input
content = content.replace(/<input\s+type="([^"]+)"([\s\S]*?)className=\{`\$\{inputClass\}([^`]*)`\}([\s\S]*?)\/>/g, (match, type, before, classExt, after) => {
  return `<FormInput type="${type}"${before}className="${classExt.trim()}"${after}/>`;
});

content = content.replace(/<input\s+type="([^"]+)"([\s\S]*?)className=\{inputClass\}([\s\S]*?)\/>/g, (match, type, before, after) => {
  return `<FormInput type="${type}"${before}${after}/>`;
});

// 4. Replace select
content = content.replace(/<select([\s\S]*?)className=\{`\$\{inputClass\}([^`]*)`\}([\s\S]*?)>/g, (match, before, classExt, after) => {
  return `<FormSelect${before}className="${classExt.trim()}"${after}>`;
});

content = content.replace(/<select([\s\S]*?)className=\{inputClass \+ '([^']+)'\}([\s\S]*?)>/g, (match, before, classExt, after) => {
  return `<FormSelect${before}className="${classExt.trim()}"${after}>`;
});

content = content.replace(/<\/select>/g, '</FormSelect>');

// 5. Replace buttons
const btnPrevRegex = /<button\s+type="button"\s+onClick=\{\(\) => setCurrentStep\(1\)\}\s+className="[^"]*rounded-xl border border-gray-200 bg-white[^"]*">([\s\S]*?)<\/button>/g;
content = content.replace(btnPrevRegex, '<SecondaryButton type="button" onClick={() => setCurrentStep(1)}>$1</SecondaryButton>');

const btnNextRegex = /<button\s+type="button"\s+onClick=\{\(\) => setCurrentStep\(2\)\}\s+className="[^"]*rounded-xl bg-\[#1e3a5f\][^"]*">([\s\S]*?)<\/button>/g;
content = content.replace(btnNextRegex, '<PrimaryButton type="button" onClick={() => setCurrentStep(2)}>$1</PrimaryButton>');

const btnSubmitRegex = /<button\s+type="submit"\s+className="[^"]*rounded-xl bg-\[#1e3a5f\][^"]*">([\s\S]*?)<\/button>/g;
content = content.replace(btnSubmitRegex, '<PrimaryButton type="submit">$1</PrimaryButton>');

fs.writeFileSync(file, content);
console.log("Updated", file);
