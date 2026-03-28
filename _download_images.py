#!/usr/bin/env python3
"""
Download all Metaforge CDN images locally and generate imageRegistry.ts
"""
import json, os, re, urllib.request, sys

BASE = 'src/data'
ASSETS = 'src/assets/game'

# CDN base
CDN = 'https://cdn.metaforge.app/arc-raiders/'

# Collect ALL unique CDN URLs across all JSON files
all_urls = set()
for fname in os.listdir(BASE):
    if not fname.endswith('.json'):
        continue
    with open(os.path.join(BASE, fname)) as f:
        raw = f.read()
    for m in re.finditer(r'https://cdn\.metaforge\.app/arc-raiders/([^"]+)', raw):
        all_urls.add(m.group(1))

# Group by subfolder
groups = {}
for path in sorted(all_urls):
    parts = path.split('/')
    folder = parts[0]  # icons, images, custom, weekly-trials
    filename = '/'.join(parts[1:])
    groups.setdefault(folder, []).append(filename)

print(f'Total unique images: {len(all_urls)}')
for folder, files in sorted(groups.items()):
    print(f'  {folder}/: {len(files)} files')

# Create asset directories
for folder in groups:
    os.makedirs(os.path.join(ASSETS, folder), exist_ok=True)

# Download all images
downloaded = 0
failed = []
for path in sorted(all_urls):
    dest = os.path.join(ASSETS, path)
    if os.path.exists(dest):
        downloaded += 1
        continue
    url = CDN + path
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=10)
        data = resp.read()
        with open(dest, 'wb') as f:
            f.write(data)
        downloaded += 1
        sys.stdout.write(f'\r  Downloaded {downloaded}/{len(all_urls)}')
        sys.stdout.flush()
    except Exception as e:
        failed.append((path, str(e)))
        sys.stdout.write(f'\r  Downloaded {downloaded}/{len(all_urls)} (failed: {len(failed)})')
        sys.stdout.flush()

print(f'\n\nDownloaded: {downloaded}/{len(all_urls)}')
if failed:
    print(f'Failed ({len(failed)}):')
    for p, e in failed:
        print(f'  {p}: {e}')

# Generate imageRegistry.ts
# Maps: "icons/acoustic-guitar.webp" -> require('../assets/game/icons/acoustic-guitar.webp')
registry_lines = [
    '// Auto-generated image registry - DO NOT EDIT MANUALLY',
    '// Maps CDN paths to local bundled assets',
    '',
    'const IMAGE_REGISTRY: Record<string, any> = {',
]

for path in sorted(all_urls):
    # key is the relative path like "icons/acoustic-guitar.webp"
    registry_lines.append(f"  '{path}': require('../assets/game/{path}'),")

registry_lines.append('};')
registry_lines.append('')
registry_lines.append('/**')
registry_lines.append(' * Resolve an image URL or local key to a source object for <Image />')
registry_lines.append(' * If the key exists in the registry, returns the local require() result.')
registry_lines.append(' * Otherwise returns {uri: url} for network images.')
registry_lines.append(' */')
registry_lines.append('export function resolveImage(urlOrKey: string | null | undefined): any {')
registry_lines.append("  if (!urlOrKey) return null;")
registry_lines.append('')
registry_lines.append("  // Direct registry lookup (already a local key)")
registry_lines.append("  if (IMAGE_REGISTRY[urlOrKey]) return IMAGE_REGISTRY[urlOrKey];")
registry_lines.append('')
registry_lines.append("  // Extract path from full CDN URL")
registry_lines.append("  const cdnPrefix = 'https://cdn.metaforge.app/arc-raiders/';")
registry_lines.append("  if (urlOrKey.startsWith(cdnPrefix)) {")
registry_lines.append("    const key = urlOrKey.slice(cdnPrefix.length);")
registry_lines.append("    if (IMAGE_REGISTRY[key]) return IMAGE_REGISTRY[key];")
registry_lines.append("  }")
registry_lines.append('')
registry_lines.append("  // Fallback to network URI")
registry_lines.append("  return {uri: urlOrKey};")
registry_lines.append('}')
registry_lines.append('')
registry_lines.append('export default IMAGE_REGISTRY;')
registry_lines.append('')

registry_path = os.path.join('src/data', 'imageRegistry.ts')
with open(registry_path, 'w') as f:
    f.write('\n'.join(registry_lines))

print(f'Generated {registry_path} with {len(all_urls)} entries')
print('Done!')
