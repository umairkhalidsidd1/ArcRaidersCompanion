#!/usr/bin/env python3
"""Clean up empty <li>, <p><br></p>, and other leftover elements from guides.json."""
import json, re

with open('src/data/guides.json') as f:
    guides = json.load(f)

total_cleaned = 0

for g in guides:
    c = g.get('content', '')
    if not c:
        continue

    original = c

    # Remove empty <li> tags (may contain <p><br></p> or just whitespace)
    c = re.sub(r'<li>\s*(?:<p>\s*(?:<br>\s*)*</p>\s*)*</li>', '', c)

    # Remove empty <p><br></p> tags
    c = re.sub(r'<p>\s*<br>\s*</p>', '', c)

    # Remove empty <p></p> tags
    c = re.sub(r'<p>\s*</p>', '', c)

    # Remove empty <ul></ul> tags (if all li were removed)
    c = re.sub(r'<ul>\s*</ul>', '', c)

    # Remove empty <ol></ol> tags
    c = re.sub(r'<ol>\s*</ol>', '', c)

    if c != original:
        total_cleaned += 1
        g['content'] = c

with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f'Guides cleaned: {total_cleaned}/{len(guides)}')

# Verify no empty elements remain
with open('src/data/guides.json') as f:
    raw = f.read()

empty_li = len(re.findall(r'<li>\s*</li>', raw))
empty_pbr = len(re.findall(r'<p>\s*<br>\s*</p>', raw))
empty_p = len(re.findall(r'<p>\s*</p>', raw))
print(f'Remaining empty <li>: {empty_li}')
print(f'Remaining <p><br></p>: {empty_pbr}')
print(f'Remaining empty <p>: {empty_p}')
