#!/usr/bin/env python3
"""Analyze all zh data files for remaining English strings."""
import json

files = ['arcLoot_zh', 'arcs_zh', 'guides_zh', 'maps_zh', 'traders_zh', 'trials_zh']

def has_chinese(s):
    return any('\u4e00' <= c <= '\u9fff' for c in str(s))

def check_strings(obj, path='', results=None):
    if results is None:
        results = {'total': 0, 'english': 0, 'samples': []}
    if isinstance(obj, str) and len(obj) > 1:
        results['total'] += 1
        if not has_chinese(obj):
            results['english'] += 1
            if len(results['samples']) < 15:
                results['samples'].append(f'{path}: {obj[:100]}')
    elif isinstance(obj, dict):
        for k, v in obj.items():
            check_strings(v, f'{path}.{k}', results)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            check_strings(v, f'{path}[{i}]', results)
    return results

for fname in files:
    with open(f'src/data/zh/{fname}.json') as f:
        data = json.load(f)
    r = check_strings(data)
    print(f'{fname}: {r["english"]}/{r["total"]} English strings')
    for s in r['samples']:
        print(f'  {s}')
    print()
