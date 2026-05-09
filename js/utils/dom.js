export function byId(id) {
  return document.getElementById(id);
}

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return root.querySelectorAll(selector);
}

export function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

export function setHtml(selector, html) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = html;
}

export function setDisplay(selector, display) {
  const el = document.querySelector(selector);
  if (el) el.style.display = display;
}

export function setInputAttrs(selector, attrs) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (attrs.placeholder !== undefined) el.setAttribute('placeholder', attrs.placeholder);
  if (attrs.ariaLabel !== undefined) el.setAttribute('aria-label', attrs.ariaLabel);
  if (attrs.title !== undefined) el.setAttribute('title', attrs.title);
  if (attrs.value !== undefined) el.value = attrs.value;
}