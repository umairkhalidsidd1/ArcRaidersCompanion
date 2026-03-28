#!/usr/bin/env python3
"""
Paraphrase guides.json: rewrite all text, replace Supabase URLs with Metaforge CDN.
Preserves HTML structure, game-specific terms, image tags, and meaning.
"""
import json, re, random

random.seed(42)  # reproducible output

SRC = 'src/data/guides.json'
OUT = 'src/data/guides.json'

# ── URL replacement ──────────────────────────────────────────────────
SUPABASE_BASE = 'https://iiugcpaznnwcegwificd.supabase.co/storage/v1/object/public/guides/screenshots/'
METAFORGE_BASE = 'https://cdn.metaforge.app/arc-raiders/guides/screenshots/'

# ── Phrase-level paraphrasing (applied in order, case-insensitive) ──
# Format: (pattern, replacement) – patterns are regex
PHRASE_MAP = [
    # ── Guide intro patterns ──
    (r"This guide will walk you through", "This walkthrough covers"),
    (r"This guide provides a detailed walkthrough", "Here is a thorough walkthrough"),
    (r"This guide provides step-by-step instructions for completing", "Follow these instructions to finish"),
    (r"This guide provides a step-by-step walkthrough", "Below is a complete walkthrough"),
    (r"This guide provides a detailed", "Here is a comprehensive"),
    (r"This guide provides a comprehensive overview", "Below is a full overview"),
    (r"This guide provides", "This tutorial offers"),
    (r"This guide details how to locate and search", "Learn how to find and investigate"),
    (r"This guide details how to complete", "Here's how to finish"),
    (r"This guide details how to", "This tutorial explains how to"),
    (r"This guide details the steps to complete", "Follow along to finish"),
    (r"This guide details the steps", "These steps outline how"),
    (r"This guide details", "This tutorial covers"),
    (r"This guide covers", "This tutorial goes over"),
    (r"This guide will show you how to complete", "Learn how to finish"),
    (r"This guide will show you", "Here you'll see how to"),
    (r"This guide will help you", "This tutorial assists you in"),
    (r"This walkthrough covers", "This tutorial goes over"),
    (r"A step-by-step guide to completing", "A detailed walkthrough for finishing"),
    (r"A quick guide to completing", "A concise walkthrough for finishing"),
    (r"step-by-step", "detailed"),

    # ── Summary patterns ──
    (r"including a specific location example on", "with a noted spot on"),
    (r"including specific locations", "with exact spots"),
    (r"including the specific", "along with the exact"),
    (r"focusing on locating and collecting", "centered on finding and gathering"),
    (r"focusing on navigating to", "centered on heading toward"),
    (r"focusing on finding", "centered on locating"),
    (r"focusing on", "centered on"),
    (r", including", ", featuring"),

    # ── Step headers ──
    (r"Step (\d+): Accept the Quest", r"Step \1: Pick Up the Quest"),
    (r"Step (\d+): Locate the Quest Giver", r"Step \1: Find the Quest NPC"),
    (r"Step (\d+): Locate the", r"Step \1: Find the"),
    (r"Step (\d+): Enter the Building", r"Step \1: Go Inside the Building"),
    (r"Step (\d+): Navigate to", r"Step \1: Head Toward"),
    (r"Step (\d+): Collect the", r"Step \1: Pick Up the"),
    (r"Step (\d+): Complete the Quest", r"Step \1: Finish the Quest"),
    (r"Step (\d+): Return to", r"Step \1: Go Back to"),
    (r"Step (\d+): Breach and Search", r"Step \1: Hack and Loot"),
    (r"Step (\d+): Interact with", r"Step \1: Use"),
    (r"Step (\d+): Find the", r"Step \1: Track Down the"),
    (r"Step (\d+): Search for", r"Step \1: Look For"),
    (r"Step (\d+): Ascend to", r"Step \1: Climb to"),
    (r"Step (\d+): Reach the", r"Step \1: Get to the"),

    # ── Common action phrases ──
    (r"Accept the quest titled", "Pick up the quest called"),
    (r"Accept the quest", "Take on the quest"),
    (r"Begin by opening your map and pinpointing", "Start by pulling up your map and locating"),
    (r"Begin by opening your map", "Start by pulling up your map"),
    (r"First, open your map to view", "Start by checking your map to see"),
    (r"First, open your map and locate", "Begin by checking your map and finding"),
    (r"First, open your map and navigate", "Start by pulling up your map and heading"),
    (r"First, open your map", "Start by pulling up your map"),
    (r"Open your map and locate", "Pull up your map and find"),
    (r"Open your map and navigate", "Check your map and head"),
    (r"Open your map and set", "Pull up your map and place"),
    (r"Open your map to locate", "Check your map to find"),
    (r"Open your map to find", "Pull up your map to spot"),
    (r"Open your map again to", "Check your map once more to"),
    (r"Open your map to", "Pull up your map to"),
    (r"open your map", "pull up your map"),

    (r"Set a waypoint to the", "Mark a waypoint at the"),
    (r"Set a waypoint", "Place a waypoint"),
    (r"Mark a waypoint", "Pin a waypoint"),

    (r"Your first objective is to", "The initial task is to"),
    (r"The objective is to find and search", "Your goal is to locate and examine"),
    (r"The objective is to", "Your goal is to"),
    (r"to complete the objective", "to finish the task"),
    (r"completing the quest objective", "finishing the mission task"),
    (r"the quest will be marked as complete", "the mission will register as finished"),

    (r"Approach the building from", "Head toward the building from"),
    (r"Approach the building and find", "Walk up to the building and locate"),
    (r"Approach the (\w+) and interact", r"Walk up to the \1 and engage"),
    (r"Approach the (\w+) or (\w+) and interact", r"Walk up to the \1 or \2 and engage"),
    (r"Approach them and interact to collect them", "Walk over and interact to grab them"),
    (r"Approach the", "Head toward the"),
    (r"approach the", "walk toward the"),

    (r"interact with it to begin", "engage with it to start"),
    (r"interact with it again to", "engage with it once more to"),
    (r"interact with it to", "engage with it to"),
    (r"Interact with the (\w+) to", r"Use the \1 to"),
    (r"Interact with the", "Engage with the"),
    (r"interact with the", "engage with the"),
    (r"Interact with it", "Engage with it"),
    (r"interact with", "engage with"),

    (r"Once you arrive at the", "When you get to the"),
    (r"Once you arrive,", "When you get there,"),
    (r"Once you're there", "After arriving"),
    (r"Once you get close enough", "When you're near enough"),
    (r"Once you are near the", "When you're close to the"),
    (r"Once on the roof,", "After reaching the rooftop,"),
    (r"Once inside,", "After entering,"),
    (r"Once inside the", "After going into the"),
    (r"Once breached,", "After hacking it,"),
    (r"Once you've spotted", "After you notice"),
    (r"Once you reach", "After you arrive at"),
    (r"Once you have", "After you obtain"),
    (r"Once you find", "After locating"),
    (r"Once the", "After the"),

    (r"Look for the structure labeled", "Find the building marked"),
    (r"Look for a (\w+)", r"Search for a \1"),
    (r"look for", "search for"),
    (r"Look for", "Search for"),

    (r"you will need to", "you must"),
    (r"You will need to", "You must"),
    (r"you'll need to", "you have to"),
    (r"You'll need to", "You have to"),
    (r"you need to", "you must"),
    (r"You need to", "You must"),
    (r"will need to", "must"),
    (r"you will find", "you'll discover"),
    (r"you will typically receive", "you usually obtain"),
    (r"you will receive", "you'll obtain"),
    (r"You will typically", "You usually"),
    (r"You will receive", "You'll obtain"),

    (r"Navigate through the", "Move through the"),
    (r"navigate the", "make your way through the"),
    (r"Navigate to the", "Make your way to the"),
    (r"navigate to the", "head over to the"),
    (r"Navigate to", "Head to"),

    (r"Make your way to the", "Travel to the"),
    (r"make your way to the", "travel to the"),
    (r"Make your way to", "Head over to"),
    (r"make your way to", "travel over to"),
    (r"Make your way", "Proceed"),
    (r"make your way", "proceed"),

    (r"Locate the open elevator shaft", "Find the accessible elevator shaft"),
    (r"Locate the", "Find the"),
    (r"locate the", "find the"),
    (r"Locate a", "Find a"),
    (r"locate a", "find a"),

    (r"Proceed to the", "Continue to the"),
    (r"proceed to the", "continue to the"),
    (r"Proceed to", "Continue to"),
    (r"proceed to", "continue to"),

    (r"Continue through the corridors", "Keep moving through the hallways"),
    (r"Continue through the", "Keep going through the"),
    (r"continue through", "keep going through"),

    (r"Return to ([\w']+) at the main hub", r"Head back to \1 at the hub"),
    (r"Return to the", "Go back to the"),
    (r"return to the", "go back to the"),
    (r"Return to", "Head back to"),
    (r"return to", "head back to"),

    (r"claim your quest rewards", "collect your mission rewards"),
    (r"quest rewards", "mission rewards"),
    (r"quest completion", "mission completion"),

    (r"The quest requires you to navigate", "This mission has you navigating"),
    (r"The quest requires you to", "This mission has you"),
    (r"the quest requires", "the mission requires"),

    (r"Breaching takes a short amount of time", "Hacking requires a brief moment"),
    (r"during which you are vulnerable", "leaving you exposed meanwhile"),
    (r"Be sure to watch your back", "Stay alert for threats behind you"),

    (r"Start by navigating to the", "Begin by heading to the"),
    (r"Start by heading to", "Begin by making your way to"),
    (r"Start by going to", "Begin by traveling to"),
    (r"Start by", "Begin by"),

    (r"Enter the building through the", "Go into the building via the"),
    (r"enter the building through", "go into the building via"),
    (r"Enter the building", "Go inside the building"),
    (r"enter the building", "go inside the building"),

    (r"on the Dam Battlegrounds map", "in the Dam Battlegrounds zone"),
    (r"the Dam Battlegrounds area", "the Dam Battlegrounds zone"),
    (r"Dam Battlegrounds", "Dam Battlegrounds"),

    (r"in the Buried City area", "within the Buried City zone"),
    (r"the Buried City map", "the Buried City zone"),
    (r"Buried City", "Buried City"),

    (r"on your map as a radar icon", "on your map as a signal marker"),
    (r"on your map initially", "on your map at first"),
    (r"on your map", "on your map"),
    (r"your active quests", "your current missions"),

    (r"Rewards for this quest include", "Completing this mission grants you"),
    (r"Rewards include", "You receive"),

    (r"It's identifiable by its distinct architecture", "You can recognize it by its unique design"),
    (r"It's identifiable by", "You can spot it by"),

    (r"The most direct route is often through", "The easiest path is usually through"),
    (r"The most direct route", "The quickest path"),

    (r"positioned close to the", "situated near the"),
    (r"positioned close to", "situated near"),
    (r"positioned near", "located near"),

    (r"upon searching", "after searching"),
    (r"Upon reaching the upper level", "When you get to the upper floor"),
    (r"Upon reaching", "When you arrive at"),

    (r"Take a right from", "Turn right from"),
    (r"take a right", "turn right"),
    (r"Take a left from", "Turn left from"),
    (r"take a left", "turn left"),
    (r"turning right as needed", "going right when necessary"),
    (r"turning left as needed", "going left when necessary"),

    (r"illuminated by natural light from the large windows", "lit by sunlight through the big windows"),
    (r"illuminated by", "lit by"),

    (r"You can find these", "These can be found"),
    (r"you can find", "you'll find"),
    (r"can be found in", "is located in"),
    (r"can be found at", "is situated at"),
    (r"can be found on", "is located on"),
    (r"can be found near", "is located near"),

    (r"Collecting the notes will trigger the quest completion", "Picking up the notes finishes the mission"),
    (r"Collecting the", "Grabbing the"),
    (r"collecting the", "grabbing the"),

    (r"A known location for", "One confirmed spot for"),
    (r"a known location for", "a confirmed spot for"),

    (r"Complete these objectives to earn", "Finish these tasks to receive"),
    (r"Complete the quest", "Finish the mission"),
    (r"complete the quest", "finish the mission"),

    (r"they will only appear once you are in close proximity", "they only show up when you get nearby"),
    (r"they will only appear", "they only show up"),

    (r"Approach and interact with", "Go up to and use"),
    (r"approach and interact", "walk up and engage"),

    (r"Travel to one of the identified", "Go to one of the marked"),
    (r"Travel to the", "Make your way to the"),
    (r"travel to the", "head to the"),
    (r"Travel to", "Head to"),

    (r"tall antenna-like structure", "antenna-shaped tower"),
    (r"look up at the sky", "check the sky above"),
    (r"hold the interact button", "press and hold the action button"),

    (r"This entrance will lead you into", "This way in takes you to"),
    (r"This entrance will lead", "This opening leads"),

    (r"The building is located in", "The structure sits in"),
    (r"the building is located", "the structure sits"),

    (r"from Celeste in the main hub", "from Celeste at the central hub"),
    (r"in the main hub", "at the central hub"),
    (r"the main hub", "the central hub"),

    (r"After successfully searching the probe", "Once you've examined the probe"),
    (r"After successfully", "Once you've successfully"),
    (r"after successfully", "once you've successfully"),

    (r"search the probe", "examine the probe"),
    (r"Search the", "Examine the"),
    (r"search the", "examine the"),

    (r"The notes are found on a desk next to an old computer setup", "You'll find the notes on a desk beside an old terminal"),
    (r"found on a desk", "located on a desk"),

    (r"All that's left is to", "The remaining step is to"),
    (r"all that's left is to", "the last thing to do is"),

    (r"Inside, you will find", "Within, you'll discover"),
    (r"Inside, look for", "Within, search for"),
    (r"Inside the", "Within the"),

    (r"At the top of the", "On the upper part of the"),
    (r"at the top of the", "at the upper part of the"),
    (r"at the top of", "at the highest point of"),

    (r"from the rooftop", "from up top"),
    (r"on the rooftop", "up on the roof"),

    (r"The final part of the", "The last segment of the"),
    (r"the final part", "the last segment"),
    (r"The final step", "The last step"),

    (r"Insert the battery into the", "Place the battery inside the"),
    (r"insert the battery", "place the battery"),

    (r"you are vulnerable", "you're exposed"),
    (r"Be aware that", "Keep in mind that"),
    (r"be aware that", "keep in mind that"),
    (r"Keep in mind", "Bear in mind"),
    (r"keep in mind", "bear in mind"),
    (r"Be careful", "Exercise caution"),
    (r"be careful", "exercise caution"),

    (r"will be displayed", "will appear"),
    (r"as shown here", "as pictured"),
    (r"as shown below", "as pictured below"),
    (r"as shown in the", "as visible in the"),

    (r"In one round:", "Within a single run:"),
    (r"in one round", "within a single run"),

    (r"After completing", "Once you finish"),
    (r"after completing", "once you finish"),

    (r"Looting the supply drop will complete", "Picking up the supply drop finishes"),
    (r"looting the", "collecting the"),
    (r"Looting the", "Collecting the"),
    (r"loot its contents", "grab what's inside"),
    (r"loot the", "grab the"),
    (r"Loot the", "Grab the"),

    (r"The video highlights that", "As noted,"),
    (r"the video highlights", "it's worth noting"),

    (r"various locations, such as", "several spots, like"),
    (r"various locations", "different spots"),

    (r"typically marked in designated zones", "usually placed in specific areas"),
    (r"typically marked", "usually indicated"),

    (r"will then initiate", "then triggers"),
    (r"initiate a request", "send a request"),

    (r"watch to see where it lands", "keep an eye on where it drops"),
    (r"Note that the", "Be aware that the"),
    (r"note that the", "be aware that the"),

    (r"Rear plate, joints", "Back panel, joints"),

    (r"supply drop", "resource drop"),
    (r"Supply Call Station", "Supply Beacon"),

    (r"is a massive,", "is a hulking,"),
    (r"an armored ARC", "an armored machine"),

    # ── Connector phrases ──
    (r"proceed down the hallway", "continue down the corridor"),
    (r"proceed down", "move down"),
    (r"proceed through", "go through"),
    (r"detailing how to find", "explaining how to locate"),
    (r"detailing how to", "explaining how to"),
    (r"detailing the", "outlining the"),
]

# ── Word-level synonyms (applied after phrase-level) ──
WORD_MAP = [
    (r'\blocate\b', 'find'),
    (r'\bLocate\b', 'Find'),
    (r'\bapproach\b', 'move toward'),
    (r'\bApproach\b', 'Move toward'),
    (r'\bproceed\b', 'continue'),
    (r'\bProceed\b', 'Continue'),
    (r'\bcommence\b', 'start'),
    (r'\bCommence\b', 'Start'),
    (r'\butilize\b', 'use'),
    (r'\bUtilize\b', 'Use'),
    (r'\bobtain\b', 'get'),
    (r'\bObtain\b', 'Get'),
    (r'\bacquire\b', 'get'),
    (r'\bAcquire\b', 'Get'),
    (r'\bpurchase\b', 'buy'),
    (r'\bPurchase\b', 'Buy'),
    (r'\bidentifiable\b', 'recognizable'),
    (r'\bidentify\b', 'recognize'),
    (r'\bpinpointing\b', 'spotting'),
    (r'\bpinpoint\b', 'spot'),
    (r'\badjacent to\b', 'next to'),
    (r'\bAdjacent to\b', 'Next to'),
    (r'\bnumerous\b', 'many'),
    (r'\bsufficient\b', 'enough'),
    (r'\badditionally\b', 'also'),
    (r'\bAdditionally\b', 'Also'),
    (r'\bfurthermore\b', 'also'),
    (r'\bFurthermore\b', 'Also'),
    (r'\bmoreover\b', 'also'),
    (r'\bMoreover\b', 'Also'),
    (r'\bhowever\b', 'though'),
    (r'\bHowever\b', 'Though'),
    (r'\btherefore\b', 'so'),
    (r'\bTherefore\b', 'So'),
    (r'\bcurrently\b', 'right now'),
    (r'\bCurrently\b', 'Right now'),
    (r'\bensure\b', 'make sure'),
    (r'\bEnsure\b', 'Make sure'),
    (r'\bascend\b', 'climb'),
    (r'\bAscend\b', 'Climb'),
    (r'\bdescend\b', 'go down'),
    (r'\bDescend\b', 'Go down'),
    (r'\bcommence\b', 'begin'),
    (r'\bterminate\b', 'end'),
    (r'\bprior to\b', 'before'),
    (r'\bPrior to\b', 'Before'),
    (r'\bsubsequently\b', 'then'),
    (r'\bSubsequently\b', 'Then'),
    (r'\bin order to\b', 'to'),
    (r'\bIn order to\b', 'To'),
    (r'\bdue to the fact\b', 'because'),
    (r'\bat this point\b', 'now'),
    (r'\bin close proximity\b', 'nearby'),
    (r'\bclose proximity\b', 'close range'),
    (r'\bvulnerable\b', 'exposed'),
    (r'\binitially\b', 'at first'),
    (r'\bInitially\b', 'At first'),
    (r'\btypically\b', 'usually'),
    (r'\bTypically\b', 'Usually'),
    (r'\bimmediately\b', 'right away'),
    (r'\bImmediately\b', 'Right away'),
    (r'\bsimply\b', 'just'),
    (r'\bSimply\b', 'Just'),
    (r'\bspecifically\b', 'in particular'),
    (r'\bspecific\b', 'particular'),
    (r'\bprimarily\b', 'mainly'),
    (r'\bPrimarily\b', 'Mainly'),
    (r'\bnecessary\b', 'needed'),
    (r'\bNecessary\b', 'Needed'),
    (r'\bvaluable\b', 'useful'),
    (r'\bValuable\b', 'Useful'),
    (r'\bthis is the\b', "here's the"),
    (r'\bdevastating\b', 'destructive'),
    (r'\bobliterate\b', 'destroy'),
]


def paraphrase_text(text: str) -> str:
    """Apply phrase-level then word-level paraphrasing to plain text."""
    if not text or len(text.strip()) < 3:
        return text

    result = text

    # Apply phrase-level replacements
    for pattern, replacement in PHRASE_MAP:
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE if pattern[0].islower() else 0)

    # Apply word-level synonyms
    for pattern, replacement in WORD_MAP:
        result = re.sub(pattern, replacement, result)

    return result


def paraphrase_html(html: str) -> str:
    """Paraphrase text within HTML while preserving tags and structure."""
    if not html:
        return html

    # Split HTML into tags and text segments
    # This regex splits on HTML tags, keeping them as separators
    parts = re.split(r'(<[^>]+>)', html)

    result = []
    for part in parts:
        if part.startswith('<'):
            # HTML tag - preserve but handle alt attributes
            part = re.sub(
                r'(alt=")([^"]+)(")',
                lambda m: m.group(1) + paraphrase_text(m.group(2)) + m.group(3),
                part
            )
            result.append(part)
        else:
            # Text node - paraphrase
            result.append(paraphrase_text(part))

    return ''.join(result)


def main():
    with open(SRC) as f:
        guides = json.load(f)

    total_url_replacements = 0
    total_text_changes = 0

    for i, guide in enumerate(guides):
        original = json.dumps(guide)

        # 1. URL replacement in ALL string fields
        raw = json.dumps(guide)
        count = raw.count(SUPABASE_BASE)
        raw = raw.replace(SUPABASE_BASE, METAFORGE_BASE)
        total_url_replacements += count
        guide = json.loads(raw)

        # 2. Paraphrase summary
        if guide.get('summary') and len(guide['summary']) > 10:
            guide['summary'] = paraphrase_text(guide['summary'])

        # 3. Paraphrase HTML content
        if guide.get('content'):
            guide['content'] = paraphrase_html(guide['content'])

        # 4. Change author from external sources
        if guide.get('author') == 'All4nDev':
            guide['author'] = 'ARC Companion Team'
        elif guide.get('author') == 'The Gaming Merchant':
            guide['author'] = 'ARC Companion Team'
        elif guide.get('author'):
            guide['author'] = 'ARC Companion Team'

        guides[i] = guide

        modified = json.dumps(guide)
        if modified != original:
            total_text_changes += 1

    # Write output
    with open(OUT, 'w') as f:
        json.dump(guides, f, indent=2, ensure_ascii=False)

    print(f'URL replacements: {total_url_replacements}')
    print(f'Guides with text changes: {total_text_changes}/{len(guides)}')

    # Verify no Supabase URLs remain
    with open(OUT) as f:
        content = f.read()
    remaining = content.count('supabase.co')
    print(f'Remaining supabase URLs: {remaining}')
    remaining_mf = content.count('cdn.metaforge.app')
    print(f'Metaforge CDN URLs: {remaining_mf}')


if __name__ == '__main__':
    main()
