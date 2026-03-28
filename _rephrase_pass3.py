#!/usr/bin/env python3
"""
Pass 3: Fix grammar issues and remaining awkward phrasing.
"""

import json
import re

with open('src/data/guides.json') as f:
    guides = json.load(f)

# Grammar fixes - exact string replacements
FIXES = [
    # Bad phrasings from automated replacements
    ("how to the best", "the best"),
    ("how to where to", "where to"),
    ("how to how to", "how to"),
    ("you'll see how to the", "here are the"),
    ("Here you'll see how to the", "Here are the"),
    ("Here you'll spot how to the", "Here are the"),
    ("the certain", "the"),
    ("a certain", "a specific"),
    ("with the 'Industrial' icon", "with the Industrial icon"),

    # Lowercase at start of <li> or <p> (after tag)
    # These we'll handle with regex below

    # Awkward double verbs
    ("has you find ", "has you finding "),
    ("has you collect ", "has you collecting "),
    ("has you loot ", "has you looting "),
    ("has you search ", "has you searching "),
    ("has you gather ", "has you gathering "),
    ("has you locate ", "has you locating "),
    ("has you get ", "has you getting "),
    ("has you defeat ", "has you defeating "),
    ("has you complete ", "has you completing "),
    ("has you deliver ", "has you delivering "),
    ("has you craft ", "has you crafting "),
    ("has you explore ", "has you exploring "),
    ("has you pick up ", "has you picking up "),
    ("has you talk ", "has you talking "),
    ("has you solve ", "has you solving "),
    ("has you reach ", "has you reaching "),
    ("has you visit ", "has you visiting "),
    ("has you place ", "has you placing "),
    ("has you investigate ", "has you investigating "),
    ("has you destroy ", "has you destroying "),
    ("has you scan ", "has you scanning "),
    ("has you obtain ", "has you obtaining "),
    ("has you bring ", "has you bringing "),
    ("has you recover ", "has you recovering "),
    ("has you acquire ", "has you acquiring "),
    ("has you unlock ", "has you unlocking "),
    ("has you open ", "has you opening "),
    ("has you interact ", "has you interacting "),
    ("has you activate ", "has you activating "),
    ("has you disable ", "has you disabling "),

    # Other grammar
    ("a enough", "enough"),
    ("an enough", "enough"),
]

changes = 0

for g in guides:
    content = g.get('content', '') or ''
    summary = g.get('summary', '') or ''
    orig_c = content
    orig_s = summary

    for bad, good in FIXES:
        content = content.replace(bad, good)
        summary = summary.replace(bad, good)

    # Fix lowercase after <li> and <p> tags (capitalize first letter)
    def capitalize_after_tag(m):
        return m.group(1) + m.group(2).upper()

    content = re.sub(r'(<li>)([a-z])', capitalize_after_tag, content)
    content = re.sub(r'(<p>)([a-z])', capitalize_after_tag, content)

    if content != orig_c or summary != orig_s:
        g['content'] = content
        g['summary'] = summary
        changes += 1

with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f"Guides fixed: {changes}/{len(guides)}")

# Check for remaining grammar issues
with open('src/data/guides.json') as f:
    raw = f.read()

issues = [
    ("how to the", len(re.findall(r'how to the\b', raw))),
    ("has you find ", raw.count("has you find ")),
    ("has you collect ", raw.count("has you collect ")),
    ("has you loot ", raw.count("has you loot ")),
    ("<li>lowercase", len(re.findall(r'<li>[a-z]', raw))),
    ("<p>lowercase", len(re.findall(r'<p>[a-z]', raw))),
]

print("\nRemaining issues:")
for name, count in issues:
    status = "✓" if count == 0 else f"{count} left"
    print(f"  {name}: {status}")
