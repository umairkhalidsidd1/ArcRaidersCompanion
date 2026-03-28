#!/usr/bin/env python3
"""Restore SmokeBackground in all screens.

Adds import, <SmokeBackground /> JSX, and reverts backgroundColor to colors.bg.
The component now only mounts the Canvas on the focused screen,
so having it in every screen is safe — only 1 GPU shader runs at a time.
"""
import re
import os

SCREENS_DIR = "src/screens"
IMPORT_LINE = "import SmokeBackground from '../components/SmokeBackground';\n"

files = [f for f in os.listdir(SCREENS_DIR) if f.endswith('.tsx')]
changed = 0

for fname in sorted(files):
    path = os.path.join(SCREENS_DIR, fname)
    with open(path, 'r') as f:
        content = f.read()
    original = content

    # Skip if already has SmokeBackground
    if 'SmokeBackground' in content:
        print(f"  Skip (already has): {fname}")
        continue

    # Skip _TierListScreen_v4 (unused file)
    if fname.startswith('_'):
        print(f"  Skip (prefixed): {fname}")
        continue

    # 1. Add import after last existing import line
    # Find the last import line
    import_matches = list(re.finditer(r"^import .+;\n", content, re.MULTILINE))
    if not import_matches:
        print(f"  Skip (no imports): {fname}")
        continue

    last_import = import_matches[-1]
    insert_pos = last_import.end()
    content = content[:insert_pos] + IMPORT_LINE + content[insert_pos:]

    # 2. Add <SmokeBackground /> after the opening container View
    # Patterns to match:
    #   <View style={[styles.container, {paddingTop: insets.top}]}>
    #   <View style={[styles.container, { paddingTop: insets.top }]}>
    #   <View style={styles.container}>
    #   <View style={[s.root, {paddingTop: insets.top}]}>
    #   <View style={[s.root, {paddingTop: ins.top}]}>
    #   <View style={[st.root, {paddingTop: insets.top}]}>
    smoke_patterns = [
        # Patterns with paddingTop
        (r"(<View style=\{(?:\[(?:styles\.container|s\.root|st\.root)[^\]]*\]|styles\.container)\}>\n)",
         r"\1      <SmokeBackground />\n"),
    ]

    added_jsx = False
    for pattern, replacement in smoke_patterns:
        new_content = re.sub(pattern, replacement, content, count=1)
        if new_content != content:
            content = new_content
            added_jsx = True
            break

    if not added_jsx:
        print(f"  WARNING: Could not add JSX: {fname}")
        continue

    # 3. Change backgroundColor from 'transparent' back to colors.bg
    # Handle: backgroundColor: 'transparent'
    content = re.sub(
        r"((?:container|root)\s*:\s*\{[^}]*?)backgroundColor:\s*'transparent'",
        r"\1backgroundColor: colors.bg",
        content
    )

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        changed += 1
        print(f"  Restored: {fname}")
    else:
        print(f"  No change: {fname}")

print(f"\nTotal restored: {changed}/{len(files)}")
