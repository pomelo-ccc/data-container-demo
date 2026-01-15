import { computed } from '@angular/core';
import type { ComponentContext } from '../component-context.service';
import { ComponentContextScope } from './scope';

export abstract class ComponentContextStore extends ComponentContextScope {
  setData<T>(key: string, value: T): void {
    const store = this._store();
    store.set(key, value);
    this._store.set(new Map(store));
  }

  getData<T>(key: string): T | undefined {
    return this._store().get(key) as T | undefined;
  }

  hasData(key: string): boolean {
    return this._store().has(key);
  }

  deleteData(key: string): boolean {
    const store = this._store();
    const result = store.delete(key);
    this._store.set(new Map(store));
    return result;
  }

  getAllData(): Record<string, any> {
    return Object.fromEntries(this._store());
  }

  setAllData(data: Record<string, any>, options?: { replace?: boolean }): void {
    if (options?.replace) {
      this._store.set(new Map(Object.entries(data)));
      return;
    }

    const store = this._store();
    for (const [key, value] of Object.entries(data)) {
      store.set(key, value);
    }
    this._store.set(new Map(store));
  }

  replaceAllData(data: Record<string, any>): void {
    this.setAllData(data, { replace: true });
  }

  select<T>(key: string) {
    return computed(() => this._store().get(key) as T | undefined);
  }

  derive<T>(depsOrFn: string[] | (() => T), computeFn?: (...args: any[]) => T) {
    if (typeof depsOrFn === 'function') {
      return computed(depsOrFn);
    }

    return computed(() => {
      const values = depsOrFn.map((key) => this._store().get(key));
      return computeFn!(...values);
    });
  }

  lookupData<T>(key: string): T | undefined {
    return this.data()[key];
  }

  lookupSignal<T>(key: string) {
    return computed(() => this.lookupData<T>(key));
  }

  getDataSource(key: string): ComponentContext | null {
    let current: ComponentContext | null = this as unknown as ComponentContext;
    while (current) {
      if (current.hasData(key)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  getDataSourceInfo<T>(key: string): {
    value: T | undefined;
    ownerId: string | null;
    ownerType: string | null;
    depth: number;
  } {
    let current: ComponentContext | null = this as unknown as ComponentContext;
    let depth = 0;
    while (current) {
      if (current.hasData(key)) {
        return {
          value: current.getData<T>(key),
          ownerId: current.id(),
          ownerType: current.type(),
          depth,
        };
      }
      current = current.parent;
      depth++;
    }
    return { value: undefined, ownerId: null, ownerType: null, depth: -1 };
  }

  selectLookup<T>(key: string) {
    return computed(() => this.data()[key] as T | undefined);
  }

  selectLookupWithSource<T>(key: string) {
    return computed(() => this.getDataSourceInfo<T>(key));
  }
}
