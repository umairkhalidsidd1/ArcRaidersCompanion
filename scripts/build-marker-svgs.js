/* eslint-disable */
const fs = require('fs');
const path = require('path');

const SRC = '/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/assets/icons/markers';
const DST = '/Users/umairkhalid/Desktop/ArcRaidersCompanion/src/data/markerSvgs.json';

const files = fs.readdirSync(SRC).filter(f => f.endsWith('.svg'));
const out = {};

for (const file of files) {
  const key = file.replace(/\.svg$/, '');
  let content = fs.readFileSync(path.join(SRC, file), 'utf8');

  // Strip the dark backgrounds so the wrapper's category color shows through.
  // The "shield" variants (158x240) and the "square" variants (158x158)
  // use slightly different background paths (and varying letter cases).
  content = content.replace(
    /<path[^>]*d="M158 158H0V0H158V158Z"[^>]*\/>/g,
    '',
  );
  content = content.replace(
    /<path[^>]*d="M83\.0771 240L0 158V0[Hh]158[Vv]158[Ll]?[- ]?74\.9229 82[Zz]"[^>]*\/>/g,
    '',
  );
  content = content.replace(
    /<path[^>]*d="M83\.0771 240L0 158V0[Hh]158[Vv]158L83\.0771 240[Zz]"[^>]*\/>/g,
    '',
  );

  // Strip the red square outline rect — we replace it with the wrapper bg.
  content = content.replace(
    /<rect[^>]*x="18"[^>]*y="1[35]"[^>]*width="124"[^>]*height="124"[^>]*\/>/g,
    '',
  );

  // Replace any remaining red usage (icon accents) with currentColor so
  // the wrapper's `color` CSS theme paints them.
  content = content.replace(/#FF0000/g, 'currentColor');
  content = content.replace(/#F00/g, 'currentColor');

  // Compress whitespace
  content = content.replace(/>\s+</g, '><').trim();
  content = content.replace(/\s+/g, ' ');

  out[key] = content;
}

// Aliases — make sure the FILTER_CATEGORIES keys (used in lookup) all resolve
// to a real SVG, even when the file on disk has a slightly different name.
const ALIASES = [
  ['crash-pobe', 'crashed-probe'],
  ['great-mullein', 'great-mullen'],
];
for (const [src, dst] of ALIASES) {
  if (out[src] && !out[dst]) out[dst] = out[src];
  if (out[dst] && !out[src]) out[src] = out[dst];
}

fs.writeFileSync(DST, JSON.stringify(out));
console.log('Wrote', Object.keys(out).length, 'icons to', DST);
console.log('Total size:', (fs.statSync(DST).size / 1024).toFixed(1), 'KB');
