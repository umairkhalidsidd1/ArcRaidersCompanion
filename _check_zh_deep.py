#!/usr/bin/env python3
"""Deeper analysis of untranslated user-facing strings in zh data files."""
import json

def has_chinese(s):
    return any('\u4e00' <= c <= '\u9fff' for c in str(s))

# 1. arcs_zh - check names
with open('src/data/zh/arcs_zh.json') as f:
    arcs = json.load(f)
print("=== ARCS ===")
for a in arcs:
    name = a.get('name', '')
    desc = a.get('description', '')[:60]
    name_cn = has_chinese(name)
    desc_cn = has_chinese(desc)
    if not name_cn or not desc_cn:
        print(f"  Name: {name} (CN:{name_cn}), Desc start: {desc} (CN:{desc_cn})")

# 2. arcLoot - check loot names
print("\n=== ARC LOOT ===")
with open('src/data/zh/arcLoot_zh.json') as f:
    loot = json.load(f)
for enemy, items in loot.items():
    for item in items:
        name = item.get('name', '')
        if name and not has_chinese(name):
            print(f"  [{enemy}] {name}")

# 3. maps - check user-facing fields
print("\n=== MAPS ===")
with open('src/data/zh/maps_zh.json') as f:
    maps = json.load(f)
for m in maps:
    for k in ['name', 'description', 'difficulty']:
        v = m.get(k, '')
        if v and not has_chinese(str(v)):
            print(f"  {m.get('name','?')}.{k}: {v}")

# 4. trials - check titles/descriptions
print("\n=== TRIALS ===")
with open('src/data/zh/trials_zh.json') as f:
    trials = json.load(f)
en_count = 0
for t in trials:
    for k in ['name', 'title', 'description', 'objective']:
        v = t.get(k, '')
        if v and not has_chinese(str(v)):
            en_count += 1
            if en_count <= 10:
                print(f"  {k}: {v[:80]}")
print(f"  Total English user-facing: {en_count}")

# 5. traders - sample
print("\n=== TRADERS (sample) ===")
with open('src/data/zh/traders_zh.json') as f:
    traders = json.load(f)
print(f"  Total items: {len(traders)}")
for t in traders[:3]:
    print(f"  {t.get('trader_name')}: {t.get('item_name')} ({t.get('item_rarity')}) - {t.get('item_description', '')[:60]}")

# 6. guides - check what's English besides IDs
print("\n=== GUIDES (beyond IDs) ===")
with open('src/data/zh/guides_zh.json') as f:
    guides = json.load(f)
en_fields = {}
for g in guides:
    for k in ['title', 'name']:
        v = g.get(k, '')
        if v and not has_chinese(str(v)):
            en_fields.setdefault(k, []).append(v)
    # Check reward names
    for r in g.get('rewards', []):
        item = r.get('item', {})
        name = item.get('name', '')
        if name and not has_chinese(name):
            en_fields.setdefault('reward_name', []).append(name)
    # Check steps
    for s in g.get('steps', []):
        title = s.get('title', '')
        if title and not has_chinese(title):
            en_fields.setdefault('step_title', []).append(title)

for k, v in en_fields.items():
    unique = sorted(set(v))
    print(f"  {k}: {len(unique)} unique English values")
    for u in unique[:5]:
        print(f"    {u[:80]}")
