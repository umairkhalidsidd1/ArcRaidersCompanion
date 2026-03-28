import json, re
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.texts = []
    def handle_data(self, data):
        t = data.strip()
        if t and len(t) > 10:
            self.texts.append(t)

old = json.load(open('/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/data/guides.json.bak'))
new = json.load(open('/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/data/guides.json'))

print("=" * 60)
print("URL VERIFICATION")
print("=" * 60)

new_raw = json.dumps(new)
old_raw = json.dumps(old)

# Check for ANY remaining supabase URLs
supabase_remaining = re.findall(r'supabase\.co[^\s"]*', new_raw)
print(f"Supabase URLs remaining: {len(supabase_remaining)}")
if supabase_remaining:
    for u in supabase_remaining[:5]:
        print(f"  FOUND: {u}")

# Count metaforge URLs
metaforge_count = new_raw.count('cdn.metaforge.app')
print(f"Metaforge CDN URLs: {metaforge_count}")

# Check thumbnail_url fields
print(f"\nThumbnail URLs:")
for i, g in enumerate(new):
    t = g.get('thumbnail_url')
    if t and 'supabase' in t:
        print(f"  FAIL guide {i}: {t[:80]}")
    elif t and 'metaforge' in t:
        pass  # good
    elif t:
        print(f"  OTHER guide {i}: {t[:80]}")

thumb_supa = sum(1 for g in new if g.get('thumbnail_url') and 'supabase' in g['thumbnail_url'])
thumb_meta = sum(1 for g in new if g.get('thumbnail_url') and 'metaforge' in g['thumbnail_url'])
thumb_yt = sum(1 for g in new if g.get('thumbnail_url') and 'youtube' in g['thumbnail_url'])
thumb_none = sum(1 for g in new if not g.get('thumbnail_url'))
print(f"  Supabase: {thumb_supa}, Metaforge: {thumb_meta}, YouTube: {thumb_yt}, None: {thumb_none}")

# Check content img srcs
print(f"\nContent <img> src URLs:")
supa_imgs = 0
meta_imgs = 0
other_imgs = 0
for g in new:
    for src in re.findall(r'src=\\"([^"\\]+)\\"', json.dumps(g)):
        if 'supabase' in src:
            supa_imgs += 1
        elif 'metaforge' in src:
            meta_imgs += 1
        else:
            other_imgs += 1
print(f"  Supabase: {supa_imgs}, Metaforge: {meta_imgs}, Other: {other_imgs}")

print()
print("=" * 60)
print("TEXT PARAPHRASING VERIFICATION")
print("=" * 60)

unchanged_guides = []
for i, (o, n) in enumerate(zip(old, new)):
    # Compare text-only content (strip HTML tags and URLs)
    def strip_html_urls(s):
        s = re.sub(r'<[^>]+>', '', s)
        s = re.sub(r'https?://[^\s"<>]+', '', s)
        return s.strip()

    old_text = strip_html_urls(o.get('content', ''))
    new_text = strip_html_urls(n.get('content', ''))
    old_sum = o.get('summary', '') or ''
    new_sum = n.get('summary', '') or ''

    content_same = old_text == new_text
    summary_same = old_sum == new_sum

    if content_same and summary_same and len(old_text) > 20:
        unchanged_guides.append((i, o['title'], len(old_text)))

print(f"Guides with NO text changes: {len(unchanged_guides)}")
for idx, title, length in unchanged_guides:
    print(f"  Guide {idx}: '{title}' ({length} chars)")

# Show per-guide change stats
print(f"\nPer-guide change details:")
for i, (o, n) in enumerate(zip(old, new)):
    def strip_html_urls(s):
        s = re.sub(r'<[^>]+>', '', s)
        s = re.sub(r'https?://[^\s"<>]+', '', s)
        return s.strip()

    old_text = strip_html_urls(o.get('content', ''))
    new_text = strip_html_urls(n.get('content', ''))

    if len(old_text) < 20:
        status = "TINY"
    elif old_text == new_text:
        status = "UNCHANGED"
    else:
        # Count word-level changes
        old_words = old_text.split()
        new_words = new_text.split()
        common = set(old_words) & set(new_words)
        changed_pct = (1 - len(common) / max(len(set(old_words)), 1)) * 100
        status = f"changed ~{changed_pct:.0f}% words"

    old_author = o.get('author', '')
    new_author = n.get('author', '')
    author_changed = "author OK" if old_author != new_author or not old_author else "AUTHOR SAME"

    print(f"  {i:2d} [{status:>20s}] [{author_changed}] {o['title']}")
