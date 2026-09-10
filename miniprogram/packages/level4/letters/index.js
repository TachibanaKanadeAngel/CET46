// LEVEL4 词库聚合（按首字母分片）
// 自动从 public/data/vocab.json 生成

const { WORDS_A } = require('./a.js');
const { WORDS_B } = require('./b.js');
const { WORDS_C } = require('./c.js');
const { WORDS_D } = require('./d.js');
const { WORDS_E } = require('./e.js');
const { WORDS_F } = require('./f.js');
const { WORDS_G } = require('./g.js');
const { WORDS_H } = require('./h.js');
const { WORDS_I } = require('./i.js');
const { WORDS_J } = require('./j.js');
const { WORDS_K } = require('./k.js');
const { WORDS_L } = require('./l.js');
const { WORDS_M } = require('./m.js');
const { WORDS_N } = require('./n.js');
const { WORDS_O } = require('./o.js');
const { WORDS_P } = require('./p.js');
const { WORDS_Q } = require('./q.js');
const { WORDS_R } = require('./r.js');
const { WORDS_S } = require('./s.js');
const { WORDS_T } = require('./t.js');
const { WORDS_U } = require('./u.js');
const { WORDS_V } = require('./v.js');
const { WORDS_W } = require('./w.js');
const { WORDS_X } = require('./x.js');
const { WORDS_Y } = require('./y.js');
const { WORDS_Z } = require('./z.js');

const WORDS = [
  WORDS_A,
  WORDS_B,
  WORDS_C,
  WORDS_D,
  WORDS_E,
  WORDS_F,
  WORDS_G,
  WORDS_H,
  WORDS_I,
  WORDS_J,
  WORDS_K,
  WORDS_L,
  WORDS_M,
  WORDS_N,
  WORDS_O,
  WORDS_P,
  WORDS_Q,
  WORDS_R,
  WORDS_S,
  WORDS_T,
  WORDS_U,
  WORDS_V,
  WORDS_W,
  WORDS_X,
  WORDS_Y,
  WORDS_Z
].reduce((all, words) => all.concat(words), []);

module.exports = { WORDS };
