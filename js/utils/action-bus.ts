import logger from './logger.js';

export type ActionHandler<T = any> = (payload: T) => void | Promise<void>;

export class ActionBus {
  private handlers: Map<string, Set<ActionHandler>> = new Map();

  public on<T = any>(actionName: string, handler: ActionHandler<T>): () => void {
    if (!this.handlers.has(actionName)) {
      this.handlers.set(actionName, new Set());
    }
    this.handlers.get(actionName)!.add(handler);

    return () => this.off(actionName, handler);
  }

  public off<T = any>(actionName: string, handler: ActionHandler<T>): void {
    this.handlers.get(actionName)?.delete(handler);
  }

  public async emit<T = any>(actionName: string, payload?: T): Promise<void> {
    const actionHandlers = this.handlers.get(actionName);
    if (!actionHandlers) return;

    for (const handler of Array.from(actionHandlers)) {
      try {
        await handler(payload);
      } catch (err) {
        logger.error(`[ActionBus] 执行动作 ${actionName} 异常:`, err);
      }
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}

export const actionBus = new ActionBus();

type DomActionHandler = (e: Event) => void;
const domHandlers = new Map<string, DomActionHandler>();

export function registerAction(name: string, handler: DomActionHandler): void {
  domHandlers.set(name, handler);
}

export function registerActions(map: Record<string, DomActionHandler>): void {
  for (const [name, handler] of Object.entries(map)) {
    domHandlers.set(name, handler);
  }
}

export function unregisterAction(name: string): void {
  domHandlers.delete(name);
}

export function getRegisteredActions(): string[] {
  return Array.from(domHandlers.keys());
}

export function setupGlobalEventDelegation(options: { debug?: boolean } = {}): void {
  const { debug = false } = options;
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    if (debug && target) {
      logger.info('[ActionBus] 点击了:', target.tagName, target.className, target.id);
    }

    const actionElement = target?.closest('[data-action]');
    if (!actionElement) return;

    const action = (actionElement as HTMLElement).dataset.action ?? '';
    const handler = domHandlers.get(action);

    if (debug) logger.info(`[ActionBus] 执行动作: ${action}`);

    if (typeof handler === 'function') {
      try {
        handler(e);
      } catch (err) {
        logger.error(`[ActionBus] 动作 "${action}" 执行失败:`, err);
      }
    } else {
      logger.error(`[ActionBus] 动作 "${action}" 没有对应的处理函数！`);
      if (debug) logger.info('[ActionBus] 已注册的动作:', getRegisteredActions());
    }
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    const target = e.target instanceof Element ? e.target : null;
    const actionElement = target?.closest('[data-action][role="button"]');
    if (!actionElement) return;

    e.preventDefault();
    (actionElement as HTMLElement).click();
  });

  logger.info(`[ActionBus] 事件委托系统已启用 (${domHandlers.size} 个处理器)`);
}

export default actionBus;
