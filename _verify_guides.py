import json, difflib

old = json.load(open('/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/data/guides.json.bak'))
new = json.load(open('/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/data/guides.json'))

total_old_chars = 0
total_changed_chars = 0

for o, n in zip(old, new):
    old_text = o.get('content','') + (o.get('summary') or '')
    new_text = n.get('content','') + (n.get('summary') or '')
    total_old_chars += len(old_text)
    sm = difflib.SequenceMatcher(None, old_text, new_text)
    matching = sum(block.size for block in sm.get_matching_blocks())
    total_changed_chars += (len(old_text) - matching)

print(f'Total original text: {total_old_chars:,} chars')
print(f'Characters changed: {total_changed_chars:,} chars')
print(f'Change rate: {total_changed_chars/total_old_chars*100:.1f}%')

old_raw = json.dumps(old)
new_raw = json.dumps(new)
print(f'OLD supabase URLs: {old_raw.count("supabase.co")}')
print(f'NEW supabase URLs: {new_raw.count("supabase.co")}')
print(f'OLD metaforge URLs: {old_raw.count("cdn.metaforge.app")}')
print(f'NEW metaforge URLs: {new_raw.count("cdn.metaforge.app")}')
print(f'OLD youtube URLs: {old_raw.count("youtube")}')
print(f'NEW youtube URLs: {new_raw.count("youtube")}')

authors = set(g.get('author','') for g in new)
print(f'Authors in new file: {authors}')
