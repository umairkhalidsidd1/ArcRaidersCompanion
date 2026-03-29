#!/usr/bin/env python3
"""Analyze & translate quests_zh.json."""
import json

with open('src/data/zh/quests_zh.json', 'r') as f:
    data = json.load(f)

quests = data['quests']

en_obj_count = 0
total_obj_count = 0
for q in quests:
    for o in q.get('objectives', []):
        total_obj_count += 1
        has_zh = any('\u4e00' <= c <= '\u9fff' for c in str(o))
        if not has_zh:
            en_obj_count += 1

en_loc = sum(1 for q in quests if not any('\u4e00' <= c <= '\u9fff' for c in q.get('location', '')))
en_unlock = sum(1 for q in quests if q.get('unlock_requirement') and not any('\u4e00' <= c <= '\u9fff' for c in q.get('unlock_requirement', '')))

print(f"Objectives: {en_obj_count}/{total_obj_count} still English")
print(f"Locations: {en_loc}/{len(quests)} still English")
print(f"Unlock requirements: {en_unlock}/{len(quests)} still English")

# Show untranslated locations
locs = set()
for q in quests:
    loc = q.get('location', '')
    has_zh = any('\u4e00' <= c <= '\u9fff' for c in loc)
    if not has_zh and loc:
        locs.add(loc)
print(f"\nUnique untranslated locations ({len(locs)}):")
for l in sorted(locs):
    print(f"  {l}")

# Show untranslated unlock requirements
urs = set()
for q in quests:
    ur = q.get('unlock_requirement', '')
    has_zh = any('\u4e00' <= c <= '\u9fff' for c in (ur or ''))
    if not has_zh and ur:
        urs.add(ur)
print(f"\nUnique untranslated unlock_requirements ({len(urs)}):")
for u in sorted(urs):
    print(f"  {u}")

# Show untranslated objectives
objs = set()
for q in quests:
    for o in q.get('objectives', []):
        has_zh = any('\u4e00' <= c <= '\u9fff' for c in str(o))
        if not has_zh:
            objs.add(str(o))
print(f"\nUnique untranslated objectives ({len(objs)}):")
for o in sorted(objs)[:30]:
    print(f"  {o}")

# Show reward names
reward_names = set()
for q in quests:
    for r in q.get('rewards', []):
        rn = r.get('name', '')
        has_zh = any('\u4e00' <= c <= '\u9fff' for c in rn)
        if not has_zh and rn:
            reward_names.add(rn)
print(f"\nUnique untranslated reward names ({len(reward_names)}):")
for rn in sorted(reward_names)[:20]:
    print(f"  {rn}")
