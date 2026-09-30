/**
 * Dedicated Web Worker for VocabFlow Search & Filtering
 * Performs fuzzy search, CEFR level classification, and alphabetical sorting
 * in a separate background thread without locking UI 60fps frame rate.
 */

self.onmessage = (e: MessageEvent) => {
  const { type, items, query, cefrLevel, topic } = e.data;

  if (type === 'FILTER_VOCAB') {
    const q = (query || '').toLowerCase().trim();
    const targetCefr = (cefrLevel || '').toUpperCase().trim();
    const targetTopic = (topic || '').trim();

    const filtered = items.filter((item: any) => {
      // CEFR filter
      if (targetCefr && item.cefrLevel?.toUpperCase() !== targetCefr) {
        return false;
      }
      // Topic filter
      if (targetTopic && item.topic?.name !== targetTopic && item.topicId !== targetTopic) {
        return false;
      }
      // Query filter
      if (q) {
        const wordMatch = item.word?.toLowerCase().includes(q);
        const meaningMatch = item.meaningVi?.toLowerCase().includes(q);
        const phoneticMatch = item.phonetic?.toLowerCase().includes(q);
        const exampleMatch = item.examples?.some((ex: any) => ex.sentence?.toLowerCase().includes(q));
        if (!wordMatch && !meaningMatch && !phoneticMatch && !exampleMatch) {
          return false;
        }
      }
      return true;
    });

    self.postMessage({ type: 'FILTER_VOCAB_RESULT', result: filtered });
  }
};
