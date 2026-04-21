const fs = require('fs');

const files = [
  'D:\\coding\\systeme-transit-transports\\src\\components\\Employees.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace Labels
  content = content.replace(/<label\s+className="block text-sm font-medium text-gray-700 mb-1">([\s\S]*?)<\/label>/g, '<FormLabel>$1</FormLabel>');
  
  // Replace Inputs
  content = content.replace(/<input\n?\s*type="([^"]+)"([\s\S]*?)(?:className="[^"]*?")([\s\S]*?)\/>/g, (match, type, beforeClasses, afterClasses) => {
    // some inputs like checkbox shouldn't be blindly replaced with FormInput unless careful, but we only have text/email/number mostly
    if (type === 'checkbox' || type === 'radio') return match;
    return `<FormInput\n  type="${type}"${beforeClasses}${afterClasses}/>`;
  });

  // Replace Selects
  content = content.replace(/<select([\s\S]*?)(?:className="[^"]*?")([\s\S]*?)>/g, (match, beforeClasses, afterClasses) => {
    return `<FormSelect${beforeClasses}${afterClasses}>`;
  });
  content = content.replace(/<\/select>/g, '</FormSelect>');

  // Add imports
  const usesFormComponents = ['FormLabel', 'FormInput', 'FormSelect', 'FormTextarea'].some(c => content.includes(`<${c}`));
  if (usesFormComponents && !content.includes('FormComponents')) {
    const importStmt = `\nimport { FormLabel, FormInput, FormSelect, FormTextarea } from './common/FormComponents';`;
    const lastImportMatched = [...content.matchAll(/^import.*$/gm)].pop();
    if (lastImportMatched) {
      const lastImportIndex = content.lastIndexOf(lastImportMatched[0]) + lastImportMatched[0].length;
      content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  }
});
