// generate_guide.js
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch (e) {
    return 0;
  }
}

function getLineCount(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split('\n').length;
  } catch (e) {
    return 0;
  }
}

function extractFunctionsDetails(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const funcs = [];
  
  // Regex to match functions
  const fnRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)|(?:const|let|var|window\.)\s*([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:function\s*\(([^)]*)\)|\(([^)]*)\)\s*=>|([a-zA-Z0-9_$]+)\s*=>)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = line.match(fnRegex);
    if (match) {
      const name = match[1] || match[3];
      const params = match[2] || match[4] || match[5] || match[6] || '';
      if (name && !['require', 'exports', 'module', 'if', 'for', 'while', 'switch', 'catch'].includes(name)) {
        // Collect comments above function
        let comments = [];
        let j = i - 1;
        while (j >= 0 && (lines[j].trim().startsWith('//') || lines[j].trim().startsWith('*') || lines[j].trim().startsWith('/*'))) {
          const c = lines[j].trim().replace(/^\/\/\s*|^\/\*\s*|\*\/$|^\*\s*/, '');
          if (c) comments.unshift(c);
          j--;
          if (comments.length > 5) break;
        }

        // Find function end by tracking braces if possible
        let bodyLines = [];
        let braceCount = 0;
        let started = false;
        for (let k = i; k < Math.min(lines.length, i + 120); k++) {
          const l = lines[k];
          bodyLines.push(l);
          for (let char of l) {
            if (char === '{') { braceCount++; started = true; }
            else if (char === '}') { braceCount--; }
          }
          if (started && braceCount <= 0) break;
        }

        funcs.push({
          name,
          params: params.trim(),
          startLine: i + 1,
          endLine: i + bodyLines.length,
          comment: comments.join(' '),
          body: bodyLines
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return funcs.filter(f => {
    if (seen.has(f.name)) return false;
    seen.add(f.name);
    return true;
  });
}

function extractHtmlElements(filePath) {
  if (!fs.existsSync(filePath)) return { ids: [], classes: [] };
  const content = fs.readFileSync(filePath, 'utf8');
  const idMatches = content.match(/id=["']([^"']+)["']/g) || [];
  const classMatches = content.match(/class=["']([^"']+)["']/g) || [];
  
  const ids = [...new Set(idMatches.map(m => m.replace(/id=["']|["']/g, '')))];
  const classes = [...new Set(classMatches.map(m => m.replace(/class=["']|["']/g, '').split(/\s+/)).flat())].filter(c => c && c.length > 2);
  
  return { ids, classes };
}

module.exports = {
  getFileSize,
  getLineCount,
  extractFunctionsDetails,
  extractHtmlElements
};

console.log("Helper utilities ready.");
