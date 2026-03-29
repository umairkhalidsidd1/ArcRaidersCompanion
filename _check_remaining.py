import json, re

with open('src/data/zh/items_zh.json') as f:
    items = json.load(f)

# Check remaining genuinely mixed descriptions
# Exclude acceptable English: ARC, III, II, IV, I, Mk, MK, Celeste, Lance, Junior, Warden, J Kozma Ventures
ALLOWED = r'\b(ARC|III|MK|Mk\.\d|II|IV|I|Celeste|Lance|Junior|Warden|J Kozma Ventures)\b'

real_mixed = 0
for item in items:
    desc = item.get('description', '') or ''
    cleaned = re.sub(ALLOWED, '', desc)
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in cleaned)
    has_en = bool(re.search('[a-zA-Z]{3,}', cleaned))
    if has_cn and has_en:
        real_mixed += 1
        print(f'DESC: {item["name"]}: {desc[:180]}')

print(f'\nGenuinely mixed descriptions: {real_mixed}')

print('\n---NAMES---')
mixed_n = 0
for item in items:
    name = item.get('name', '')
    has_cn = any('\u4e00' <= c <= '\u9fff' for c in name)
    cleaned_name = re.sub(ALLOWED, '', name)
    has_en = bool(re.search('[a-zA-Z]{2,}', cleaned_name))
    if has_cn and has_en:
        mixed_n += 1
        print(f'NAME: {name}')

print(f'\nGenuinely mixed names: {mixed_n}')
