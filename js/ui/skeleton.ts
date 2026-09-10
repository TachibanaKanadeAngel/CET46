import { setHtml } from '../utils/dom.js';

export const Skeleton = {
  createWordCard(): string {
    return `
      <div class="skeleton-word-card">
        <div class="skeleton skeleton-word"></div>
        <div class="skeleton skeleton-phonetic"></div>
        <div class="skeleton skeleton-meaning"></div>
        <div class="skeleton-actions">
          <div class="skeleton skeleton-action-btn"></div>
          <div class="skeleton skeleton-action-btn"></div>
        </div>
      </div>
    `;
  },

  createListItem(): string {
    return `
      <div class="skeleton-list-item">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text" style="width:60%"></div>
          <div class="skeleton skeleton-text" style="width:80%"></div>
        </div>
      </div>
    `;
  },

  createList(count: number = 5): string {
    return `<div class="skeleton-list">${Array(count).fill(this.createListItem()).join('')}</div>`;
  },

  _originalContent: {} as Record<string, string>,

  showInElement(elementId: string, skeletonHtml: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      if (!el.hasAttribute('aria-busy') && !this._originalContent[elementId]) {
        this._originalContent[elementId] = el.innerHTML;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(skeletonHtml, 'text/html');
      el.replaceChildren(...Array.from(doc.body.childNodes));
      el.setAttribute('aria-busy', 'true');
    }
  },

  hide(elementId: string): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.removeAttribute('aria-busy');
      if (this._originalContent[elementId]) {
        setHtml(el, this._originalContent[elementId]);
        delete this._originalContent[elementId];
      }
    }
  },

  showWordCardLoading(elementId: string = 'study-card'): void {
    this.showInElement(elementId, this.createWordCard());
  },

  showListLoading(elementId: string, count: number = 6): void {
    this.showInElement(elementId, this.createList(count));
  },
};
