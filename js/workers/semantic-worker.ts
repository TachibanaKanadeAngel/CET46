class BKNode {
  public word: string;
  public children: Map<number, BKNode>;

  constructor(word: string) {
    this.word = word;
    this.children = new Map();
  }

  toJSON(): { word: string; children: [number, any][] } {
    return {
      word: this.word,
      children: Array.from(this.children.entries()).map(([dist, node]) => [dist, node.toJSON()]),
    };
  }

  static fromJSON(data: any): BKNode {
    const node = new BKNode(data.word);
    node.children = new Map(
      (data.children || []).map(([dist, childData]: [number, any]) => [dist, BKNode.fromJSON(childData)])
    );
    return node;
  }
}

class BKTree {
  public root: BKNode | null;
  public calcDistance: (s1: string, s2: string) => number;
  public wordCount: number;

  constructor(calcDistance: (s1: string, s2: string) => number) {
    this.root = null;
    this.calcDistance = calcDistance;
    this.wordCount = 0;
  }

  add(word: string): void {
    if (!this.root) {
      this.root = new BKNode(word);
      this.wordCount++;
      return;
    }
    let curr: BKNode | undefined = this.root;
    while (curr) {
      const dist = this.calcDistance(curr.word, word);
      if (dist === 0) return;
      if (!curr.children.has(dist)) {
        curr.children.set(dist, new BKNode(word));
        this.wordCount++;
        break;
      }
      curr = curr.children.get(dist);
    }
  }

  search(target: string, tolerance: number): Array<{ word: string; distance: number }> {
    const results: Array<{ word: string; distance: number }> = [];
    if (!this.root) return results;

    const queue = [this.root];
    let head = 0;
    while (head < queue.length) {
      const node = queue[head++];
      const dist = this.calcDistance(node.word, target);

      if (dist <= tolerance && dist > 0) {
        results.push({ word: node.word, distance: dist });
      }

      for (let i = dist - tolerance; i <= dist + tolerance; i++) {
        if (i >= 0 && node.children.has(i)) {
          queue.push(node.children.get(i)!);
        }
      }
    }
    return results;
  }

  serialize(): string | null {
    if (!this.root) return null;
    return JSON.stringify(this.root.toJSON());
  }

  deserialize(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.root = BKNode.fromJSON(parsed);
      this.wordCount = this.countNodes(this.root);
      return true;
    } catch (e) {
      console.error('BK-Tree 反序列化失败:', e);
      return false;
    }
  }

  countNodes(node: BKNode | null): number {
    if (!node) return 0;
    let count = 1;
    for (const child of node.children.values()) {
      count += this.countNodes(child);
    }
    return count;
  }

  searchWithCallback(target: string, tolerance: number, callback: (item: { word: string; distance: number }) => void): void {
    if (!this.root) return;

    const queue = [this.root];
    let head = 0;
    let visited = 0;

    while (head < queue.length) {
      const node = queue[head++];
      visited++;
      const dist = this.calcDistance(node.word, target);

      if (dist <= tolerance && dist > 0) {
        callback({ word: node.word, distance: dist });
      }

      for (let i = dist - tolerance; i <= dist + tolerance; i++) {
        if (i >= 0 && node.children.has(i)) {
          queue.push(node.children.get(i)!);
        }
      }

      if (visited % 1000 === 0) {
        self.postMessage({ type: 'heartbeat', visited });
      }
    }
  }
}

function safeText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join(' ');
  if (typeof value === 'object') {
    const candidate =
      value.word ?? value.meaning ?? value.translation ?? value.text ?? value.value ?? '';
    if (candidate) return safeText(candidate);
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

const normalizationCache = new Map<string, string>();
function getNormalizedWord(word: any): string {
  let cached = normalizationCache.get(String(word));
  if (cached === undefined) {
    cached = safeText(word).toLowerCase().trim();
    normalizationCache.set(String(word), cached);
  }
  return cached;
}

let prevRowBuffer = new Int32Array(64);
let currRowBuffer = new Int32Array(64);

function calculateLevenshtein(s1: any, s2: any): number {
  const str1 = getNormalizedWord(s1);
  const str2 = getNormalizedWord(s2);

  if (str1 === str2) return 0;
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  const len1 = str1.length;
  const len2 = str2.length;

  if (len2 >= 64) {
    let prevRow = Array.from({ length: len2 + 1 }, (_, i) => i);
    let currRow = new Array(len2 + 1);
    for (let i = 1; i <= len1; i++) {
      currRow[0] = i;
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
      }
      [prevRow, currRow] = [currRow, prevRow];
    }
    return prevRow[len2];
  }

  if (prevRowBuffer.length < len2 + 1) {
    prevRowBuffer = new Int32Array(len2 + 1);
    currRowBuffer = new Int32Array(len2 + 1);
  }

  for (let j = 0; j <= len2; j++) {
    prevRowBuffer[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRowBuffer[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRowBuffer[j] = Math.min(
        currRowBuffer[j - 1] + 1,
        prevRowBuffer[j] + 1,
        prevRowBuffer[j - 1] + cost
      );
    }
    const tmp = prevRowBuffer;
    prevRowBuffer = currRowBuffer;
    currRowBuffer = tmp;
  }

  return prevRowBuffer[len2];
}

function extractWordList(words: any[]): string[] {
  const wordList: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < words.length; i++) {
    const item = words[i];
    let w = '';
    if (typeof item === 'string') {
      w = item;
    } else if (item && typeof item === 'object') {
      w = item.word || item.text || item.w || '';
    }
    w = safeText(w).toLowerCase().trim();
    if (w && !seen.has(w)) {
      seen.add(w);
      wordList.push(w);
    }
  }
  return wordList;
}

const bkTreeCache: Record<string, BKTree> = {};

self.onmessage = async (e: MessageEvent) => {
  const { words, threshold = 2, cachedBKTree, loadFromDB } = e.data || {};

  if (cachedBKTree) {
    try {
      const results = buildGraphWithCachedTrees(words, threshold, cachedBKTree);
      self.postMessage({ type: 'complete', results });
      return;
    } catch (e: any) {
      console.warn('使用预置 BK-Tree 失败，降级重建:', e);
    }
  }

  if (loadFromDB) {
    try {
      const dbTree = await loadBKTreeFromIndexedDB();
      if (dbTree) {
        const results = buildGraphWithCachedTrees(words, threshold, { main: dbTree });
        self.postMessage({ type: 'complete', results });
        return;
      }
    } catch (e) {
      console.warn('从 IndexedDB 加载 BK-Tree 失败，重新构建:', e);
    }
  }

  try {
    const results = buildSemanticGraphWithBKTree(words, threshold);
    self.postMessage({ type: 'complete', results });
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err?.message || '构建失败' });
  }
};

function buildBKTree(words: string[], calcDistance: (s1: string, s2: string) => number, onProgress?: (p: number) => void): BKTree {
  const tree = new BKTree(calcDistance);
  const total = words.length;

  for (let i = 0; i < total; i++) {
    tree.add(words[i]);
    if (onProgress && (i % 500 === 0 || i === total - 1)) {
      onProgress(i / total);
    }
  }
  return tree;
}

function buildSemanticGraphWithBKTree(words: any[], threshold: number = 2): Record<string, string[]> {
  const wordList = extractWordList(words);
  const total = wordList.length;

  if (total === 0) return {};

  let tree = bkTreeCache['main'];
  if (!tree) {
    self.postMessage({ type: 'progress', progress: 0.1, stage: 'building_tree' });
    tree = buildBKTree(wordList, calculateLevenshtein, progress => {
      self.postMessage({ type: 'progress', progress: 0.1 + progress * 0.4, stage: 'building_tree' });
    });
    bkTreeCache['main'] = tree;

    try {
      const serialized = tree.serialize();
      if (serialized) {
        self.postMessage({
          type: 'SAVE_TREE',
          data: serialized,
          wordCount: tree.wordCount,
        });
      }
    } catch (e) {
      console.warn('序列化 BK-Tree 失败:', e);
    }
  }

  const results: Record<string, string[]> = {};
  const BATCH_SIZE = 100;

  for (let i = 0; i < total; i++) {
    const word = wordList[i];
    const similar = tree.search(word, threshold);

    similar.sort((a, b) => a.distance - b.distance);
    results[word] = similar.slice(0, 10).map(s => s.word);

    if (i % BATCH_SIZE === 0 || i === total - 1) {
      self.postMessage({
        type: 'progress',
        progress: 0.5 + (i / total) * 0.5,
        stage: 'searching',
      });
    }
  }

  return results;
}

function buildGraphWithCachedTrees(words: any[], threshold: number = 2, serializedTrees: Record<string, string>): Record<string, string[]> {
  const wordList = extractWordList(words);
  const total = wordList.length;
  if (total === 0) return {};

  for (const [key, serialized] of Object.entries(serializedTrees)) {
    if (!bkTreeCache[key] && serialized) {
      const tree = new BKTree(calculateLevenshtein);
      if (tree.deserialize(serialized)) {
        bkTreeCache[key] = tree;
      }
    }
  }

  const tree = bkTreeCache['main'] || Object.values(bkTreeCache)[0];
  if (!tree) {
    return buildSemanticGraphWithBKTree(words, threshold);
  }

  const results: Record<string, string[]> = {};
  for (let i = 0; i < total; i++) {
    const word = wordList[i];
    const similar = tree.search(word, threshold);
    similar.sort((a, b) => a.distance - b.distance);
    results[word] = similar.slice(0, 10).map(s => s.word);
  }
  return results;
}

async function loadBKTreeFromIndexedDB(): Promise<string | null> {
  return new Promise(resolve => {
    try {
      const request = indexedDB.open('CET46_DB');
      request.onsuccess = (event: any) => {
        const db = event.target?.result as IDBDatabase;
        if (!db || !db.objectStoreNames.contains('session')) {
          resolve(null);
          return;
        }
        try {
          const tx = db.transaction('session', 'readonly');
          const store = tx.objectStore('session');
          const getReq = store.get('bk_tree_cache');
          getReq.onsuccess = (e: any) => {
            const data = e.target?.result?.data;
            resolve(typeof data === 'string' ? data : null);
          };
          getReq.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
