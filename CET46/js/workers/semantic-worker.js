class BKNode {
  constructor(word) {
    this.word = word;
    this.children = new Map();
  }

  toJSON() {
    return {
      word: this.word,
      children: Array.from(this.children.entries()).map(([dist, node]) => [dist, node.toJSON()])
    };
  }

  static fromJSON(data, calcDistance) {
    const node = new BKNode(data.word);
    node.children = new Map(data.children.map(([dist, childData]) => [dist, BKNode.fromJSON(childData, calcDistance)]));
    return node;
  }
}

class BKTree {
  constructor(calcDistance) {
    this.root = null;
    this.calcDistance = calcDistance;
    this.wordCount = 0;
  }

  add(word) {
    if (!this.root) {
      this.root = new BKNode(word);
      this.wordCount++;
      return;
    }
    let curr = this.root;
    while (true) {
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

  search(target, tolerance) {
    const results = [];
    if (!this.root) return results;

    const queue = [this.root];
    while (queue.length > 0) {
      const node = queue.shift();
      const dist = this.calcDistance(node.word, target);

      if (dist <= tolerance && dist > 0) {
        results.push({ word: node.word, distance: dist });
      }

      for (let i = dist - tolerance; i <= dist + tolerance; i++) {
        if (i >= 0 && node.children.has(i)) {
          queue.push(node.children.get(i));
        }
      }
    }
    return results;
  }

  serialize() {
    if (!this.root) return null;
    return JSON.stringify(this.root.toJSON());
  }

  deserialize(data) {
    try {
      const parsed = JSON.parse(data);
      this.root = BKNode.fromJSON(parsed, this.calcDistance);
      this.wordCount = this.countNodes(this.root);
      return true;
    } catch (e) {
      console.error('BK-Tree 反序列化失败:', e);
      return false;
    }
  }

  countNodes(node) {
    if (!node) return 0;
    let count = 1;
    for (const child of node.children.values()) {
      count += this.countNodes(child);
    }
    return count;
  }
}

  searchWithCallback(target, tolerance, callback) {
    if (!this.root) return;

    const queue = [this.root];
    let visited = 0;

    while (queue.length > 0) {
      const node = queue.shift();
      visited++;
      const dist = this.calcDistance(node.word, target);

      if (dist <= tolerance && dist > 0) {
        callback({ word: node.word, distance: dist });
      }

      for (let i = dist - tolerance; i <= dist + tolerance; i++) {
        if (i >= 0 && node.children.has(i)) {
          queue.push(node.children.get(i));
        }
      }

      if (visited % 1000 === 0) {
        self.postMessage({ type: 'heartbeat', visited });
      }
    }
  }
}

function calculateLevenshtein(s1, s2) {
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const maxLen = Math.max(s1.length, s2.length);
  if (Math.abs(s1.length - s2.length) > 2) return maxLen;

  let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  let currRow = new Array(s2.length + 1);

  for (let i = 1; i <= s1.length; i++) {
    currRow[0] = i;
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[s2.length];
}

function buildLengthGroups(words) {
  const groups = new Map();
  for (const word of words) {
    const len = word.length;
    if (!groups.has(len)) {
      groups.set(len, []);
    }
    groups.get(len).push(word);
  }
  return groups;
}

function buildBKTreeForGroup(words, calcDistance) {
  const tree = new BKTree(calcDistance);
  for (const word of words) {
    tree.add(word);
  }
  return tree;
}

self.onmessage = function(e) {
  const { words, threshold = 2, strategy = 'bktree', loadFromDB = false, cachedBKTree = null } = e.data;

  // 优先使用从 IndexedDB 加载的缓存数据
  if (cachedBKTree) {
    loadTreeFromCache(cachedBKTree).then(success => {
      if (success) {
        self.postMessage({ type: 'ready', fromDB: true, message: '✅ 从 IndexedDB 加载 BK-Tree 缓存' });
      } else {
        buildAndSaveTree(words, threshold);
      }
    });
    return;
  }

  // 兼容旧版：从 localStorage 加载
  if (loadFromDB) {
    loadTreeFromDB().then(success => {
      if (success) {
        self.postMessage({ type: 'ready', fromDB: true });
      } else {
        buildAndSaveTree(words, threshold);
      }
    });
    return;
  }

  if (strategy === 'bruteforce') {
    bruteforceSearch(words, threshold);
    return;
  }

  buildAndSaveTree(words, threshold);
};

async function buildAndSaveTree(words, threshold) {
  const results = {};
  const total = words.length;
  const lengthGroups = buildLengthGroups(words);
  const sortedLengths = Array.from(lengthGroups.keys()).sort((a, b) => a - b);

  const trees = new Map();
  for (const len of sortedLengths) {
    trees.set(len, buildBKTreeForGroup(lengthGroups.get(len), calculateLevenshtein));
  }

  let processed = 0;
  const dynamicThreshold = (word) => Math.min(threshold, Math.floor(word.length * 0.4));

  for (const word of words) {
    const wordLen = word.length;
    const tol = dynamicThreshold(word);
    results[word] = [];

    for (let checkLen = wordLen - tol; checkLen <= wordLen + tol; checkLen++) {
      if (!trees.has(checkLen)) continue;

      const tree = trees.get(checkLen);
      const matches = tree.search(word, tol);

      for (const match of matches) {
        if (!results[word].some(r => r.word === match.word)) {
          results[word].push({ word: match.word, distance: match.distance });
        }
      }
    }

    processed++;
    if (processed % 500 === 0) {
      self.postMessage({
        type: 'progress',
        progress: processed / total,
        processed,
        total
      });
    }
  }

  const serializedTrees = {};
  for (const [len, tree] of trees.entries()) {
    serializedTrees[len] = tree.serialize();
  }

  self.postMessage({
    type: 'SAVE_TREE',
    data: JSON.stringify(serializedTrees),
    wordCount: words.length
  });

  self.postMessage({ type: 'complete', results, strategy: 'bktree' });
}

async function loadTreeFromCache(serializedTrees) {
  try {
    const trees = new Map();
    const parsed = typeof serializedTrees === 'string' ? JSON.parse(serializedTrees) : serializedTrees;

    for (const [len, data] of Object.entries(parsed)) {
      const tree = new BKTree(calculateLevenshtein);
      if (tree.deserialize(data)) {
        trees.set(parseInt(len), tree);
      }
    }

    if (trees.size === 0) {
      return false;
    }

    self.postMessage({
      type: 'info',
      message: `✅ 从 IndexedDB 加载 BK-Tree，共 ${trees.size} 个长度组，总计 ${trees.reduce((sum, t) => sum + t.wordCount, 0)} 个单词`
    });

    self.treeCache = trees;
    return true;
  } catch (e) {
    console.error('从缓存加载 BK-Tree 失败:', e);
    return false;
  }
}

async function loadTreeFromDB() {
  return new Promise(resolve => {
    const serialized = localStorage.getItem('cet46_semantic_bktree');
    if (!serialized) {
      resolve(false);
      return;
    }

    try {
      const serializedTrees = JSON.parse(serialized);
      const trees = new Map();

      for (const [len, data] of Object.entries(serializedTrees)) {
        const tree = new BKTree(calculateLevenshtein);
        if (tree.deserialize(data)) {
          trees.set(parseInt(len), tree);
        }
      }

      if (trees.size === 0) {
        resolve(false);
        return;
      }

      self.postMessage({
        type: 'info',
        message: `✅ 从 IndexedDB 加载 BK-Tree，共 ${trees.size} 个长度组`
      });

      self.treeCache = trees;
      resolve(true);
    } catch (e) {
      console.error('加载 BK-Tree 失败:', e);
      resolve(false);
    }
  });
}

function bruteforceSearch(words, threshold) {
  const results = {};
  const total = words.length;

  for (let i = 0; i < total; i++) {
    const word1 = words[i];
    results[word1] = [];

    for (let j = i + 1; j < total; j++) {
      const word2 = words[j];
      if (Math.abs(word1.length - word2.length) > threshold) continue;

      const distance = calculateLevenshtein(word1, word2);
      if (distance <= threshold && distance > 0) {
        results[word1].push({ word: word2, distance });
        if (!results[word2]) results[word2] = [];
        results[word2].push({ word: word1, distance });
      }
    }

    if (i % 100 === 0) {
      self.postMessage({ type: 'progress', progress: i / total });
    }
  }

  self.postMessage({ type: 'complete', results, strategy: 'bruteforce' });
}
