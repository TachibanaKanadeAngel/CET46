export function byId(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function qs(selector: string, root: ParentNode = document): Element | null {
  return root.querySelector(selector);
}

export function qsa(selector: string, root: ParentNode = document): NodeListOf<Element> {
  return root.querySelectorAll(selector);
}

export function setText(selector: string, text: string): void {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'a',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'kbd', 'code',
  'pre', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption',
  'colgroup', 'col', 'img', 'sup', 'sub', 'button',
]);

const ALLOWED_ATTRS = new Set([
  'class', 'id', 'href', 'src', 'alt', 'title', 'colspan', 'rowspan',
  'target', 'rel', 'disabled', 'span',
]);

// 递归深度上限，防止恶意深层嵌套触发 O(n²) 或栈溢出 DoS
const MAX_SANITIZE_DEPTH = 50;

function isAllowedAttr(name: string): boolean {
  if (ALLOWED_ATTRS.has(name)) return true;
  if (name.startsWith('data-')) return true;
  return false;
}

function sanitizeNode(node: Node, depth = 0): void {
  if (node.nodeType === Node.TEXT_NODE) return;
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node.parentNode?.removeChild(node);
    return;
  }

  // 深度超限直接移除整个子树，避免递归过深
  if (depth > MAX_SANITIZE_DEPTH) {
    node.parentNode?.removeChild(node);
    return;
  }

  const tag = node.nodeName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // 将不允许的标签替换为其子节点
    const parent = node.parentNode;
    const promotedChildren = Array.from(node.childNodes);
    if (!parent) return;
    while (node.firstChild) {
      parent.insertBefore(node.firstChild, node);
    }
    parent.removeChild(node);
    // 递归净化被提升的子节点
    for (const child of promotedChildren) {
      if (child.nodeType === 1) { // Element node
        sanitizeNode(child, depth);
      }
    }
    return;
  }

  // 过滤属性
  const attrs = Array.from((node as Element).attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    // 移除 on* 事件属性
    if (name.startsWith('on')) {
      (node as Element).removeAttribute(attr.name);
      continue;
    }
    // 移除 javascript:/vbscript: 协议与危险的 data: 子类型
    // （防御嵌入空白字符绕过：浏览器会剥离 Tab/LF/CR/NUL 后再执行协议）
    if (name === 'href' || name === 'src') {
      const cleaned = attr.value.replace(/[\x00-\x20\x7f]/g, '').toLowerCase();
      if (/^(?:javascript|vbscript):/i.test(cleaned)) {
        (node as Element).removeAttribute(attr.name);
        continue;
      }
      if (/^data:/i.test(cleaned)) {
        if (!/^data:image\/(?:png|jpeg|jpg|gif|webp|bmp);/i.test(cleaned)) {
          (node as Element).removeAttribute(attr.name);
          continue;
        }
      }
    }
    // 移除不在白名单中的属性
    if (!isAllowedAttr(name)) {
      (node as Element).removeAttribute(attr.name);
    }
  }

  // 递归处理子节点（用副本遍历，因为DOM会变动）
  const children = Array.from(node.childNodes);
  for (const child of children) {
    sanitizeNode(child, depth + 1);
  }
}

export function setHtml(target: string | Element, html: string): void {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const children = Array.from(tmp.childNodes);
  for (const child of children) {
    sanitizeNode(child, 0);
  }

  el.innerHTML = tmp.innerHTML;
}

export function setDisplay(selector: string, display: string): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (el) el.style.display = display;
}

export function setInputAttrs(
  selector: string,
  attrs: { placeholder?: string; ariaLabel?: string; title?: string; value?: string }
): void {
  const el = document.querySelector<HTMLInputElement>(selector);
  if (!el) return;
  if (attrs.placeholder !== undefined) el.setAttribute('placeholder', attrs.placeholder);
  if (attrs.ariaLabel !== undefined) el.setAttribute('aria-label', attrs.ariaLabel);
  if (attrs.title !== undefined) el.setAttribute('title', attrs.title);
  if (attrs.value !== undefined) el.value = attrs.value;
}

/** 创建焦点陷阱，将Tab键限制在容器内循环。 */
export function createFocusTrap(container: HTMLElement | null): () => void {
  if (!container) return () => {};
  const root: HTMLElement = container;

  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function handleKeyDown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return;

    const focusableElements = root.querySelectorAll(focusableSelector);
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  // 记住之前的焦点元素
  const previousFocus = document.activeElement as HTMLElement | null;

  // 将焦点移到容器内
  const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
  if (firstFocusable) firstFocusable.focus();

  // 返回清理函数
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  };
}