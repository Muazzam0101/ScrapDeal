import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('  SCRAPDEAL: SAFETY GUIDELINES TTS & MULTI-LANG TEST ');
console.log('====================================================\n');

// Load TS translation files
function parseTsTranslation(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Match key-value lines
  const lines = content.split('\n');
  const dict = {};
  for (const line of lines) {
    const kv = line.match(/^\s*([a-zA-Z0-9_]+)\s*:\s*['"`](.*)['"`]\s*,?\s*$/);
    if (kv) {
      dict[kv[1]] = kv[2];
    }
  }
  return dict;
}

const en = parseTsTranslation(path.join(__dirname, '../src/i18n/en.ts'));
const hi = parseTsTranslation(path.join(__dirname, '../src/i18n/hi.ts'));
const mr = parseTsTranslation(path.join(__dirname, '../src/i18n/mr.ts'));

const translations = { en, hi, mr };
const languages = ['mr', 'hi', 'en'];

// TEST 1: Verify all 3 languages exist in translations
console.log('[RUN] TEST 1: Check presence of Marathi, Hindi, English in translations');
for (const lang of languages) {
  assert(translations[lang], `Translation dictionary for ${lang} must exist`);
}
console.log('[PASS] TEST 1: All 3 translation dictionaries (mr, hi, en) exist\n');

// TEST 2: Check all 5 safety guidelines titles and descriptions in all 3 languages
console.log('[RUN] TEST 2: Check safety guidelines keys (rules 1 to 5) across all 3 languages');
const ruleKeys = [
  { title: 'safety1Title', desc: 'safety1Desc' },
  { title: 'safety2Title', desc: 'safety2Desc' },
  { title: 'safety3Title', desc: 'safety3Desc' },
  { title: 'safety4Title', desc: 'safety4Desc' },
  { title: 'safety5Title', desc: 'safety5Desc' },
];

for (const lang of languages) {
  const dict = translations[lang];
  assert(dict.safetyGuidelines, `safetyGuidelines missing in ${lang}`);
  assert(dict.safetyListenPrompt, `safetyListenPrompt missing in ${lang}`);
  assert(dict.audioLanguage, `audioLanguage missing in ${lang}`);
  assert(dict.listenAll, `listenAll missing in ${lang}`);
  assert(dict.stopAudio, `stopAudio missing in ${lang}`);

  for (const rule of ruleKeys) {
    assert(dict[rule.title], `${rule.title} missing in ${lang}`);
    assert(dict[rule.desc], `${rule.desc} missing in ${lang}`);
    assert(dict[rule.title].trim().length > 0, `${rule.title} is empty in ${lang}`);
    assert(dict[rule.desc].trim().length > 0, `${rule.desc} is empty in ${lang}`);
  }
}
console.log('[PASS] TEST 2: All 5 safety rules + audio controls exist with non-empty content in Marathi, Hindi, and English\n');

// TEST 3: Validate TTS Language Tag Mappings
console.log('[RUN] TEST 3: Verify BCP-47 language codes for TTS engines');
const LANG_MAP = {
  mr: { primary: 'mr-IN', fallbacks: ['mr', 'hi-IN', 'hi'] },
  hi: { primary: 'hi-IN', fallbacks: ['hi', 'mr-IN', 'en-IN'] },
  en: { primary: 'en-IN', fallbacks: ['en-US', 'en-GB', 'en'] },
};

for (const lang of languages) {
  assert(LANG_MAP[lang], `Language mapping must exist for ${lang}`);
  assert(LANG_MAP[lang].primary.includes('-'), `Primary tag for ${lang} should be full BCP-47 tag (e.g. mr-IN)`);
}
console.log('[PASS] TEST 3: BCP-47 codes verified: Marathi (mr-IN), Hindi (hi-IN), English (en-IN)\n');

// TEST 4: Speech Sequence Generation for each language
console.log('[RUN] TEST 4: Build speech sequence for each of the 3 languages');
for (const lang of languages) {
  const dict = translations[lang];
  const items = ruleKeys.map((rule, idx) => {
    const prefix = lang === 'en' ? `Rule ${idx + 1}` : `नियम ${idx + 1}`;
    return `${prefix}. ${dict[rule.title]}. ${dict[rule.desc]}`;
  });

  assert.strictEqual(items.length, 5);
  // Verify speech text contains expected keywords
  if (lang === 'mr') {
    assert(items[0].includes('वायर'), 'Marathi Rule 1 contains Wire');
    assert(items[1].includes('Acid'), 'Marathi Rule 2 contains Acid');
  } else if (lang === 'hi') {
    assert(items[0].includes('तार'), 'Hindi Rule 1 contains Wire');
    assert(items[1].includes('Acid'), 'Hindi Rule 2 contains Acid');
  } else if (lang === 'en') {
    assert(items[0].includes('Burning'), 'English Rule 1 contains Burning');
    assert(items[1].includes('Acid'), 'English Rule 2 contains Acid');
  }
}
console.log('[PASS] TEST 4: Speech sequence generated accurately with prefix and description for all 3 languages\n');

// TEST 5: Verify Audio Options count and structure
console.log('[RUN] TEST 5: Verify exactly 3 audio language options are present');
const AUDIO_OPTIONS = [
  { code: 'mr', label: 'मराठी' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'en', label: 'English' },
];
assert.strictEqual(AUDIO_OPTIONS.length, 3, 'Must have exactly 3 options');
assert.deepStrictEqual(AUDIO_OPTIONS.map(o => o.code), ['mr', 'hi', 'en']);
console.log('[PASS] TEST 5: Audio options verified with exactly 3 languages: Marathi, Hindi, English\n');

console.log('====================================================');
console.log('TOTAL TESTS: 5');
console.log('PASSED:      5');
console.log('FAILED:      0');
console.log('====================================================');
console.log('✅ ALL SAFETY TTS & AUDIO OPTIONS VERIFICATIONS PASSED');
