import { ModelId } from '../config/constants';

export type VoiceActionType =
  | { type: 'SELECT_MODEL'; modelId: ModelId }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'RESET' }
  | { type: 'EXPLODE' }
  | { type: 'ASSEMBLE' }
  | { type: 'HOLOGRAM_MODE'; enabled?: boolean }
  | { type: 'TOGGLE_CAMERA' }
  | { type: 'THANK_YOU_EASTER_EGG' }
  | { type: 'HELP_GUIDE' };

export interface ParsedVoiceCommand {
  recognized: boolean;
  wakeWordDetected: boolean;
  rawTranscript: string;
  action: VoiceActionType | null;
  jarvisReply: string;
}

export const JARVIS_REPLIES = {
  THANK_YOU: 'You are welcome.',
  ASSEMBLE: 'Pieces put back together.',
  EXPLODE: 'Explode view on.',
  RESET: 'Back to the default view.',
  ZOOM_IN: 'Zooming in.',
  ZOOM_OUT: 'Zooming out.',
  HOLOGRAM_ON: 'Hologram pyramid on.',
  HOLOGRAM_OFF: 'Hologram pyramid off.',
  HOLOGRAM_TOGGLE: 'Hologram pyramid toggled.',
  CAMERA_TOGGLE: 'Camera preview toggled.',
  HELP_GUIDE: 'Opening the guide.',
  MODEL_HEART: 'Showing the heart.',
  MODEL_SOLAR: 'Showing the solar system.',
  MODEL_EARTH: 'Showing the earth.',
  MODEL_DNA: 'Showing the DNA helix.',
  MODEL_ATOM: 'Showing the carbon atom.',
  STANDBY: 'Listening. Try saying a command.',
} as const;

/**
 * 4.1: Normalise NFC, lowercase, replace . , ! ? " ' ’ ‘ “ ” । with spaces, collapse spaces.
 */
export function normalizeTranscript(input: string): string {
  return input
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?"'’‘“”।]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_REPLIES_SET = new Set<string>(
  Object.values(JARVIS_REPLIES).map((r) => normalizeTranscript(r))
);

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDevanagari(phrase: string): boolean {
  return /[\u0900-\u097F]/.test(phrase);
}

/**
 * 4.1: Do not use \b. Latin phrases match with (^|\s)phrase(\s|$); Devanagari phrases use includes().
 */
export function matchesPhrase(normalizedText: string, phrase: string): boolean {
  const normPhrase = normalizeTranscript(phrase);
  if (!normPhrase) return false;
  if (isDevanagari(normPhrase)) {
    return normalizedText.includes(normPhrase);
  }
  const pattern = new RegExp(`(^|\\s)${escapeRegex(normPhrase)}(\\s|$)`);
  return pattern.test(normalizedText);
}

export function matchesAnyPhrase(normalizedText: string, phrases: readonly string[]): boolean {
  for (const p of phrases) {
    if (matchesPhrase(normalizedText, p)) return true;
  }
  return false;
}

const WAKE_WORDS = [
  'jarvis',
  'jarvish',
  'jervis',
  'garvis',
  'javis',
  'jaarvis',
  'जार्विस',
  'जारविस',
] as const;

const SHOW_VERBS = [
  'show',
  'open',
  'display',
  'load',
  'go to',
  'dikhao',
  'dikha',
  'दिखाओ',
  'दिखा',
] as const;

const THANKS_PHRASES = [
  'thank you',
  'thanks',
  'shukriya',
  'dhanyawad',
  'thank u',
  'धन्यवाद',
  'शुक्रिया',
] as const;

const ASSEMBLE_PHRASES = [
  'wapas jodo',
  'वापस जोड़ो',
  'assemble',
  'reassemble',
  'combine',
  'join',
  'jodo',
  'जोड़ो',
] as const;

const EXPLODE_PHRASES = [
  'explode',
  'separate',
  'expand',
  'apart',
  'alag karo',
  'kholo',
  'अलग करो',
  'खोलो',
] as const;

const RESET_PHRASES = [
  'reset',
  'default',
  'center',
  'restore',
  'wapas',
  'shuru se',
  'रीसेट',
  'वापस',
] as const;

const ZOOM_IN_PHRASES = [
  'zoom in',
  'closer',
  'magnify',
  'bada karo',
  'paas lao',
  'बड़ा करो',
  'पास लाओ',
] as const;

const ZOOM_OUT_PHRASES = [
  'zoom out',
  'smaller',
  'further',
  'chota karo',
  'door karo',
  'छोटा करो',
  'दूर करो',
] as const;

const HOLOGRAM_ON_PHRASES = [
  'hologram mode on',
  'hologram on',
  'pyramid mode on',
  'pyramid on',
] as const;

const HOLOGRAM_OFF_PHRASES = [
  'hologram mode off',
  'hologram off',
  'pyramid mode off',
  'pyramid off',
  'exit hologram',
] as const;

const HOLOGRAM_TOGGLE_PHRASES = [
  'hologram mode',
  'hologram',
  'pyramid mode',
  'pyramid',
  'prism',
  'projection',
  'होलोग्राम',
] as const;

const CAMERA_PHRASES = [
  'hide camera',
  'show camera',
  'toggle camera',
  'camera band',
  'camera chalu',
  'webcam',
  'कैमरा',
] as const;

const HELP_PHRASES = [
  'help',
  'tips',
  'calibrate',
  'calibration',
  'guide',
  'madad',
  'मदद',
] as const;

const MODEL_NOUNS: Record<ModelId, readonly string[]> = {
  heart: ['human heart', 'heart', 'cardiac', 'dil', 'dhadkan', 'हार्ट', 'दिल'],
  solar: [
    'solar system',
    'solar',
    'planets',
    'saur mandal',
    'sun',
    'grah',
    'सौर मंडल',
  ],
  earth: ['planetary earth', 'earth', 'globe', 'world', 'prithvi', 'dharti', 'पृथ्वी', 'धरती'],
  dna: ['dna double helix', 'double helix', 'dna', 'helix', 'genetics', 'gene', 'chromosome', 'डीएनए'],
  atom: ['carbon atom', 'quantum atom', 'atom', 'atomic', 'quantum', 'electron', 'parmanu', 'परमाणु'],
};

function stripWakeWords(normalized: string): string {
  let out = normalized;
  for (const w of WAKE_WORDS) {
    if (isDevanagari(w)) {
      out = out.split(w).join(' ');
    } else {
      const rx = new RegExp(`(^|\\s)${escapeRegex(w)}(\\s|$)`, 'g');
      out = out.replace(rx, ' ');
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Parses spoken or typed transcripts into structured Jarvis actions.
 */
export function parseVoiceTranscript(
  rawTranscript: string,
  requireWakeWord = false
): ParsedVoiceCommand {
  const cleaned = normalizeTranscript(rawTranscript);

  // Self-hearing safety: every jarvisReply string triggers no action
  if (!cleaned || NORMALIZED_REPLIES_SET.has(cleaned)) {
    return {
      recognized: false,
      wakeWordDetected: false,
      rawTranscript,
      action: null,
      jarvisReply: '',
    };
  }

  const wakeWordDetected = matchesAnyPhrase(cleaned, WAKE_WORDS);

  if (requireWakeWord && !wakeWordDetected) {
    return {
      recognized: false,
      wakeWordDetected: false,
      rawTranscript,
      action: null,
      jarvisReply: '',
    };
  }

  // (1) Thanks
  if (matchesAnyPhrase(cleaned, THANKS_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected: true,
      rawTranscript,
      action: { type: 'THANK_YOU_EASTER_EGG' },
      jarvisReply: JARVIS_REPLIES.THANK_YOU,
    };
  }

  // (2) Actions: assemble (before reset, so "wapas jodo" works), explode, reset, zoom in/out, hologram, camera, help
  if (matchesAnyPhrase(cleaned, ASSEMBLE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ASSEMBLE' },
      jarvisReply: JARVIS_REPLIES.ASSEMBLE,
    };
  }

  if (matchesAnyPhrase(cleaned, EXPLODE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'EXPLODE' },
      jarvisReply: JARVIS_REPLIES.EXPLODE,
    };
  }

  if (matchesAnyPhrase(cleaned, RESET_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'RESET' },
      jarvisReply: JARVIS_REPLIES.RESET,
    };
  }

  if (matchesAnyPhrase(cleaned, ZOOM_IN_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ZOOM_IN' },
      jarvisReply: JARVIS_REPLIES.ZOOM_IN,
    };
  }

  if (matchesAnyPhrase(cleaned, ZOOM_OUT_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'ZOOM_OUT' },
      jarvisReply: JARVIS_REPLIES.ZOOM_OUT,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_ON_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE', enabled: true },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_ON,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_OFF_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE', enabled: false },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_OFF,
    };
  }

  if (matchesAnyPhrase(cleaned, HOLOGRAM_TOGGLE_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HOLOGRAM_MODE' },
      jarvisReply: JARVIS_REPLIES.HOLOGRAM_TOGGLE,
    };
  }

  if (matchesAnyPhrase(cleaned, CAMERA_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'TOGGLE_CAMERA' },
      jarvisReply: JARVIS_REPLIES.CAMERA_TOGGLE,
    };
  }

  if (matchesAnyPhrase(cleaned, HELP_PHRASES)) {
    return {
      recognized: true,
      wakeWordDetected,
      rawTranscript,
      action: { type: 'HELP_GUIDE' },
      jarvisReply: JARVIS_REPLIES.HELP_GUIDE,
    };
  }

  // (3) Model nouns: count only if the utterance has a show-verb or is just the noun (with optional wake word)
  const withoutWake = stripWakeWords(cleaned);
  const hasShowVerb = matchesAnyPhrase(withoutWake, SHOW_VERBS);

  const modelOrder: Array<{ id: ModelId; reply: string }> = [
    { id: 'heart', reply: JARVIS_REPLIES.MODEL_HEART },
    { id: 'solar', reply: JARVIS_REPLIES.MODEL_SOLAR },
    { id: 'earth', reply: JARVIS_REPLIES.MODEL_EARTH },
    { id: 'dna', reply: JARVIS_REPLIES.MODEL_DNA },
    { id: 'atom', reply: JARVIS_REPLIES.MODEL_ATOM },
  ];

  for (const { id, reply } of modelOrder) {
    const nouns = MODEL_NOUNS[id];
    const hasNoun = matchesAnyPhrase(withoutWake, nouns);
    if (!hasNoun) continue;

    const isJustNoun = nouns.some((n) => normalizeTranscript(n) === withoutWake);
    if (hasShowVerb || isJustNoun) {
      return {
        recognized: true,
        wakeWordDetected,
        rawTranscript,
        action: { type: 'SELECT_MODEL', modelId: id },
        jarvisReply: reply,
      };
    }
  }

  return {
    recognized: false,
    wakeWordDetected,
    rawTranscript,
    action: null,
    jarvisReply: wakeWordDetected ? JARVIS_REPLIES.STANDBY : '',
  };
}
