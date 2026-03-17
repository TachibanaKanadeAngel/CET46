self.onmessage = function(e) {
  const { type, payload } = e.data;
  
  if (type === 'PROCESS_JSON') {
    try {
      const data = JSON.parse(payload);
      let rawWords = Array.isArray(data) ? data : (data.words || []);
      
      const processed = rawWords.map((w, i) => ({
        id: w.id || i + 1,
        word: (w.word || '').trim(),
        phonetic: w.phonetic || '',
        meaning: w.meaning || '',
        example: w.example || '',
        level: w.level || 'CET4'
      })).filter(w => w.word.length > 0);

      self.postMessage({ type: 'SUCCESS', result: processed, count: processed.length });
    } catch (err) {
      self.postMessage({ type: 'ERROR', message: 'JSON 格式解析失败: ' + err.message });
    }
  }
};
