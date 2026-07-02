import os
import re

FRONTEND_DIR = r"c:\github\summer-camp-mamoura-2026\frontend\src"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace base URLs in axios config:
    # baseURL: `http://${window.location.hostname}:8000/api/` -> baseURL: '/api/'
    content = re.sub(r'baseURL:\s*`http://\$\{window\.location\.hostname\}:8000/api/`', "baseURL: '/api/'", content)
    
    # 2. Replace URLs in axios calls:
    # `http://${window.location.hostname}:8000/api/accounts/login/` -> `/api/accounts/login/`
    content = re.sub(r'`http://\$\{window\.location\.hostname\}:8000(/api/[^`]+)`', r'`\1`', content)
    
    # 3. Replace image URLs:
    # `http://${window.location.hostname}:8000${group.banner}` -> `${group.banner}`
    # Wait, if it's just `${group.banner}`, we don't even need string interpolation if it's not mixed with other text.
    # But for safety, we'll just replace the prefix:
    content = re.sub(r'http://\$\{window\.location\.hostname\}:8000', '', content)
    
    # In Instantane.jsx, we have:
    # const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
    # This became `const API_URL = import.meta.env.VITE_API_URL || ``;
    # We should fix it to `const API_URL = ''`
    content = re.sub(r'const API_URL = import.meta.env.VITE_API_URL \|\| ``;', "const API_URL = '';", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            fix_file(os.path.join(root, file))

print("Fixed URLs")
