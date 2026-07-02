const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/Home.css', 'utf8');
content = content.replace(/\.quick-actions-bar\s*\{[\s\S]*?-ms-overflow-style: none; \/\* IE\/Edge \*\/\s*\}/m, 
`.quick-actions-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}`);
content = content.replace(/\.quick-action-btn\s*\{[\s\S]*?border: 1px solid rgba\(255,255,255,0\.1\);\s*\}/m, 
`.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.6rem 0.2rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.75rem;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.1);
}`);
fs.writeFileSync('frontend/src/pages/Home.css', content);
console.log("Done");
