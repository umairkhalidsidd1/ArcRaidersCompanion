#!/usr/bin/env python3
"""Verify guides.json is clean of all image references."""
import json, re

with open('src/data/guides.json') as f:
    guides = json.load(f)

with open('src/data/guides.json') as f:
    raw = f.read()

print(f"Total guides: {len(guides)}")
print(f"<img> tags: {len(re.findall(r'<img', raw))}")
print(f"guides/screenshots refs: {len(re.findall(r'guides/screenshots', raw))}")
print(f"supabase refs: {len(re.findall(r'supabase', raw))}")

empty_thumbs = sum(1 for g in guides if not g.get('thumbnail_url'))
print(f"Empty thumbnails: {empty_thumbs}/{len(guides)}")

short = [g['title'] for g in guides if len(g.get('content', '')) < 50]
print(f"Guides with very short content: {short}")

print(f"\nSample cleaned content (first guide, first 300 chars):")
print(guides[0]['content'][:300])
