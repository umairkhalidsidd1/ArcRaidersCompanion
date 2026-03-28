#!/usr/bin/env python3
"""Paraphrase the 3 remaining unchanged guides."""
import json

with open('src/data/guides.json') as f:
    guides = json.load(f)

changes = 0

for g in guides:
    title = g['title']

    if title == 'In My Image':
        g['content'] = (
            '<h2>Objectives</h2>'
            '<ul>'
            '<li>Deploy into Stella Montis</li>'
            '<li>Find and search 3 Androids</li>'
            '</ul>'
            '<p>This quest is pretty simple. Just drop into the map and search for '
            'cyborg bodies you can loot. They can be found scattered across many '
            'different spots, so just keep exploring until you find three.</p>'
        )
        g['summary'] = (
            'A quick guide to completing the "In My Image" quest — '
            'find and loot 3 Android bodies across Stella Montis.'
        )
        changes += 1
        print(f"  Paraphrased: {title}")

    elif title == 'Cold Snap Patch Notes':
        g['content'] = '<p>View the official Cold Snap patch notes for full details on this update.</p>'
        g['summary'] = 'Official Cold Snap update patch notes.'
        changes += 1
        print(f"  Paraphrased: {title}")

    elif title == 'Easy coin farm using spotters':
        g['content'] = (
            '<p>Here is a simple way to farm lots of coins. Let a Bombardier spawn '
            'its Spotters — they keep spawning endlessly as long as you do not '
            'kill the Bombardier. Each Spotter relay is worth 5,000 coins, so you '
            'can rack up cash fast by farming them.</p>'
        )
        g['summary'] = 'A fast coin farming method using Bombardier Spotters that spawn infinitely.'
        changes += 1
        print(f"  Paraphrased: {title}")

with open('src/data/guides.json', 'w') as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)

print(f"\nTotal changed: {changes}")
