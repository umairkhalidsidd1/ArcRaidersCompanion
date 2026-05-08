const stripPeriod = (value: string): string => value.replace(/[.。]+$/u, '').trim();

const sentence = (value: string): string => {
  const clean = stripPeriod(value.replace(/\s+/g, ' '));
  if (!clean) return clean;
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}.`;
};

const lowerLead = (value: string): string => {
  const clean = stripPeriod(value);
  return clean ? `${clean.charAt(0).toLowerCase()}${clean.slice(1)}` : clean;
};

const objectivePrefixByLocale: Record<string, string> = {
  zh: '行动中',
  fr: 'Sur le terrain',
  de: 'Im Einsatz',
  es: 'En la incursión',
  it: "Durante l'incursione",
  ja: '出撃中',
  ko: '작전 중',
  pl: 'W trakcie wypadu',
  'pt-BR': 'Na incursão',
  ru: 'В рейде',
  'zh-TW': '行動中',
  tr: 'Baskında',
};

const normalizeLocale = (language?: string): string => {
  if (!language) return '';
  if (language.toLowerCase().startsWith('pt')) return 'pt-BR';
  if (language.toLowerCase().startsWith('zh-tw')) return 'zh-TW';
  return language.split('-')[0];
};

const rewriteCore = (objective: string): string => {
  const clean = stripPeriod(objective.replace(/\s+/g, ' '));
  let match: RegExpMatchArray | null;

  if (/^visit any area on your map with a loot category icon$/i.test(clean)) {
    return 'Head to any map area marked with a loot-category icon';
  }

  match = clean.match(/^Loot (\d+) containers?$/i);
  if (match) return `Open and loot ${match[1]} containers`;

  match = clean.match(/^Destroy (\d+) ARC enemies using any explosive grenade$/i);
  if (match) return `Eliminate ${match[1]} ARC enemies with an explosive grenade`;

  match = clean.match(/^Destroy any ARC using (.+)$/i);
  if (match) return `Eliminate any ARC with ${match[1]}`;

  match = clean.match(/^Destroy (a|an) (.+) with (.+)$/i);
  if (match) return `Take down ${match[1]} ${match[2]} using ${match[3]}`;

  match = clean.match(/^Destroy (\d+) ARC enemies$/i);
  if (match) return `Take down ${match[1]} ARC enemies`;

  match = clean.match(/^Destroy (a|an) (.+)$/i);
  if (match) return `Take down ${match[1]} ${match[2]}`;

  match = clean.match(/^Get (.+) for (.+)$/i);
  if (match) return `Bring ${match[2]} ${match[1]}`;

  match = clean.match(/^Obtain (.+)$/i);
  if (match) return `Secure ${match[1]}`;

  match = clean.match(/^Request in (.+) from (.+)$/i);
  if (match) return `Call in ${match[1]} from ${match[2]}`;

  match = clean.match(/^Loot (.+)$/i);
  if (match) return `Collect loot from ${match[1]}`;

  match = clean.match(/^Repair (.+)$/i);
  if (match) return `Fix ${match[1]}`;

  match = clean.match(/^Find and search (.+)$/i);
  if (match) return `Locate and search ${match[1]}`;

  match = clean.match(/^Find and turn (.+)$/i);
  if (match) return `Locate and turn ${match[1]}`;

  match = clean.match(/^Find and unlock (.+)$/i);
  if (match) return `Locate and unlock ${match[1]}`;

  match = clean.match(/^Find and monitor (.+)$/i);
  if (match) return `Locate and monitor ${match[1]}`;

  match = clean.match(/^Find (.+)$/i);
  if (match) return `Track down ${match[1]}`;

  match = clean.match(/^Search (\d+) containers? in (.+)$/i);
  if (match) return `Search ${match[1]} containers inside ${match[2]}`;

  match = clean.match(/^Search for (.+)$/i);
  if (match) return `Look for ${match[1]}`;

  match = clean.match(/^Search any (.+)$/i);
  if (match) return `Check any ${match[1]}`;

  match = clean.match(/^Search the (.+)$/i);
  if (match) return `Check the ${match[1]}`;

  match = clean.match(/^Search (.+)$/i);
  if (match) return `Search through ${match[1]}`;

  match = clean.match(/^Deliver (.+) to (.+)$/i);
  if (match) return `Hand ${match[1]} to ${match[2]}`;

  match = clean.match(/^Deliver (.+) for (.+)$/i);
  if (match) return `Hand ${match[1]} to ${match[2]}`;

  match = clean.match(/^Gather (.+)$/i);
  if (match) return `Collect ${match[1]}`;

  match = clean.match(/^Bring (.+) to (.+)$/i);
  if (match) return `Deliver ${match[1]} to ${match[2]}`;

  if (/^Collect the reward$/i.test(clean)) return 'Claim the reward';

  match = clean.match(/^Reach (.+)$/i);
  if (match) return `Make your way to ${match[1]}`;

  match = clean.match(/^Head to where (.+)$/i);
  if (match) return `Move to the spot where ${match[1]}`;

  match = clean.match(/^Head to (.+)$/i);
  if (match) return `Move to ${match[1]}`;

  match = clean.match(/^Go to (.+)$/i);
  if (match) return `Head to ${match[1]}`;

  match = clean.match(/^Locate and upload (.+) to (.+)$/i);
  if (match) return `Locate ${match[1]} and upload it to ${match[2]}`;

  match = clean.match(/^Locate (.+)$/i);
  if (match) return `Track down ${match[1]}`;

  match = clean.match(/^Access (.+)$/i);
  if (match) return `Open ${match[1]}`;

  match = clean.match(/^Upload (.+)$/i);
  if (match) return `Send ${match[1]}`;

  match = clean.match(/^Transmit (.+)$/i);
  if (match) return `Broadcast ${match[1]}`;

  match = clean.match(/^Install (.+)$/i);
  if (match) return `Set up ${match[1]}`;

  if (/^Restore the power$/i.test(clean)) return 'Bring the power back online';

  match = clean.match(/^Enable (.+)$/i);
  if (match) return `Switch on ${match[1]}`;

  match = clean.match(/^Disable (.+)$/i);
  if (match) return `Shut off ${match[1]}`;

  match = clean.match(/^Shut down (.+)$/i);
  if (match) return `Power down ${match[1]}`;

  match = clean.match(/^Follow (.+)$/i);
  if (match) return `Track ${match[1]}`;

  match = clean.match(/^Inspect (.+)$/i);
  if (match) return `Examine ${match[1]}`;

  match = clean.match(/^Investigate (.+)$/i);
  if (match) return `Check ${match[1]}`;

  match = clean.match(/^Interact with (.+)$/i);
  if (match) return `Use ${match[1]}`;

  match = clean.match(/^Document (.+)$/i);
  if (match) return `Record evidence of ${match[1]}`;

  match = clean.match(/^Use (.+)$/i);
  if (match) return `Use ${match[1]}`;

  match = clean.match(/^Visit any (.+)$/i);
  if (match) return `Check one ${match[1]}`;

  match = clean.match(/^Visit (.+)$/i);
  if (match) return `Go to ${match[1]}`;

  match = clean.match(/^Enter (.+)$/i);
  if (match) return `Get inside ${match[1]}`;

  match = clean.match(/^Photograph (.+)$/i);
  if (match) return `Take a photo of ${match[1]}`;

  match = clean.match(/^Take a Photo of (.+)$/i);
  if (match) return `Photograph ${match[1]}`;

  match = clean.match(/^Take a photo of (.+)$/i);
  if (match) return `Photograph ${match[1]}`;

  match = clean.match(/^Nail down (.+)$/i);
  if (match) return `Secure ${match[1]}`;

  match = clean.match(/^Stabilize (.+)$/i);
  if (match) return `Reinforce ${match[1]}`;

  match = clean.match(/^Rotate (.+)$/i);
  if (match) return `Adjust ${match[1]}`;

  match = clean.match(/^Boot (.+)$/i);
  if (match) return `Start ${match[1]}`;

  match = clean.match(/^Sabotage (.+)$/i);
  if (match) return `Disable ${match[1]}`;

  match = clean.match(/^Rewire (.+)$/i);
  if (match) return `Reconnect ${match[1]}`;

  match = clean.match(/^Plant a bug on (.+)$/i);
  if (match) return `Place a tracker on ${match[1]}`;

  match = clean.match(/^Hoist (.+)$/i);
  if (match) return `Raise ${match[1]}`;

  match = clean.match(/^Retrieve (.+)$/i);
  if (match) return `Recover ${match[1]}`;

  match = clean.match(/^Return (.+)$/i);
  if (match) return `Bring back ${match[1]}`;

  match = clean.match(/^Return to (.+)$/i);
  if (match) return `Go back to ${match[1]}`;

  match = clean.match(/^Scope out (.+)$/i);
  if (match) return `Scout ${match[1]}`;

  match = clean.match(/^Deploy into (.+)$/i);
  if (match) return `Enter ${match[1]}`;

  match = clean.match(/^Secure the area for (.+)$/i);
  if (match) return `Make the area safe for ${match[1]}`;

  match = clean.match(/^Scout the area around (.+)$/i);
  if (match) return `Survey the area around ${match[1]}`;

  match = clean.match(/^Report findings to (.+)$/i);
  if (match) return `Give your findings to ${match[1]}`;

  match = clean.match(/^Help (.+) secure (.+)$/i);
  if (match) return `Assist ${match[1]} with securing ${match[2]}`;

  return `Complete this objective: ${clean}`;
};

export const paraphraseQuestObjective = (objective: string, language?: string): string => {
  const clean = stripPeriod(String(objective || '').replace(/\s+/g, ' '));
  const locale = normalizeLocale(language);

  if (locale && locale !== 'en') {
    const prefix = objectivePrefixByLocale[locale] || 'Objective';
    const objectiveText = /^[\x00-\x7F]+$/.test(clean)
      ? sentence(rewriteCore(clean)).replace(/[.]+$/, '')
      : clean;
    return `${prefix}: ${objectiveText}.`;
  }

  let match: RegExpMatchArray | null;

  match = clean.match(/^In One Round:\s*(.+)$/i);
  if (match) return sentence(`Complete in one round: ${lowerLead(rewriteCore(match[1]))}`);

  match = clean.match(/^On ([^,]+),\s*(.+)$/i);
  if (match) return sentence(`While on ${match[1]}, ${lowerLead(rewriteCore(match[2]))}`);

  return sentence(rewriteCore(clean));
};

export const paraphraseQuestObjectives = (objectives: string[], language?: string): string[] =>
  objectives.map(objective => paraphraseQuestObjective(objective, language));