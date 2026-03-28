#!/usr/bin/env python3
"""Find the 5 unchanged guides and paraphrase them."""
import json, re

with open('src/data/guides.json') as f:
    guides = json.load(f)

with open('src/data/guides.json.bak') as f:
    originals = json.load(f)

orig_map = {g['id']: g for g in originals}

unchanged = []
for idx, g in enumerate(guides):
    orig = orig_map.get(g['id'])
    if not orig:
        continue
    # Strip images from original for fair comparison
    orig_content = re.sub(r'<img[^>]*>', '', orig.get('content', '') or '')
    orig_content = re.sub(r'<p>\s*(?:<br>\s*)*</p>', '', orig_content)
    orig_content = re.sub(r'<p>\s*<br>\s*</p>', '', orig_content)

    cur_content = g.get('content', '') or ''

    orig_text = re.sub(r'<[^>]+>', '', orig_content).strip()
    cur_text = re.sub(r'<[^>]+>', '', cur_content).strip()

    if orig_text and cur_text:
        shorter = min(len(orig_text), len(cur_text))
        same = sum(1 for a, b in zip(orig_text, cur_text) if a == b)
        similarity = same / shorter if shorter > 0 else 1
        if similarity > 0.90:
            unchanged.append(idx)
            print(f"[{idx}] {g['title']} ({g['type']}) - {similarity:.1%} similar, {len(cur_text)} chars")
            print(f"  Content: {cur_text[:300]}")
            print()

print(f"Total unchanged: {len(unchanged)}")
