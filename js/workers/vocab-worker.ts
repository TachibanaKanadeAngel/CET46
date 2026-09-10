const WORD_MAX_LENGTH = 200;
const FIELD_MAX_LENGTH = 1000;
const MAX_IMPORT_ENTRIES = 10000;
const VALID_LEVELS = ['CET4', 'CET6'];
const WORD_REGEX = /^[a-zA-Z\s\-']+$/;

self.onmessage = function (e: MessageEvent) {
  try {
    const { type, payload } = e.data || {};

    if (type === 'PROCESS_JSON') {
      try {
        const data = JSON.parse(payload);
        const rawWords: any[] = Array.isArray(data) ? data : data.words || [];

        if (rawWords.length > MAX_IMPORT_ENTRIES) {
          self.postMessage({
            type: 'ERROR',
            message: `导入条目数超过限制（最大 ${MAX_IMPORT_ENTRIES} 条），当前 ${rawWords.length} 条`,
          });
          return;
        }

        const idSet = new Set<any>();
        const processed: any[] = [];
        const skippedIds: any[] = [];
        const skippedInvalidWords: string[] = [];

        for (let i = 0; i < rawWords.length; i++) {
          const w = rawWords[i];
          const id = w.id || i + 1;

          if (idSet.has(id)) {
            skippedIds.push(id);
            continue;
          }
          idSet.add(id);

          let word = (w.word || '').trim();
          if (word.length === 0) continue;
          if (word.length > WORD_MAX_LENGTH) {
            word = word.substring(0, WORD_MAX_LENGTH);
          }
          if (!WORD_REGEX.test(word)) {
            skippedInvalidWords.push(word);
            continue;
          }

          let phonetic = w.phonetic || '';
          if (phonetic.length > FIELD_MAX_LENGTH) {
            phonetic = phonetic.substring(0, FIELD_MAX_LENGTH);
          }

          let meaning = w.meaning || '';
          if (meaning.length > FIELD_MAX_LENGTH) {
            meaning = meaning.substring(0, FIELD_MAX_LENGTH);
          }

          let example = w.example || '';
          if (example.length > FIELD_MAX_LENGTH) {
            example = example.substring(0, FIELD_MAX_LENGTH);
          }

          let level = (w.level || 'CET4').toUpperCase();
          if (!VALID_LEVELS.includes(level)) {
            level = 'CET4';
          }

          processed.push({
            id,
            word,
            phonetic,
            meaning,
            example,
            level,
          });
        }

        self.postMessage({
          type: 'PROCESS_JSON_SUCCESS',
          words: processed,
          skippedDuplicates: skippedIds.length,
          skippedInvalid: skippedInvalidWords.length,
          total: processed.length,
        });
      } catch (err: any) {
        self.postMessage({
          type: 'ERROR',
          message: 'JSON 解析失败: ' + (err?.message || '未知格式错误'),
        });
      }
    }
  } catch (error: any) {
    self.postMessage({
      type: 'ERROR',
      message: 'Worker 内部错误: ' + (error?.message || '未知异常'),
    });
  }
};
