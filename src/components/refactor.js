const fs = require('fs');
const path = require('path');

const componentsDir = __dirname;
const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const regexes = [
  // Labels: <label className="block text-sm...">...</label>
  {
    from: /<label\s+[^>]*?className=(['"]|{')[^>]*?(text-sm|font-medium)[^>]*?>([\s\S]*?)<\/label>/g,
    to: '<FormLabel>$3</FormLabel>'
  },
  // Inputs with className borders
  {
    from: /<input([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?)(['"]|})([^>]*?)>/g,
    to: '<FormInput$1$5>'
  },
  // Selects
  {
    from: /<select([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?)(['"]|})([^>]*?)>/g,
    to: '<FormSelect$1$5>'
  },
  // Textareas
  {
    from: /<textarea([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?)(['"]|})([^>]*?)>/g,
    to: '<FormTextarea$1$5>'
  }
];

const files = walkSync(componentsDir);
files.forEach(file => {
  if (file.includes('FormComponents.tsx') || file.includes('Modal.tsx') || file.includes('Users.tsx')) return;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  regexes.forEach(r => {
    content = content.replace(r.from, r.to);
  });

  // Adding imports if components were used
  const usesFormComponents = ['FormLabel', 'FormInput', 'FormSelect', 'FormTextarea'].some(c => content.includes(`<${c}`));
  if (usesFormComponents && !content.includes('FormComponents')) {
    // Find last import
    const lastImportMatched = [...content.matchAll(/^import.*$/gm)].pop();
    if (lastImportMatched) {
      const lastImportIndex = content.lastIndexOf(lastImportMatched[0]) + lastImportMatched[0].length;
      
      // Determine relative path to common/FormComponents
      let relativePath = '';
      if (file.includes('transit\\')) {
         relativePath = '../common/FormComponents';
      } else {
         relativePath = './common/FormComponents';
      }

      const importStmt = `\nimport { FormLabel, FormInput, FormSelect, FormTextarea, ModalFormFooter, PrimaryButton, SecondaryButton } from '${relativePath}';`;
      content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
    }
  }

  // Very naive inline Modal replacement to ensure close styling:
  // Usually this looks like: 
  // <div className="fixed inset-0 bg-black bg-opacity-50
  // Instead of replacing entire Modals via Regex (unsafe), let's just do standard buttons for Footer
  content = content.replace(/<button([^>]*?)className=(['"]|{')[^>]*?(bg-blue-600)[^>]*?(['"]|})([^>]*?)>/g, '<PrimaryButton$1$5>');
  content = content.replace(/<button([^>]*?)className=(['"]|{')[^>]*?(bg-gray-100|border-gray-300)[^>]*?(['"]|})([^>]*?)>/g, '<SecondaryButton$1$5>');
  
  // Close tag fixes for replaced buttons
  content = content.replace(/<\/button>/g, (match, offset, string) => {
    // This is risky if we didn't track which button it is.
    // Let's avoid closing tag replacement globally and use more precise regex for full button replacement if needed.
    return match;
  });
  // Actually, replacing the opening tag without closing tag is BAD! Let's undo button replacement.
  
  // Clean content - strip out the button replacement we just conceptually did:
  // Instead let's write a proper tag replacement function
  const replaceTag = (str, tagPattern, tagReplacement) => {
    let result = str;
    const openingRegex = new RegExp(`<button([^>]*?)className=(['"]|{')[^>]*?(${tagPattern})[^>]*?(['"]|})([^>]*?)>`, 'g');
    
    // We can't guarantee closing tags... let's just stick to self-closing inputs!
    return result;
  };

  // Re-read to prevent messed up contents
});

// Since the custom buttons function is hard via simple regex, let's just do Inputs/Labels which are easy or have standard self-closing/closing.
files.forEach(file => {
  if (file.includes('FormComponents.tsx') || file.includes('Modal.tsx') || file.includes('Users.tsx')) return;
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Labels
  content = content.replace(/<label\s+[^>]*?className=(['"]|{')[^>]*?(text-sm|font-medium)[^>]*?>([\s\S]*?)<\/label>/g, '<FormLabel>$3</FormLabel>');
  
  // Inputs
  content = content.replace(/<input([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?|focus:[^>]*?)(['"]|})([^>]*?)>/g, '<FormInput$1$5>');
  
  // Selects (Need closing tag handled)
  let selectReplacements = [];
  content = content.replace(/<select([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?|focus:[^>]*?)(['"]|})([^>]*?)>/g, (match, p1, p2, p3, p4, p5) => {
    return `<FormSelect${p1}${p5}>`;
  });
  content = content.replace(/<\/select>/g, '</FormSelect>');
  
  // Textareas
  content = content.replace(/<textarea([^>]*?)className=(['"]|{')[^>]*?(border[^>]*?|px-[^>]*?|py-[^>]*?|w-full[^>]*?|focus:[^>]*?)(['"]|})([^>]*?)>/g, '<FormTextarea$1$5>');
  content = content.replace(/<\/textarea>/g, '</FormTextarea>');

  // Adding imports if components were used
  const usesFormComponents = ['FormLabel', 'FormInput', 'FormSelect', 'FormTextarea'].some(c => content.includes(`<${c}`));
  if (usesFormComponents && content !== originalContent && !content.includes('FormComponents')) {
    const lastImportMatched = [...content.matchAll(/^import.*$/gm)].pop();
    if (lastImportMatched) {
      const lastImportIndex = content.lastIndexOf(lastImportMatched[0]) + lastImportMatched[0].length;
      let relativePath = '';
      if (file.includes('transit')) {
         relativePath = '../common/FormComponents';
      } else {
         relativePath = './common/FormComponents';
      }
      const importStmt = `\nimport { FormLabel, FormInput, FormSelect, FormTextarea } from '${relativePath}';`;
      content = content.slice(0, lastImportIndex) + importStmt + content.slice(lastImportIndex);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log("Updated", file);
  }
});
