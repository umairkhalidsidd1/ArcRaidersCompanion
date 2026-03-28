#!/usr/bin/env python3
"""
Update all screen components to use resolveImage() instead of {uri: url}.
Adds import statement and replaces source={{uri: X}} with source={resolveImage(X)}.
"""
import re, os

SCREENS_DIR = 'src/screens'

# Files to update and NOT update
SKIP_FILES = {
    'MapDetailScreen.tsx',    # Map tile URLs, not game icons
    'GuidesScreen.tsx',       # Guide thumbnails (Supabase, not CDN) 
}

# Files that need updating
# For each file, we'll:
# 1. Add import {resolveImage} from '../data/imageRegistry';
# 2. Replace source={{uri: X}} with source={resolveImage(X)}

IMPORT_LINE = "import {resolveImage} from '../data/imageRegistry';"

def process_file(filepath):
    with open(filepath) as f:
        content = f.read()
    
    original = content
    basename = os.path.basename(filepath)
    
    if basename in SKIP_FILES:
        return False
    
    # Check if file has any source={{uri: patterns (excluding map URLs)
    if 'source={{uri:' not in content:
        return False
    
    # Special handling for GuideDetailScreen - only update r.item.icon, leave guide thumbnails
    if basename == 'GuideDetailScreen.tsx':
        # Only replace the r.item.icon pattern
        content = content.replace(
            'source={{uri: r.item.icon}}',
            'source={resolveImage(r.item.icon)}'
        )
        if content != original:
            # Add import
            content = add_import(content)
            with open(filepath, 'w') as f:
                f.write(content)
            return True
        return False
    
    # Special handling for QuestDetailScreen - replace CDN template literal
    if basename == 'QuestDetailScreen.tsx':
        # Replace the CDN+item_id pattern
        content = content.replace(
            "source={{uri: `${CDN}${reward.item_id}.webp`}}",
            "source={resolveImage(`icons/${reward.item_id}.webp`)}"
        )
        # Remove the CDN constant
        content = content.replace(
            "const CDN = 'https://cdn.metaforge.app/arc-raiders/icons/';\n",
            ""
        )
        if content != original:
            content = add_import(content)
            with open(filepath, 'w') as f:
                f.write(content)
            return True
        return False
    
    # Generic replacement: source={{uri: EXPR}} -> source={resolveImage(EXPR)}
    # This handles both single-line and the patterns we see
    # Pattern: source={{uri: <expression>}}
    # The expression can be: item.icon, arc.image, item.item_icon, ev.icon, etc.
    
    # Replace all source={{uri: X}} patterns
    # Match source={{uri: followed by any expression up to }}
    content = re.sub(
        r'source=\{\{uri:\s*([^}]+)\}\}',
        r'source={resolveImage(\1)}',
        content
    )
    
    if content != original:
        content = add_import(content)
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    
    return False

def add_import(content):
    """Add resolveImage import after existing imports."""
    if IMPORT_LINE in content:
        return content
    
    # Find a good place to insert - after the last import from '../data/' or '../theme/'
    # or after the first batch of imports
    lines = content.split('\n')
    insert_idx = 0
    
    for i, line in enumerate(lines):
        if line.startswith('import ') or line.startswith("import{"):
            insert_idx = i + 1
        # Handle multi-line imports
        elif insert_idx > 0 and (line.strip().startswith('}') and 'from' in line):
            insert_idx = i + 1
    
    lines.insert(insert_idx, IMPORT_LINE)
    return '\n'.join(lines)

# Process all .tsx files in screens directory
updated = []
for fname in sorted(os.listdir(SCREENS_DIR)):
    if not fname.endswith('.tsx'):
        continue
    path = os.path.join(SCREENS_DIR, fname)
    if process_file(path):
        updated.append(fname)
        print(f'  Updated: {fname}')

print(f'\nTotal files updated: {len(updated)}')
