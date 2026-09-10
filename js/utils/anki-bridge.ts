const FIELD_ALIASES: Record<string, string[]> = {
  word: ['word', '单词', 'front', 'term'],
  meaning: ['meaning', '释义', 'back', '翻译', 'translation'],
  phonetic: ['phonetic', '音标', 'pronunciation'],
  example: ['example', '例句', 'sentence', 'context'],
  level: ['level', '级别', '难度', 'tag'],
};

function norm(s: string): string {
  return String(s || '').trim().toLowerCase().replace(/[\s_\-/：:（）()]+/g, '');
}

function fieldForLabel(label: string): string | null {
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some(a => norm(a) === norm(label))) return field;
  }
  return null;
}

export function isHeaderRow(cells: string[]): boolean {
  if (!Array.isArray(cells) || cells.length === 0) return false;
  const matched = cells.map(fieldForLabel).filter(Boolean);
  return matched.length >= 2 || fieldForLabel(cells[0]) === 'word';
}

export function buildAnkiExport(
  words: Array<{ word: string; meaning: string; phonetic?: string; example?: string; level?: string }>,
  opts: { fields?: string[]; includeHeader?: boolean } = {}
): string {
  const fields = opts.fields ?? ['word', 'meaning', 'phonetic', 'example', 'level'];
  const includeHeader = opts.includeHeader !== false;
  const lines: string[] = [];
  if (includeHeader) {
    lines.push(fields.map(f => fieldForAnkiFieldName(f) || f).join('\t'));
  }
  for (const w of words || []) {
    const line = fields.map(f => String((w as any)[f] ?? '').replace(/\t/g, ' ')).join('\t');
    lines.push(line);
  }
  return lines.join('\n');
}

function fieldForAnkiFieldName(field: string): string {
  const map: Record<string, string> = { word: 'Word', meaning: 'Meaning', phonetic: 'Phonetic', example: 'Example', level: 'Level' };
  return map[field] || field;
}

export function parseAnkiImport(
  text: string,
  opts: { sep?: string; defaultLevel?: string; source?: string } = {}
): Array<{ word: string; phonetic: string; meaning: string; example: string; level: string; source: string }> {
  const sep = opts.sep ?? '\t';
  const defaultLevel = opts.defaultLevel ?? 'CUSTOM';
  const source = opts.source ?? 'anki';
  const rawLines = String(text || '').split(/\r?\n/);

  const rows: string[][] = [];
  for (const line of rawLines) {
    if (!line.trim()) continue;
    if (line.trim().startsWith('#')) continue;
    rows.push(line.split(sep).map(c => c.trim()));
  }
  if (rows.length === 0) return [];

  let headerMap: Array<string | null> | null = null;
  let dataRows = rows;
  if (isHeaderRow(rows[0])) {
    headerMap = rows[0].map(fieldForLabel);
    dataRows = rows.slice(1);
  }

  const seen = new Set<string>();
  const words: Array<{ word: string; phonetic: string; meaning: string; example: string; level: string; source: string }> = [];
  for (const cells of dataRows) {
    const obj: Record<string, string> = {};
    if (headerMap) {
      for (let i = 0; i < cells.length; i++) {
        const h = headerMap[i];
        if (h) obj[h] = cells[i];
      }
    } else {
      obj.word = cells[0] ?? '';
      obj.meaning = cells[1] ?? '';
      obj.phonetic = cells[2] ?? '';
      obj.example = cells[3] ?? '';
      obj.level = cells[4] ?? '';
    }
    const word = (obj.word || '').trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({
      word,
      phonetic: (obj.phonetic || '').trim(),
      meaning: (obj.meaning || '').trim(),
      example: (obj.example || '').trim(),
      level: (obj.level || defaultLevel).trim(),
      source,
    });
  }
  return words;
}

export default { isHeaderRow, buildAnkiExport, parseAnkiImport };
