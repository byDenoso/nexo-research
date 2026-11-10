// Search folding shared by the index (server) and the query (client): case and diacritics are
// ignored, so "expansao" finds "expansão" and "lyα" still matches itself.
export function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export const matches = (haystack: string, query: string): boolean => {
  const terms = fold(query).split(' ').filter(Boolean);
  return terms.every(term => haystack.includes(term));
};

// Families per catalogue page, shared by the interactive browser and the server-rendered pages.
export const PAGE_SIZE = 24;
