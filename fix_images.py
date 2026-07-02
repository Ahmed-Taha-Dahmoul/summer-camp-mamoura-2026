import os
import re

FRONTEND_DIR = r"c:\github\summer-camp-mamoura-2026\frontend\src"

def fix_image_urls(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # Pattern 1: src={post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`}
    # We want to replace it with: src={post.image ? post.image.replace(/^https?:\/\/[^\/]+/, '') : ''}
    
    # We use a regex to find: ([a-zA-Z0-9_.[\]]+)\.startsWith\('http'\)\s*\?\s*\1\s*:\s*`.*?`
    
    pattern = r"([a-zA-Z0-9_.[\]]+)\.startsWith\('http'\)\s*\?\s*\1\s*:\s*`[^`]*`"
    
    def replacer(match):
        var_name = match.group(1)
        # return replacement string
        return f"{var_name} ? {var_name}.replace(/^https?:\\/\\/[^\\/]+/, '') : ''"
    
    content = re.sub(pattern, replacer, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_image_urls(os.path.join(root, file))

print("Done fixing image URLs")
