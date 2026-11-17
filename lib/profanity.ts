// A short list of common English and Hindi-in-English-letters abuse words. Whole words only, so ordinary
// words and names don't trip it. ponytail: a plain word list misses clever spellings and other languages;
// swap in a moderation API if it needs to be stricter.
const WORDS =
  /\b(fuck\w*|motherfuck\w*|shit\w*|bullshit|bitch\w*|asshole\w*|bastard\w*|dickhead|cunt\w*|slut\w*|whore\w*|pussy|retard\w*|nigg(?:a|er)\w*|madarchod|behenchod|bhosd\w*|chutiy\w*|gandu)\b/

/** Undo common disguises: f*ck-style leetspeak (0,1,3,4,5,@,$) and stretched letters (fuuuck). */
const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[01345@$]/g, (c) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", $: "s" })[c] as string)
    .replace(/(.)\1{2,}/g, "$1") // 3 or more in a row -> one; real words rarely repeat a letter 3 times

export const isVulgar = (text: string) => WORDS.test(clean(text))
