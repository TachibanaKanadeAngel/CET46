// 自定义词书 CSV 解析器
// 将用户上传的 .csv 词表解析为单词对象（与词库 schema 一致）：
//   { word, phonetic, meaning, example, level, source: 'custom' }
// 支持带表头（word/phonetic/meaning/example/level 或中文别名）或不带表头两种格式。
// 本模块为纯函数、无 DOM/存储依赖，便于单元测试。

export interface ImportedWord {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  level: string;
  source: string;
  id?: number;
}

export interface CsvOptions {
  defaultLevel?: string;
  source?: string;
  allowHeader?: boolean;
}

// 支持的表头别名 -> 字段名
const HEADER_ALIASES: Record<string, string[]> = {
  word: ['word', '单词', '词', '词汇', 'word/term'],
  phonetic: ['phonetic', '音标', '发音'],
  meaning: ['meaning', '释义', '含义', '意思', '翻译', '注释', 'translation', 'gloss'],
  example: ['example', '例句', 'context', 'sentence', '语境'],
  level: ['level', '级别', '难度', '等级', '标签', 'tag'],
};

type FieldName = 'word' | 'phonetic' | 'meaning' | 'example' | 'level' | null;

function normalizeHeader(value: string): string {
  return (value || '').trim().toLowerCase().replace(/[\s_\-/：:（）()]+/g, '');
}

/** 将单个表头单元格归一到字段名，未识别返回 null。 */
function mapHeaderToField(cell: string): FieldName {
  const key = normalizeHeader(cell);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some(a => normalizeHeader(a) === key)) return field as FieldName;
  }
  return null;
}

/** 解析标准 CSV 文本（支持双引号包裹、内含逗号/换行、转义引号）。 */
export function parseCSV(text: string): string[][] {
  if (typeof text !== 'string') return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0].trim() !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  // 末尾未换行的部分
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0].trim() !== '') rows.push(row);
  }
  return rows;
}

/** 判断首行是否为表头行。 */
export function isHeaderRow(row: unknown[]): boolean {
  if (!Array.isArray(row) || row.length === 0) return false;
  const matched = row.map(cell => mapHeaderToField(String(cell)));
  const count = matched.filter(Boolean).length;
  if (count >= 2) return true;
  return mapHeaderToField(String(row[0])) === 'word' && row.length >= 2;
}

/** 将一行（基于表头列位置）映射为单词对象。 */
function rowToWord(cells: string[], headerMap: FieldName[] | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (headerMap) {
    for (let i = 0; i < cells.length; i++) {
      const field = headerMap[i];
      if (field && cells[i] !== undefined) out[field] = cells[i].trim();
    }
  } else {
    noHeaderMapping(out, cells);
  }
  return out;
}

function noHeaderMapping(out: Record<string, string>, cells: string[]): void {
  // 无表头：按位置映射 word, meaning, phonetic, example, level
  const set = (i: number, field: string) => { if (cells[i] !== undefined) out[field] = cells[i].trim(); };
  set(0, 'word');
  // 第二列若以 '/' 或 '[' 开头更像音标，否则为释义
  const second = (cells[1] || '').trim();
  if (second.startsWith('/') || second.startsWith('[') || /^[/[]/.test(second)) {
    set(1, 'phonetic');
    set(2, 'meaning');
    set(3, 'example');
    set(4, 'level');
  } else {
    set(1, 'meaning');
    set(2, 'phonetic');
    set(3, 'example');
    set(4, 'level');
  }
}

/** 将 CSV 文本解析为单词对象列表。 */
export function parseWordCSV(csvText: string, opts: CsvOptions = {}): ImportedWord[] {
  const { defaultLevel = 'CUSTOM', source = 'custom', allowHeader = true } = opts;
  const rows = parseCSV(csvText);
  if (rows.length === 0) return [];

  let headerMap: FieldName[] | null = null;
  let dataRows = rows;
  if (allowHeader && isHeaderRow(rows[0])) {
    headerMap = rows[0].map(mapHeaderToField);
    dataRows = rows.slice(1);
  }

  const seen = new Set<string>();
  const words: ImportedWord[] = [];
  for (const cells of dataRows) {
    const obj = rowToWord(cells, headerMap);
    const word = (obj.word || '').trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue; // 去重（忽略大小写）
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

/** 为解析出的单词分配自增 id（起始 baseId，默认 900000，避开默认内置词库 ID 范围）。 */
export function assignWordIds(words: ImportedWord[], baseId = 900000): ImportedWord[] {
  return words.map((w, i) => ({ id: baseId + i, ...w }));
}

export default { parseCSV, isHeaderRow, parseWordCSV, assignWordIds };