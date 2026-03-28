#!/usr/bin/env python3
"""Remove all <img> tags (and their empty <p> wrappers) from guides.json content."""

import json
import re

with open('src/data/guides.json') as f:
    guides = json.load(f)

img_removed = 0
thumb_cleared = 0

for g in guides:
    # Clear thumbnail_url
    if g.get('thumbnail_url'):
        g['thumbnail_url'] = ''
        thumb_cleared += 1

    content = g.get('content', '')
    if not content:
        continue

    # Count before
    before = len(re.findall(r'<img\s', content))

    # Remove <p><img ...></p> blocks (with optional <br> before)
    content = re.sub(r'<p>\s*(?:<br>\s*)*<img[^>]*>\s*</p>', '', content)
    # Remove any remaining standalone <img> tags
    content = re.sub(r'<img[^>]*>', '', content)
    # Clean up leftover empty <p><br></p> that were before images
    content = re.sub(r'(<p>\s*<br>\s*</p>\s*)+(?=<h2>|<ul>|$)', '', content)
    # Remove trailing empty paragraphs
    content = re.sub(r'(<p>\s*<br>\s*</p>\s*)+$', '', content)

    img_removed += before
    g['content'] = content

with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f'Thumbnails cleared: {thumb_cleared}')
print(f'Img tags removed: {img_removed}')

# Verify
with open('src/data/guides.json') as f:
    raw = f.read()
remaining = len(re.findall(r'<img', raw))
print(f'Remaining <img> tags: {remaining}')
remaining_urls = len(re.findall(r'guides/screenshots', raw))
print(f'Remaining guides/screenshots refs: {remaining_urls}')
