/**
 * 本地日期字符串（YYYY-MM-DD）
 * @param {Date} [d=new Date()]
 * @returns {string} 本地时区的 YYYY-MM-DD
 */
function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = {
  localDateStr,
};
