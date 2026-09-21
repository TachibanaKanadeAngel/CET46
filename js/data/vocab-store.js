// 注意：default_vocab.js（738KB）不在此处静态导入，由 main.js
// 按需动态 import() 懒加载，以避免将其打包进主 chunk。
// WORDS 初始为空数组，在应用初始化阶段由 setWordsArray() 填充。
export let WORDS = [];

let _wordMap = new Map();

export function setWordsArray(arr) {
  WORDS = arr;
  _wordMap = new Map(arr.map(w => [w.id, w]));
}

export function findWordById(id) {
  const numId = typeof id === 'number' ? id : Number(id);
  return _wordMap.get(numId) || null;
}
