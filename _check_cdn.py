import urllib.request
import json
import sys

# arcs.json icons to check on Metaforge CDN
# Pattern: Supabase has /images/arc-raiders/icons/{id}.webp
# Metaforge might have /arc-raiders/icons/{id}.webp
arcs_supabase_icons = {
    "bastion": "bastion.webp",
    "bombardier": "bombardier.webp",
    "fireball": "fireball.webp",
    "hornet": "hornet.webp",
    "bison": "bison.webp",  # Leaper
    "queen": "queen.webp",
    "rocketeer": "rocketeer.webp",
    "sentinel": "sentinel.webp",
    "snitch": "snitch.webp",
    "rollbot": "rollbot.webp",  # Surveyor
    "tick": "tick.webp",
    "turret": "turret.webp",
    "wasp": "wasp.webp",
}

# arcs.json images (larger images)
arcs_supabase_images = {
    "bastion": "bastion.webp",
    "hornet": "hornet.webp",
    "bison": "bison.webp",
    "queen": "queen_image.jpg",
    "rocketeer": "rocketeer.webp",
    "sentinel": "sentinel.webp",
    "snitch": "snitch.webp",
    "rollbot": "rollbot.webp",
    "tick": "tick.webp",
    "turret": "turret.webp",
    "wasp": "wasp.webp",
}

# Blueprint icon filenames from Supabase
bp_icons = [
    "angled-grip-ii-recipe.webp", "angled-grip-iii-recipe.webp", "anvil-recipe.webp",
    "anvil-splitter-recipe.webp", "aphelion-rifle-blueprint.webp", "arc-circuitry-recipe.webp",
    "barricade-kit-recipe.webp", "bettina-blueprint.webp", "blaze-grenade-blueprint.webp",
    "blue-light-stick-blueprint.webp", "bobcat-i-recipe.webp", "burltetta-recipe.webp",
    "combat-mk-3-flanking.webp", "combat-mk3-aggressive-blueprint.webp",
    "compensator-ii-recipe.webp", "compensator-iii-recipe.webp", "complex-gun-parts-blueprint.webp",
    "deadline-blueprint.webp", "defibrillator-recipe.webp", "door-blocker-recipe.webp",
    "energy-ammo-recipe.webp", "equalizer-recipe.webp", "explosive-mine-blueprint.webp",
    "extended-barrel-recipe.webp", "extended-light-mag-ii-recipe.webp",
    "extended-light-mag-iii-recipe.webp", "extended-medium-mag-ii-recipe.webp",
    "extended-medium-mag-iii-blueprint.webp", "extended-shotgun-mag-ii-recipe.webp",
    "extended-shotgun-mag-iii-recipe.webp", "fireworks-box-blueprint.webp",
    "gas-mine-blueprint.webp", "green-light-stick-blueprint.webp",
    "heavy-fuse-grenade-recipe.webp", "heavy-gun-parts-recipe.webp",
    "horizontal-grip-blueprint.webp", "hullcracker-blueprint.webp", "il-toro-recipe.webp",
    "jolt-mine-recipe.webp", "jupiter-i-recipe.webp", "kinetic-converter-recipe.webp",
    "laser-trap-fire-recipe.webp", "laser-trap-gas-recipe.webp",
    "launcher-ammo-blueprint.webp", "light-gun-parts-recipe.webp",
    "lightweight-stock-recipe.webp", "looting-mk-3-safekeeper-blueprint.webp",
    "looting-mk-3-survivor-blueprint.webp", "lure-grenade-recipe.webp",
    "medium-gun-parts-recipe.webp", "mod-components-recipe.webp",
    "muzzle-brake-ii-recipe.webp", "muzzle-brake-iii-recipe.webp",
    "osprey-recipe.webp", "padded-stock-recipe.webp", "power-rod-recipe.webp",
    "pulse-mine-blueprint.webp", "red-light-stick-blueprint.webp",
    "remote-raider-flare-blueprint.webp", "renegade-recipe.webp",
    "seeker-grenade-blueprint.webp", "shotgun-choke-ii-recipe.webp",
    "shotgun-choke-iii-recipe.webp", "shotgun-parts-recipe.webp",
    "shotgun-silencer-blueprint.webp", "showstopper-blueprint.webp",
    "silencer-i-recipe.webp", "silencer-ii-recipe.webp", "silencer-iii-recipe.webp",
    "smoke-grenade-blueprint.webp", "snap-hook-recipe.webp",
    "stable-stock-ii-recipe.webp", "stable-stock-iii-recipe.webp",
    "sterilized-bandage-recipe.webp", "tactical-mk-3-revival-blueprint.webp",
    "tactical-mk3-defensive-blueprint.webp", "tacical-mk3-healing-blueprint.webp",
    "tagging-grenade-recipe.webp", "tempest-i-recipe.webp", "torrent-i-recipe.webp",
    "trailblazer-grenade-blueprint.webp", "trigger-nade-recipe.webp",
    "venator-recipe.webp", "vertical-grip-ii-recipe.webp", "vertical-grip-iii-recipe.webp",
    "vita-shot-recipe.webp", "vita-spray-recipe.webp", "vulcano-blueprint.webp",
    "wolfpack-recipe.webp", "yellow-light-stick-blueprint.webp",
]

def check_url(url):
    try:
        req = urllib.request.Request(url, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0')
        resp = urllib.request.urlopen(req, timeout=5)
        return resp.status == 200
    except Exception:
        return False

print("=" * 60)
print("ARCS.JSON - ICON CHECK (Metaforge CDN)")
print("=" * 60)
found_icons = 0
missing_icons = []
for name, filename in arcs_supabase_icons.items():
    url = f"https://cdn.metaforge.app/arc-raiders/icons/{filename}"
    exists = check_url(url)
    status = "FOUND" if exists else "MISSING"
    if exists:
        found_icons += 1
    else:
        missing_icons.append(name)
    print(f"  {name}: {status} -> {url}")
print(f"\nIcons: {found_icons}/{len(arcs_supabase_icons)} found on Metaforge CDN")
if missing_icons:
    print(f"Missing: {', '.join(missing_icons)}")

print()
print("=" * 60)
print("ARCS.JSON - IMAGE CHECK (Metaforge CDN)")
print("=" * 60)
found_images = 0
missing_images = []
for name, filename in arcs_supabase_images.items():
    url = f"https://cdn.metaforge.app/arc-raiders/images/{filename}"
    exists = check_url(url)
    status = "FOUND" if exists else "MISSING"
    if exists:
        found_images += 1
    else:
        missing_images.append(name)
    print(f"  {name}: {status} -> {url}")
print(f"\nImages: {found_images}/{len(arcs_supabase_images)} found on Metaforge CDN")
if missing_images:
    print(f"Missing: {', '.join(missing_images)}")

print()
print("=" * 60)
print("BLUEPRINTS.JSON - ICON CHECK (Metaforge CDN)")
print("=" * 60)
found_bp = 0
missing_bp = []
for filename in bp_icons:
    url = f"https://cdn.metaforge.app/arc-raiders/icons/{filename}"
    exists = check_url(url)
    status = "FOUND" if exists else "MISSING"
    if exists:
        found_bp += 1
    else:
        missing_bp.append(filename)
    print(f"  {filename}: {status}")
print(f"\nBlueprints: {found_bp}/{len(bp_icons)} found on Metaforge CDN")
if missing_bp:
    print(f"\nMissing blueprint icons ({len(missing_bp)}):")
    for m in missing_bp:
        print(f"  {m}")

# Also check items.json Supabase URLs - extract unique filenames
print()
print("=" * 60)
print("ITEMS.JSON - SUPABASE ICON CHECK (Metaforge CDN)")
print("=" * 60)
with open('src/data/items.json') as f:
    items = json.load(f)
sb_items = []
for item in items:
    icon = item.get('icon', '')
    if icon and 'iiugcpaznnwcegwificd.supabase.co' in icon:
        filename = icon.split('/')[-1]
        sb_items.append((item['name'], filename))

found_items = 0
missing_items_list = []
for name, filename in sb_items:
    url = f"https://cdn.metaforge.app/arc-raiders/icons/{filename}"
    exists = check_url(url)
    status = "FOUND" if exists else "MISSING"
    if exists:
        found_items += 1
    else:
        missing_items_list.append((name, filename))
    print(f"  {name} ({filename}): {status}")
print(f"\nItems with Supabase URLs: {found_items}/{len(sb_items)} found on Metaforge CDN")
if missing_items_list:
    print(f"\nMissing item icons ({len(missing_items_list)}):")
    for name, fn in missing_items_list:
        print(f"  {name}: {fn}")
