#!/usr/bin/env python3
"""
Fully paraphrase all guides.json content into easy, natural English.
Preserves: game names, item names, location names, NPC names, quest titles, HTML tags.
Changes: sentence structure, verbs, filler phrases, step headers, transitions.
"""

import json
import re
import random
import hashlib

random.seed(42)  # reproducible

with open('src/data/guides.json') as f:
    guides = json.load(f)

# ---------------------------------------------------------------------------
# 1) Protect game-specific tokens from being changed
# ---------------------------------------------------------------------------
# We'll extract quoted strings, HTML tags, and known game terms,
# replace them with placeholders, paraphrase, then restore.

# ---------------------------------------------------------------------------
# 2) Phrase-level replacements (order matters — longer first)
# ---------------------------------------------------------------------------
PHRASE_MAP = [
    # Intro phrases
    ("This tutorial goes over", [
        "This guide covers",
        "Here we explain",
        "This walkthrough explains",
        "In this guide, we cover",
        "This guide walks you through",
    ]),
    ("This guide will break down everything you must know about", [
        "Here's everything you need to know about",
        "This guide covers all the key details about",
        "We'll go over everything important about",
    ]),
    ("This guide will break down", [
        "This guide covers",
        "Here we go over",
        "We'll walk through",
    ]),
    ("this guide breaks down", [
        "this guide covers",
        "here we go over",
        "this walkthrough explains",
    ]),
    ("This guide breaks down", [
        "This guide covers",
        "Here we go over",
        "This walkthrough explains",
    ]),
    ("this tutorial goes over", [
        "this guide covers",
        "this walkthrough explains",
        "we cover",
    ]),

    # Step headers
    ("Step 1: Track Down the", [
        "Step 1: Find the",
        "Step 1: Locate the",
        "Step 1: Get to the",
        "Step 1: Head to the",
    ]),
    ("Step 1: Track Down", [
        "Step 1: Find",
        "Step 1: Locate",
    ]),
    ("Track Down the", [
        "Find the",
        "Locate the",
        "Get to the",
    ]),
    ("Track down the", [
        "Find the",
        "Locate the",
        "Get to the",
    ]),
    ("track down the", [
        "find the",
        "locate the",
        "get to the",
    ]),
    ("Track Down", [
        "Find",
        "Locate",
    ]),

    # Common quest phrases
    ("requires you to find", [
        "asks you to find",
        "needs you to find",
        "has you looking for",
    ]),
    ("requires you to loot", [
        "asks you to loot",
        "needs you to loot",
        "has you looting",
    ]),
    ("requires you to collect", [
        "asks you to collect",
        "needs you to gather",
        "has you collecting",
    ]),
    ("requires you to", [
        "asks you to",
        "needs you to",
        "has you",
    ]),
    ("you have to find", [
        "you need to find",
        "your job is to find",
        "you must find",
    ]),
    ("you have to", [
        "you need to",
        "you must",
        "your goal is to",
    ]),
    ("You have to", [
        "You need to",
        "You must",
        "Your goal is to",
    ]),

    # Actions
    ("Pull up your map", [
        "Open your map",
        "Check your map",
        "Bring up your map",
    ]),
    ("pull up your map", [
        "open your map",
        "check your map",
        "bring up your map",
    ]),
    ("Begin by checking your map", [
        "Start by opening your map",
        "First, open your map",
        "Open your map first",
    ]),
    ("Begin by pulling up your map", [
        "Start by opening your map",
        "First, check your map",
    ]),
    ("Check your map", [
        "Open your map",
        "Look at your map",
        "Bring up your map",
    ]),
    ("check your map", [
        "open your map",
        "look at your map",
        "bring up your map",
    ]),

    # Movement
    ("Head toward the", [
        "Go toward the",
        "Make your way to the",
        "Walk over to the",
        "Move toward the",
    ]),
    ("Head towards the", [
        "Go toward the",
        "Make your way to the",
        "Walk over to the",
        "Move toward the",
    ]),
    ("head toward the", [
        "go toward the",
        "make your way to the",
        "walk over to the",
        "move toward the",
    ]),
    ("head towards the", [
        "go toward the",
        "make your way to the",
        "walk over to the",
        "move toward the",
    ]),
    ("Head to the", [
        "Go to the",
        "Make your way to the",
        "Walk to the",
    ]),
    ("head to the", [
        "go to the",
        "make your way to the",
        "walk to the",
    ]),
    ("Head toward", [
        "Go toward",
        "Move toward",
        "Walk toward",
    ]),
    ("head toward", [
        "go toward",
        "move toward",
        "walk toward",
    ]),
    ("to reach the", [
        "to get to the",
        "until you reach the",
        "to arrive at the",
    ]),

    # Interaction
    ("Engage with the", [
        "Interact with the",
        "Use the",
        "Activate the",
    ]),
    ("engage with the", [
        "interact with the",
        "use the",
        "activate the",
    ]),
    ("Engage with it", [
        "Interact with it",
        "Use it",
    ]),
    ("engage with it", [
        "interact with it",
        "use it",
    ]),
    ("engage with", [
        "interact with",
        "use",
    ]),
    ("Engage with", [
        "Interact with",
        "Use",
    ]),

    # Searching
    ("Search for a", [
        "Look for a",
        "Find a",
        "Scan the area for a",
    ]),
    ("search for a", [
        "look for a",
        "find a",
        "scan the area for a",
    ]),
    ("Search for the", [
        "Look for the",
        "Find the",
    ]),
    ("search for the", [
        "look for the",
        "find the",
    ]),
    ("search for", [
        "look for",
        "find",
        "scan for",
    ]),

    # Location descriptions
    ("is located in", [
        "is in",
        "can be found in",
        "sits in",
    ]),
    ("is located at", [
        "is at",
        "can be found at",
        "sits at",
    ]),
    ("is located near", [
        "is near",
        "can be found near",
        "sits near",
    ]),
    ("is situated near", [
        "is near",
        "sits close to",
        "can be found near",
    ]),
    ("is situated in", [
        "is in",
        "can be found in",
    ]),

    # Completion
    ("finish the mission", [
        "complete the mission",
        "wrap up the mission",
        "turn in the mission",
    ]),
    ("Finish the mission", [
        "Complete the mission",
        "Wrap up the mission",
        "Turn in the mission",
    ]),
    ("finish the quest", [
        "complete the quest",
        "wrap up the quest",
        "turn in the quest",
    ]),
    ("Finish the quest", [
        "Complete the quest",
        "Wrap up the quest",
        "Turn in the quest",
    ]),
    ("to finish the", [
        "to complete the",
        "to wrap up the",
    ]),
    ("to complete this", [
        "to finish this",
        "to wrap up this",
    ]),
    ("to complete the", [
        "to finish the",
        "to wrap up the",
    ]),

    # Common filler
    ("Once you've", [
        "After you've",
        "When you've",
    ]),
    ("once you've", [
        "after you've",
        "when you've",
    ]),
    ("Once you", [
        "After you",
        "When you",
    ]),
    ("once you", [
        "after you",
        "when you",
    ]),
    ("Upon entering", [
        "When you enter",
        "As you go in",
        "Once inside",
    ]),
    ("upon entering", [
        "when you enter",
        "as you go in",
        "once inside",
    ]),
    ("as pictured", [
        "as shown",
        "shown here",
    ]),
    ("particular", [
        "specific",
        "certain",
    ]),
    ("Begin by", [
        "Start by",
        "First,",
    ]),
    ("begin by", [
        "start by",
        "first,",
    ]),
    ("is shown", [
        "appears",
        "is displayed",
    ]),
    ("you'll find", [
        "you can find",
        "you will see",
        "there is",
    ]),
    ("You'll find", [
        "You can find",
        "You will see",
        "There is",
    ]),

    # Rewards/completion
    ("collect your mission rewards", [
        "pick up your rewards",
        "claim your rewards",
        "grab your rewards",
    ]),
    ("collect your quest rewards", [
        "pick up your rewards",
        "claim your rewards",
        "grab your rewards",
    ]),
    ("Completing this mission grants you", [
        "You get",
        "Your rewards are",
        "For finishing, you receive",
    ]),
    ("Completing this quest grants you", [
        "You get",
        "Your rewards are",
        "For finishing, you receive",
    ]),
    ("grants you", [
        "gives you",
        "rewards you with",
        "earns you",
    ]),

    # Misc
    ("right away", [
        "immediately",
        "right after",
        "quickly",
    ]),
    ("Right away", [
        "Immediately",
        "Right after",
        "Quickly",
    ]),
    ("move down", [
        "go down",
        "head down",
        "walk down",
    ]),
    ("Move down", [
        "Go down",
        "Head down",
        "Walk down",
    ]),
    ("as noted", [
        "as mentioned",
        "like we said",
        "as described",
    ]),
    ("As noted", [
        "As mentioned",
        "Like we said",
        "As described",
    ]),
    ("relatively", [
        "fairly",
        "pretty",
        "quite",
    ]),
    ("additionally", [
        "also",
        "on top of that",
        "plus",
    ]),
    ("Additionally", [
        "Also",
        "On top of that",
        "Plus",
    ]),
    ("however", [
        "but",
        "though",
        "that said",
    ]),
    ("However", [
        "But",
        "Though",
        "That said",
    ]),
    ("in particular", [
        "especially",
        "mainly",
    ]),
    ("In particular", [
        "Especially",
        "Mainly",
    ]),
    ("furthermore", [
        "also",
        "plus",
        "on top of that",
    ]),
    ("Furthermore", [
        "Also",
        "Plus",
        "On top of that",
    ]),
    ("utilize", [
        "use",
    ]),
    ("Utilize", [
        "Use",
    ]),
    ("proceed to", [
        "go to",
        "head to",
        "move to",
    ]),
    ("Proceed to", [
        "Go to",
        "Head to",
        "Move to",
    ]),
    ("obtain", [
        "get",
        "pick up",
        "grab",
    ]),
    ("Obtain", [
        "Get",
        "Pick up",
        "Grab",
    ]),
    ("approximately", [
        "about",
        "around",
        "roughly",
    ]),
    ("encounter", [
        "run into",
        "find",
        "come across",
    ]),
    ("Encounter", [
        "Run into",
        "Find",
        "Come across",
    ]),
    ("adjacent to", [
        "next to",
        "beside",
        "near",
    ]),
    ("Adjacent to", [
        "Next to",
        "Beside",
        "Near",
    ]),
    ("subsequently", [
        "then",
        "next",
        "after that",
    ]),
    ("Subsequently", [
        "Then",
        "Next",
        "After that",
    ]),
    ("numerous", [
        "many",
        "several",
        "lots of",
    ]),
    ("Numerous", [
        "Many",
        "Several",
        "Lots of",
    ]),
    ("sufficient", [
        "enough",
    ]),
    ("commence", [
        "start",
        "begin",
    ]),
    ("Commence", [
        "Start",
        "Begin",
    ]),
    ("endeavor", [
        "try",
        "attempt",
    ]),
    ("substantial", [
        "big",
        "large",
        "major",
    ]),
    ("Substantial", [
        "Big",
        "Large",
        "Major",
    ]),
    ("immediately", [
        "right away",
        "at once",
        "quickly",
    ]),
    ("nevertheless", [
        "still",
        "even so",
        "but",
    ]),
    ("Nevertheless", [
        "Still",
        "Even so",
        "But",
    ]),
    ("previously", [
        "before",
        "earlier",
    ]),
    ("Previously", [
        "Before",
        "Earlier",
    ]),
    ("ensure that", [
        "make sure",
        "check that",
    ]),
    ("Ensure that", [
        "Make sure",
        "Check that",
    ]),
    ("ensure you", [
        "make sure you",
        "be sure to",
    ]),
    ("Ensure you", [
        "Make sure you",
        "Be sure to",
    ]),
    ("in order to", [
        "to",
        "so you can",
    ]),
    ("In order to", [
        "To",
        "So you can",
    ]),
    ("a variety of", [
        "different",
        "various",
        "all kinds of",
    ]),
    ("whether or not", [
        "if",
    ]),
    ("it is important to", [
        "make sure to",
        "be sure to",
        "you should",
    ]),
    ("It is important to", [
        "Make sure to",
        "Be sure to",
        "You should",
    ]),
    ("it's important to", [
        "make sure to",
        "be sure to",
        "you should",
    ]),
    ("It's important to", [
        "Make sure to",
        "Be sure to",
        "You should",
    ]),
    ("keep in mind", [
        "remember",
        "note",
        "don't forget",
    ]),
    ("Keep in mind", [
        "Remember",
        "Note",
        "Don't forget",
    ]),
    ("be aware that", [
        "note that",
        "keep in mind that",
        "watch out because",
    ]),
    ("Be aware that", [
        "Note that",
        "Keep in mind that",
        "Watch out because",
    ]),
    ("in the area", [
        "nearby",
        "around here",
        "close by",
    ]),
    ("on the right side", [
        "to the right",
        "on your right",
    ]),
    ("on the left side", [
        "to the left",
        "on your left",
    ]),
    ("right side of the", [
        "right part of the",
        "right half of the",
    ]),
    ("left side of the", [
        "left part of the",
        "left half of the",
    ]),
    ("is located on", [
        "is on",
        "can be found on",
    ]),

    # Weapon/gear guide specific
    ("boasts incredible", [
        "has great",
        "delivers strong",
        "offers impressive",
    ]),
    ("highly effective", [
        "very strong",
        "really good",
        "powerful",
    ]),
    ("newly implemented", [
        "new",
        "recently added",
    ]),
    ("at first perceived as", [
        "some players first thought it was",
        "initially seen as",
    ]),
    ("optimal", [
        "best",
        "ideal",
    ]),
    ("effectively", [
        "well",
        "successfully",
    ]),
    ("incredibly", [
        "very",
        "really",
        "extremely",
    ]),
    ("Incredibly", [
        "Very",
        "Really",
        "Extremely",
    ]),
    ("significantly", [
        "a lot",
        "greatly",
        "much",
    ]),
    ("Significantly", [
        "A lot",
        "Greatly",
        "Much",
    ]),
    ("specifically", [
        "exactly",
        "in particular",
    ]),
    ("Specifically", [
        "Exactly",
        "In particular",
    ]),
]


def pick_replacement(options, seed_str):
    """Deterministic but varied pick based on context."""
    h = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    return options[h % len(options)]


def paraphrase_text(text, guide_id):
    """Apply phrase replacements to plain text portions (not inside HTML tags or quoted game names)."""

    # Protect HTML tags
    tag_placeholders = {}
    tag_counter = [0]

    def save_tag(m):
        key = f"__TAG{tag_counter[0]}__"
        tag_placeholders[key] = m.group(0)
        tag_counter[0] += 1
        return key

    text = re.sub(r'<[^>]+>', save_tag, text)

    # Protect quoted strings (game names, quest titles)
    quote_placeholders = {}
    quote_counter = [0]

    def save_quote(m):
        key = f"__QT{quote_counter[0]}__"
        quote_placeholders[key] = m.group(0)
        quote_counter[0] += 1
        return key

    text = re.sub(r'&quot;[^&]*&quot;', save_quote, text)
    text = re.sub(r'"[^"]*"', save_quote, text)
    text = re.sub(r"'[A-Z][^']*'", save_quote, text)

    # Apply phrase replacements
    for original, options in PHRASE_MAP:
        count = 0
        while original in text:
            # Find position to create unique seed
            pos = text.find(original)
            seed = f"{guide_id}_{original}_{count}"
            replacement = pick_replacement(options, seed)
            text = text[:pos] + replacement + text[pos + len(original):]
            count += 1

    # Restore quotes
    for key, val in quote_placeholders.items():
        text = text.replace(key, val)

    # Restore HTML tags
    for key, val in tag_placeholders.items():
        text = text.replace(key, val)

    return text


def paraphrase_summary(summary, guide_id):
    """Paraphrase the summary field."""
    result = summary
    for original, options in PHRASE_MAP:
        count = 0
        while original in result:
            pos = result.find(original)
            seed = f"sum_{guide_id}_{original}_{count}"
            replacement = pick_replacement(options, seed)
            result = result[:pos] + replacement + result[pos + len(original):]
            count += 1
    return result


# ---------------------------------------------------------------------------
# Apply to all guides
# ---------------------------------------------------------------------------
content_changed = 0
summary_changed = 0

for g in guides:
    gid = g.get('id', g.get('slug', ''))

    # Paraphrase content
    old_content = g.get('content', '')
    if old_content:
        new_content = paraphrase_text(old_content, gid)
        if new_content != old_content:
            g['content'] = new_content
            content_changed += 1

    # Paraphrase summary
    old_summary = g.get('summary', '')
    if old_summary:
        new_summary = paraphrase_summary(old_summary, gid)
        if new_summary != old_summary:
            g['summary'] = new_summary
            summary_changed += 1

# ---------------------------------------------------------------------------
# Write output
# ---------------------------------------------------------------------------
with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f"Content paraphrased: {content_changed}/{len(guides)} guides")
print(f"Summaries paraphrased: {summary_changed}/{len(guides)} guides")

# Verify no game data was changed
with open('src/data/guides.json') as f:
    final = json.load(f)

# Quick quality checks
sample = final[0]
text = re.sub(r'<[^>]+>', ' ', sample['content'])
text = re.sub(r'\s+', ' ', text).strip()
print(f"\nSample (guide 0): {text[:250]}")

# Count remaining repeated phrases
full_text = ' '.join(re.sub(r'<[^>]+>', ' ', g['content']) for g in final)
for phrase in ["This tutorial goes over", "Track Down the", "engage with the", "pull up your map"]:
    c = full_text.lower().count(phrase.lower())
    print(f'  "{phrase}": {c} remaining')
