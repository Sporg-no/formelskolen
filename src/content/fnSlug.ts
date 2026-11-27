import { CATALOG, type FnMeta } from '@/lib/engine/functions';

export const fnSlug = (name: string) => name.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a').replace(/\./g, '-');
export const fnBySlug = (slug: string): FnMeta | undefined => CATALOG.find(f => fnSlug(f.no) === slug);
/** Engelske navn (vlookup, sumif …) sender videre til den norske siden. */
export const fnByEnglishSlug = (slug: string): FnMeta | undefined => CATALOG.find(f => fnSlug(f.en) === slug || f.aliases.some(a => fnSlug(a) === slug));
