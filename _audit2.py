import json, os, re

data_dir = 'src/data'
sb1_buckets = set()
sb2_buckets = set()
mf_paths = set()

for f in os.listdir(data_dir):
    if not f.endswith('.json'):
        continue
    with open(os.path.join(data_dir, f)) as fh:
        raw = fh.read()
    for m in re.finditer(r'https://iiugcpaznnwcegwificd\.supabase\.co/storage/v1/object/public/([^/"]+)', raw):
        sb1_buckets.add(m.group(1))
    for m in re.finditer(r'https://unhbvkszwhczbjxgetgk\.supabase\.co/storage/v1/object/public/([^/"]+)', raw):
        sb2_buckets.add(m.group(1))
    for m in re.finditer(r'https://cdn\.metaforge\.app/([^/"]+/[^/"]+)', raw):
        mf_paths.add(m.group(1))

print("=== SUPABASE iiugcpaznnwcegwificd (830 refs) - BUCKETS ===")
for p in sorted(sb1_buckets):
    print(f"  {p}")

print("\n=== SUPABASE unhbvkszwhczbjxgetgk (117 refs) - BUCKETS ===")
for p in sorted(sb2_buckets):
    print(f"  {p}")

print("\n=== METAFORGE CDN PATHS ===")
for p in sorted(mf_paths):
    print(f"  {p}")

# Check if guides.json has arcraidersmap.app content
print("\n=== GUIDES.JSON - arcraidersmap.app REFERENCES ===")
with open(os.path.join(data_dir, 'guides.json')) as fh:
    guides = json.load(fh)
for g in guides:
    body = json.dumps(g)
    if 'arcraidersmap.app' in body:
        print(f"  Guide: {g.get('title', g.get('name', 'unknown'))}")
        for m in re.finditer(r'https://arcraidersmap\.app[^"]*', body):
            print(f"    URL: {m.group(0)}")

# Check items.json structure
print("\n=== ITEMS.JSON SAMPLE (first 3) ===")
with open(os.path.join(data_dir, 'items.json')) as fh:
    items = json.load(fh)
for item in items[:3]:
    print(f"  {json.dumps(item, indent=2)[:500]}")

# Check blueprints.json structure
print("\n=== BLUEPRINTS.JSON SAMPLE (first 2) ===")
with open(os.path.join(data_dir, 'blueprints.json')) as fh:
    bps = json.load(fh)
for bp in bps[:2]:
    print(f"  {json.dumps(bp, indent=2)[:500]}")

# Check which files have NO external URLs (purely local data)
print("\n=== FILES WITH NO EXTERNAL URLS ===")
for f in sorted(os.listdir(data_dir)):
    if not f.endswith('.json'):
        continue
    with open(os.path.join(data_dir, f)) as fh:
        raw = fh.read()
    if not re.search(r'https?://', raw):
        print(f"  {f} (size: {len(raw)} bytes)")
