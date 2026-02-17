/**
 * Cross-check script content against transcription.
 * Determines whether phrases from the script appear in the transcription.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split script into phrases (lines or sentences). */
function splitIntoPhrases(script: string): string[] {
  return script
    .split(/\n+/)
    .map((line) => line.replace(/^\[\d{1,2}:\d{2}\.\d{2,3}\]\s*/, '').trim())
    .filter(Boolean);
}

/** Check if a phrase (or its significant words) appears in the transcript. */
function phraseFoundInTranscript(phrase: string, transcript: string): boolean {
  const normPhrase = normalize(phrase);
  const normTranscript = normalize(transcript);
  if (!normPhrase) return true;

  // Exact phrase match
  if (normTranscript.includes(normPhrase)) return true;

  // Word-by-word: require most words to appear in order
  const words = normPhrase.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 0) return true;

  let lastIndex = -1;
  let found = 0;
  for (const word of words) {
    const idx = normTranscript.indexOf(word, lastIndex + 1);
    if (idx !== -1) {
      lastIndex = idx;
      found++;
    }
  }
  // Require at least 70% of significant words to be found in order
  return found >= Math.ceil(words.length * 0.7);
}

export interface CrossCheckResult {
  found: number;
  total: number;
  missingPhrases: string[];
  allFound: boolean;
}

export function crossCheckScriptVsTranscription(
  script: string,
  transcription: string
): CrossCheckResult {
  const phrases = splitIntoPhrases(script);
  const missing: string[] = [];
  let found = 0;

  for (const phrase of phrases) {
    if (phraseFoundInTranscript(phrase, transcription)) {
      found++;
    } else {
      missing.push(phrase);
    }
  }

  return {
    found,
    total: phrases.length,
    missingPhrases: missing,
    allFound: missing.length === 0,
  };
}
