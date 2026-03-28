import json, urllib.request

def check_url(url):
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status == 200
    except Exception:
        return False

with open('src/data/items.json') as f:
    items = json.load(f)

sb_items = []
for item in items:
    icon = item.get('icon') or ''
    if 'iiugcpaznnwcegwificd.supabase.co' in icon:
        filename = icon.split('/')[-1]
        sb_items.append((item['name'], filename))

print(f'Items with Supabase icons: {len(sb_items)}')
found = 0
missing = []
for name, fn in sb_items:
    url = f'https://cdn.metaforge.app/arc-raiders/icons/{fn}'
    exists = check_url(url)
    if exists:
        found += 1
    else:
        missing.append((name, fn))
    status = 'FOUND' if exists else 'MISSING'
    print(f'  {name} ({fn}): {status}')

print(f'Found: {found}/{len(sb_items)}')
if missing:
    print(f'Missing ({len(missing)}):')
    for n, f in missing:
        print(f'  {n}: {f}')

# Also check the one missing blueprint: tactical-mk-3-revival-blueprint.webp
# Try alternate naming patterns
print()
print('=== CHECKING MISSING BLUEPRINT ALTERNATE NAMES ===')
alts = [
    'tactical-mk-3-revival-blueprint.webp',
    'tactical-mk3-revival-blueprint.webp',
    'tactical-mk-3-revival.webp',
    'tactical-mk3-revival.webp',
]
for alt in alts:
    url = f'https://cdn.metaforge.app/arc-raiders/icons/{alt}'
    exists = check_url(url)
    status = 'FOUND' if exists else 'MISSING'
    print(f'  {alt}: {status}')
