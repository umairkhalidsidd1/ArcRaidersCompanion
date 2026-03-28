#!/usr/bin/env python3
"""Final quality check on paraphrased guides."""
import json, re
from collections import Counter

with open('src/data/guides.json') as f:
    guides = json.load(f)

full_text = ' '.join(re.sub(r'<[^>]+>', ' ', g.get('content','')) for g in guides)
full_text = re.sub(r'\s+', ' ', full_text)

phrases = Counter()
words = full_text.split()
for n in [3, 4, 5]:
    for i in range(len(words) - n):
        p = ' '.join(words[i:i+n])
        if not any(x in p.lower() for x in ['arc ', 'raider', 'speranza', 'step ', 'dam battleground', 'blue gate', 'buried city', 'hidden bunker', 'hydroponic dome']):
            phrases[p] += 1

print("Top remaining non-game phrases (5+):")
for p, c in phrases.most_common(30):
    if c >= 5:
        print(f"  [{c}x] {p}")

# Print 3 full guides
for i in [0, 20, 50]:
    g = guides[i]
    text = re.sub(r'<[^>]+>', '\n', g['content'])
    text = re.sub(r'\n\s*\n', '\n', text).strip()
    title = g['title']
    gtype = g['type']
    summary = g.get('summary', '')
    print(f"\n{'='*60}")
    print(f"TITLE: {title} ({gtype})")
    print(f"SUMMARY: {summary}")
    print(f"{'='*60}")
    print(text[:600])
    print("...")
