#!/usr/bin/env python3
"""Set thumbnail_url for every guide using existing local icons/custom images."""
import json

CDN = "https://cdn.metaforge.app/arc-raiders/"

# Manual mapping for guides that have NO rewards (general + 3 quest guides)
MANUAL_MAP = {
    # Quest guides without rewards
    "Snap and Salvage": "icons/snap-hook.webp",
    "Straight Record Quest": "icons/recorded.webp",
    "With A Trace": "icons/binoculars.webp",

    # General guides
    "Aphelion Breakdown": "icons/aphelion-rifle.webp",
    "Arc Survival Guide": "custom/lush.webp",
    "ARC Weaknesses": "icons/combat-mk-2.webp",
    "Blue Gate Puzzles & Loot": "icons/blue-gate-cellar-key.webp",
    "Cash Farming Guide for Expedition": "icons/looting-mk-2.webp",
    "Cold Snap Patch Notes": "custom/coldsnap.webp",
    "Easy coin farm using spotters": "icons/spotter.webp",
    "Glitched Queen Insta-Kill": "icons/queen.webp",
    "Hidden Bunker Event Location Spaceport": "custom/hiddenbunker.webp",
    "How to beat the Matriarch - NEW BOSS": "custom/matriarch.webp",
    "Important Materials and Their Locations": "icons/advanced-mechanical-components.webp",
    "Is the security breach skill worth it?": "icons/stella-montis-security-checkpoint-key.webp",
    "Paving the Way Quest": "icons/combat-mk-1.webp",
    "Stella Montis Keys - Where To Use": "icons/stella-montis-archives-key.webp",
    "Stella Montis Overview and Looting Guide": "icons/stella-montis-assembly-admin-key.webp",
    "Stench of Corruption Quest": "custom/husk-graveyard.webp",
    "Trials 3 Star Guide": "icons/mastery-medal-backpack-charm.webp",
    "Trials High Scoring Guide for Week of Nov 10th": "icons/mastery-medal-backpack-charm.webp",
    "Trials Week 5": "icons/mastery-medal-backpack-charm.webp",
    "Trials Week 6 High Scoring Guide": "icons/mastery-medal-backpack-charm.webp",
    "Trials Week 7": "icons/mastery-medal-backpack-charm.webp",
    "Turnabout": "icons/camera-lens.webp",
    "Weekly Trials Nov 17th": "icons/mastery-medal-backpack-charm.webp",
}

with open("src/data/guides.json") as f:
    guides = json.load(f)

changed = 0
for g in guides:
    title = g["title"]

    # First, check manual map
    if title in MANUAL_MAP:
        g["thumbnail_url"] = CDN + MANUAL_MAP[title]
        changed += 1
        print(f"  MANUAL  {title[:50]} -> {MANUAL_MAP[title]}")
        continue

    # Use first reward icon
    rewards = g.get("rewards") or []
    icons = [r["item"]["icon"] for r in rewards if r.get("item", {}).get("icon")]
    if icons:
        g["thumbnail_url"] = icons[0]
        changed += 1
        path = icons[0].split("/arc-raiders/")[-1]
        print(f"  REWARD  {title[:50]} -> {path}")
        continue

    print(f"  NONE    {title[:50]} -> NO IMAGE FOUND")

print(f"\nTotal updated: {changed}/{len(guides)}")

with open("src/data/guides.json", "w") as f:
    json.dump(guides, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("Saved guides.json")
