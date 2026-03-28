import os, re

data_dir = 'src/data'

# Replacement patterns (order matters - more specific first)
replacements = [
    # unhbvkszwhczbjxgetgk Supabase -> Metaforge CDN (arcs, enemyDrops)
    (
        'https://unhbvkszwhczbjxgetgk.supabase.co/storage/v1/object/public/images/arc-raiders/icons/',
        'https://cdn.metaforge.app/arc-raiders/icons/'
    ),
    (
        'https://unhbvkszwhczbjxgetgk.supabase.co/storage/v1/object/public/images/arc-raiders/images/',
        'https://cdn.metaforge.app/arc-raiders/images/'
    ),
    # iiugcpaznnwcegwificd Supabase material-images -> Metaforge CDN (blueprints, items)
    (
        'https://iiugcpaznnwcegwificd.supabase.co/storage/v1/object/public/material-images/icons/',
        'https://cdn.metaforge.app/arc-raiders/icons/'
    ),
]

# Only process these files (NOT guides.json - those are screenshots, different issue)
target_files = ['arcs.json', 'blueprints.json', 'items.json', 'enemyDrops.json']

total_changes = 0

for filename in target_files:
    filepath = os.path.join(data_dir, filename)
    if not os.path.exists(filepath):
        print(f'SKIP: {filename} not found')
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    original = content
    file_changes = 0

    for old_prefix, new_prefix in replacements:
        count = content.count(old_prefix)
        if count > 0:
            content = content.replace(old_prefix, new_prefix)
            file_changes += count
            print(f'  {filename}: replaced {count}x {old_prefix[:60]}...')

    if file_changes > 0:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f'  {filename}: {file_changes} total replacements SAVED')
    else:
        print(f'  {filename}: no Supabase URLs found')

    total_changes += file_changes

print(f'\nTotal: {total_changes} Supabase URLs replaced with Metaforge CDN')

# Verify no Supabase URLs remain in target files
print('\n=== VERIFICATION ===')
for filename in target_files:
    filepath = os.path.join(data_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    sb1 = content.count('unhbvkszwhczbjxgetgk.supabase.co')
    sb2 = content.count('iiugcpaznnwcegwificd.supabase.co')
    mf = content.count('cdn.metaforge.app')
    print(f'  {filename}: supabase1={sb1}, supabase2={sb2}, metaforge={mf}')

# Check remaining Supabase across ALL json files
print('\n=== REMAINING SUPABASE URLS IN ALL FILES ===')
for f in sorted(os.listdir(data_dir)):
    if not f.endswith('.json'):
        continue
    with open(os.path.join(data_dir, f)) as fh:
        raw = fh.read()
    c1 = raw.count('unhbvkszwhczbjxgetgk.supabase.co')
    c2 = raw.count('iiugcpaznnwcegwificd.supabase.co')
    if c1 + c2 > 0:
        print(f'  {f}: supabase1={c1}, supabase2={c2}')
