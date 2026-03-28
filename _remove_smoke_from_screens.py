#!/usr/bin/env python3
"""Remove <SmokeBackground /> from all screens and make backgrounds transparent.

Each screen used to render its own Skia shader canvas, causing:
- Multiple GPU-heavy shader instances running simultaneously
- Lag after navigating several screens
- Inconsistent rendering (some screens wouldn't show the smoke)

Now there's ONE SmokeBackground at the root navigator level.
Each screen just needs a transparent background to let it show through.
"""
import re
import os

SCREENS_DIR = "src/screens"

files = [f for f in os.listdir(SCREENS_DIR) if f.endswith('.tsx')]
changed = 0

for fname in sorted(files):
    path = os.path.join(SCREENS_DIR, fname)
    with open(path, 'r') as f:
        original = f.read()

    content = original

    # 1. Remove the SmokeBackground import line
    content = re.sub(
        r"import SmokeBackground from '[^']*';\n",
        '',
        content
    )

    # 2. Remove <SmokeBackground /> JSX usage (with optional surrounding whitespace)
    content = re.sub(
        r'\s*<SmokeBackground\s*/>\n',
        '\n',
        content
    )

    # 3. Change backgroundColor: colors.bg -> 'transparent' in container/root styles
    # Handle single-line styles like: container: {flex: 1, backgroundColor: colors.bg},
    content = re.sub(
        r"((?:container|root)\s*:\s*\{[^}]*?)backgroundColor:\s*colors\.bg",
        r"\1backgroundColor: 'transparent'",
        content
    )

    # Handle multi-line container styles
    content = re.sub(
        r"((?:container|root)\s*:\s*\{[^}]*?)backgroundColor:\s*colors\.bg",
        r"\1backgroundColor: 'transparent'",
        content,
        flags=re.DOTALL
    )

    # Handle hardcoded #060A11 (SkillTreeScreen)
    content = re.sub(
        r"(container\s*:\s*\{[^}]*?)backgroundColor:\s*'#060A11'",
        r"\1backgroundColor: 'transparent'",
        content
    )

    # Handle: container: { flex: 1, backgroundColor: colors.bg },  (with spaces around)
    content = re.sub(
        r"(container\s*:\s*\{[^}]*?)backgroundColor:\s*colors\.bg",
        r"\1backgroundColor: 'transparent'",
        content
    )

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        changed += 1
        print(f"  Updated: {fname}")
    else:
        # Check if it had SmokeBackground at all
        if 'SmokeBackground' in original:
            print(f"  WARNING: {fname} still has SmokeBackground references!")
        else:
            print(f"  Skipped: {fname} (no SmokeBackground)")

print(f"\nTotal updated: {changed}/{len(files)}")
