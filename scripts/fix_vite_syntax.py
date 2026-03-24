import os
import re

def fix_broken_vite_config(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: ]\n    server: { ... },.filter(Boolean),
    # Note: the actual content might have variations in whitespace
    
    pattern = r'(\s*)\]\s*server:\s*\{([^\}]*)\}\s*,\.filter\(Boolean\)'
    replacement = r'\1].filter(Boolean),\n\1server: {\2}'
    
    if re.search(pattern, content):
        new_content = re.sub(pattern, replacement, content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed broken syntax in {file_path}")

sites_dir = '/home/kareltestspecial/0-IT/3-DEV/myAgent/athena-y/sites'
for root, dirs, files in os.walk(sites_dir):
    if 'vite.config.js' in files:
        fix_broken_vite_config(os.path.join(root, 'vite.config.js'))
