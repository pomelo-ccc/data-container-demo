import { computed } from '@angular/core';
import type { ComponentContext } from '../component-context.service';
import { ComponentContextExpression } from './expression';

export abstract class ComponentContextRuntime extends ComponentContextExpression {
  getParent(): ComponentContext | null {
    return this.parent;
  }

  getAncestors(): ComponentContext[] {
    const ancestors: ComponentContext[] = [];
    let current = this.parent;
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    return ancestors;
  }

  getRoot(): ComponentContext {
    let current: ComponentContext = this as unknown as ComponentContext;
    while (current.parent) current = current.parent;
    return current;
  }

  findAncestor(type: string): ComponentContext | null {
    let current = this.parent;
    while (current) {
      if (current.type() === type) return current;
      current = current.parent;
    }
    return null;
  }

  getDepth(): number {
    let depth = 0;
    let current = this.parent;
    while (current) {
      depth++;
      current = current.parent;
    }
    return depth;
  }

  getPath(): string[] {
    const path: string[] = [];
    let current: ComponentContext | null = this as unknown as ComponentContext;
    while (current) {
      path.unshift(current.id());
      current = current.parent;
    }
    return path;
  }

  getComponent(id: string): ComponentContext | undefined {
    return this.registry.get(id);
  }

  getComponentsByType(type: string): ComponentContext[] {
    return this.registry.getByType(type);
  }

  emit<T = any>(targetId: string, event: string, data?: T): void {
    this.registry.emit(targetId, event, data);
  }

  readonly mergedSignal = computed(() => this.getMergedData());

  setDataAt<T>(key: string, value: T, target?: ComponentContext): boolean {
    const targetCtx = target ?? this.getDataSource(key);
    if (targetCtx) {
      targetCtx.setData(key, value);
      return true;
    }
    this.setData(key, value);
    return false;
  }

  setDataAtType<T>(type: string, key: string, value: T): boolean {
    const target = this.findAncestor(type);
    if (target) {
      target.setData(key, value);
      return true;
    }
    return false;
  }

  setDataAtId<T>(id: string, key: string, value: T): boolean {
    const target = this.getComponent(id);
    if (target) {
      target.setData(key, value);
      return true;
    }
    return false;
  }

  broadcastData(key: string, value: any, targetType?: string): void {
    const targets = targetType
      ? this.registry.getByType(targetType)
      : this.registry.getAll();

    for (const target of targets) {
      if (this._isAncestorOf(target)) {
        target.setData(key, value);
      }
    }
  }

  protected _isAncestorOf(target: ComponentContext): boolean {
    let current = target.parent;
    while (current) {
      if (current === (this as unknown as ComponentContext)) return true;
      current = current.parent;
    }
    return false;
  }

  getMergedData(): Record<string, any> {
    const ancestors = this.getAncestors().reverse();
    const merged: Record<string, any> = {};

    for (const ancestor of ancestors) {
      Object.assign(merged, ancestor.getAllData());
    }
    Object.assign(merged, this.getAllData());

    return merged;
  }

  setRootData<T>(key: string, value: T): void {
    this.getRoot().setData(key, value);
  }

  getRootData<T>(key: string): T | undefined {
    return this.getRoot().getData<T>(key);
  }
}

