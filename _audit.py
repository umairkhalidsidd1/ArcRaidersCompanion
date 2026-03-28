import json, re, os
from collections import Counter

data_dir = 'src/data'
url_pattern = re.compile(r'https?://[^\s"<>,\\]+')
domain_counter = Counter()
file_urls = {}

for fname in sorted(os.listdir(data_dir)):
    fpath = os.path.join(data_dir, fname)
    if not fname.endswith('.json'):
        continue
    with open(fpath) as f:
        content = f.read()
    urls = url_pattern.findall(content)
    if urls:
        domains = set()
        for u in urls:
            m = re.match(r'https?://([^/]+)', u)
            if m:
                domains.add(m.group(1))
                domain_counter[m.group(1)] += 1
        file_urls[fname] = {'count': len(urls), 'domains': sorted(domains)}

print('=== EXTERNAL URLS IN JSON DATA FILES ===')
for fname, info in sorted(file_urls.items()):
    print(f'\n{fname}: {info["count"]} URLs')
    for d in info['domains']:
        print(f'  - {d}')

print(f'\n=== DOMAIN FREQUENCY ===')
for domain, count in domain_counter.most_common():
    print(f'  {domain}: {count} references')

# Sample URLs per domain
print('\n=== SAMPLE URLS PER DOMAIN ===')
for fname in sorted(os.listdir(data_dir)):
    fpath = os.path.join(data_dir, fname)
    if not fname.endswith('.json'):
        continue
    with open(fpath) as f:
        content = f.read()
    urls = url_pattern.findall(content)
    shown = {}
    for u in urls:
        m = re.match(r'https?://([^/]+)', u)
        if m:
            d = m.group(1)
            if d not in shown:
                shown[d] = u
    if shown:
        print(f'\n{fname}:')
        for d, u in shown.items():
            print(f'  {d}: {u[:120]}')
