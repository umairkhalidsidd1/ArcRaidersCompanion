import json

with open('src/data/events.json') as f:
    events = json.load(f)

name_map = {
    'Bird City': '鸟城',
    'Cold Snap': '寒潮',
    'Electromagnetic Storm': '电磁风暴',
    'Harvester': '收割者',
    'Hurricane': '飓风',
    'Husk Graveyard': '外壳墓地',
    'Launch Tower Loot': '发射塔战利品',
    'Locked Gate': '上锁的门',
    'Lush Blooms': '繁花盛开',
    'Matriarch': '母体',
    'Night Raid': '夜袭',
    'Prospecting Probes': '勘探探针',
    'Uncovered Caches': '隐藏补给',
    'Hidden Bunker': '隐藏掩体',
}
map_map = {
    'Blue Gate': '蓝门',
    'Buried City': '埋葬之城',
    'Dam': '大坝',
    'Spaceport': '航天港',
    'Stella Montis': '星山',
}

zh = []
for e in events:
    zh.append({
        'id': e['id'],
        'name': name_map.get(e['name'], e['name']),
        'map': map_map.get(e['map'], e['map']),
    })

with open('src/data/zh/events_zh.json', 'w', encoding='utf-8') as f:
    json.dump(zh, f, ensure_ascii=False, indent=2)
print(f'Created events_zh.json with {len(zh)} events')
