#!/usr/bin/env python3
"""
Second pass: fix remaining repetitions and grammar issues from first paraphrase.
"""

import json
import re
import hashlib

with open('src/data/guides.json') as f:
    guides = json.load(f)

# ---------------------------------------------------------------------------
# Grammar fixes first
# ---------------------------------------------------------------------------
GRAMMAR_FIXES = [
    ("assists you in find", "helps you find"),
    ("tasks you with find", "has you finding"),
    ("tasks you with navigating", "has you navigating"),
    ("tasks you with collect", "has you collecting"),
    ("tasks you with go", "has you going"),
    ("tasks you with loot", "has you looting"),
    ("tasks you with search", "has you searching"),
    ("tasks you with gather", "has you gathering"),
    ("tasks you with locate", "has you locating"),
    ("tasks you with get", "has you getting"),
    ("how to where to", "where to"),
    ("explaining how to how", "explaining how"),
]

# ---------------------------------------------------------------------------
# Diversify over-used replacement phrases
# ---------------------------------------------------------------------------
# We'll rotate through alternatives based on position
DIVERSIFY = [
    # "Make your way to the" appeared 30x — too many
    ("Make your way to the", [
        "Go to the",
        "Head over to the",
        "Walk to the",
        "Travel to the",
        "Navigate to the",
    ]),
    ("make your way to the", [
        "go to the",
        "head over to the",
        "walk to the",
        "travel to the",
        "navigate to the",
    ]),
    ("Make your way to", [
        "Go to",
        "Head over to",
        "Walk to",
        "Travel to",
    ]),
    ("make your way to", [
        "go to",
        "head over to",
        "walk to",
        "travel to",
    ]),
    # "Get to the" still 16x
    ("Get to the", [
        "Go to the",
        "Reach the",
        "Head over to the",
    ]),
    ("get to the", [
        "go to the",
        "reach the",
        "head over to the",
    ]),
    # "Move toward the" 12x
    ("Move toward the", [
        "Go toward the",
        "Head toward the",
        "Walk toward the",
    ]),
    ("move toward the", [
        "go toward the",
        "head toward the",
        "walk toward the",
    ]),
    # "Bring up your map" 10x
    ("Bring up your map", [
        "Open your map",
        "Pull up your map",
        "Check your map",
    ]),
    ("bring up your map", [
        "open your map",
        "pull up your map",
        "check your map",
    ]),
    # "Open your map" 9x
    ("Open your map", [
        "Check your map",
        "Pull up your map",
        "Look at your map",
    ]),
    ("open your map", [
        "check your map",
        "pull up your map",
        "look at your map",
    ]),
    # "can be found" 16x
    ("can be found in", [
        "is in",
        "is inside",
        "sits in",
    ]),
    ("can be found at", [
        "is at",
        "sits at",
    ]),
    ("can be found near", [
        "is near",
        "is close to",
    ]),
    ("can be found on", [
        "is on",
        "sits on",
    ]),
    # "you will see" 11x
    ("you will see", [
        "you'll notice",
        "you'll spot",
        "there is",
    ]),
    ("You will see", [
        "You'll notice",
        "You'll spot",
        "There is",
    ]),
    # "wrap up the" 11x
    ("to wrap up the", [
        "to finish the",
        "to complete the",
    ]),
    ("wrap up the", [
        "finish the",
        "complete the",
    ]),
    # "Scan the area for a" 14x
    ("Scan the area for a", [
        "Look around for a",
        "Search nearby for a",
        "Try to spot a",
    ]),
    ("scan the area for a", [
        "look around for a",
        "search nearby for a",
        "try to spot a",
    ]),
    # "needs you to" 10x
    ("needs you to", [
        "asks you to",
        "requires you to",
        "has you",
    ]),
    # Other repeated transitions
    ("This guide covers", [
        "This walkthrough explains",
        "Here we go over",
        "In this guide, we explain",
    ]),
    ("this guide covers", [
        "this walkthrough explains",
        "here we go over",
        "in this guide, we explain",
    ]),
    ("This walkthrough explains", [
        "This guide goes over",
        "Here we walk through",
    ]),
    # "on your map" appears a lot but it's a game mechanic, just vary slightly
    ("appear on your map", [
        "show up on your map",
        "show on the map",
    ]),
    ("appears on your map", [
        "shows up on your map",
        "shows on the map",
    ]),
    # "Step 1: Find the" was overused
    ("Step 1: Find the", [
        "Step 1: Locate the",
        "Step 1: Go to the",
        "Step 1: Head to the",
    ]),
    ("Step 1: Locate the", [
        "Step 1: Find the",
        "Step 1: Go to the",
    ]),
]


def pick(options, seed_str):
    h = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    return options[h % len(options)]


changes = 0

for g in guides:
    gid = g.get('id', '')
    content = g.get('content', '') or ''
    summary = g.get('summary', '') or ''
    original_content = content
    original_summary = summary

    # Apply grammar fixes
    for bad, good in GRAMMAR_FIXES:
        content = content.replace(bad, good)
        summary = summary.replace(bad, good)

    # Diversify repeated phrases
    for phrase, options in DIVERSIFY:
        count = 0
        while phrase in content:
            pos = content.find(phrase)
            seed = f"d2_{gid}_{phrase}_{count}"
            rep = pick(options, seed)
            content = content[:pos] + rep + content[pos + len(phrase):]
            count += 1

        count = 0
        while phrase in summary:
            pos = summary.find(phrase)
            seed = f"d2s_{gid}_{phrase}_{count}"
            rep = pick(options, seed)
            summary = summary[:pos] + rep + summary[pos + len(phrase):]
            count += 1

    if content != original_content or summary != original_summary:
        g['content'] = content
        g['summary'] = summary
        changes += 1

with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f"Guides updated: {changes}/{len(guides)}")

# Verify
full_text = ' '.join(re.sub(r'<[^>]+>', ' ', g['content']) for g in guides)
for phrase in [
    "Make your way to the",
    "Get to the",
    "Move toward the",
    "Bring up your map",
    "can be found",
    "you will see",
    "Scan the area for",
    "wrap up the",
    "assists you in find",
    "how to where to",
]:
    c = full_text.lower().count(phrase.lower())
    if c > 0:
        print(f'  "{phrase}": {c} remaining')
    else:
        print(f'  "{phrase}": 0 ✓')
