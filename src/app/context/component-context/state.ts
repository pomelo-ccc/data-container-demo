import { signal, inject, DestroyRef, computed, Signal } from '@angular/core';
import type { ComponentContextData } from '../types/component-context.interface';
import { ComponentRegistry } from '../component-registry.service';
import type { ComponentContext } from '../component-context.service';
import type { ExpressionDependency, TrackConfig } from '../types/context-types';

let contextIdCounter = 0;

export abstract class ComponentContextState {
  protected readonly _internalId = `ctx-${++contextIdCounter}`;
  protected readonly _meta = signal<ComponentContextData | null>(null);
  protected readonly _store = signal<Map<string, any>>(new Map());
  protected readonly registry = inject(ComponentRegistry);
  protected readonly destroyRef = inject(DestroyRef);

  readonly parent: ComponentContext | null;
  protected _registered = false;

  protected _trackConfig: TrackConfig = { mode: 'auto' };
  protected _expressionDeps = new Map<string, ExpressionDependency>();
  protected _parentDataSnapshot: Record<string, any> = {};
  protected _trackedVariables = new Set<string>();
  protected _fieldSelectors = new Map<string, Signal<any>>();

  protected constructor(parent?: ComponentContext | null) {
    this.parent = parent ?? null;

    this.destroyRef.onDestroy(() => {
      if (this._registered) {
        this.registry.unregister(this.id());
        this._registered = false;
      }
      this._store().clear();
      this._expressionDeps.clear();
      this._fieldSelectors.clear();
    });
  }

  init(meta: ComponentContextData): void {
    this._meta.set(meta);
    if (!this._registered) {
      this.registry.register(this as unknown as ComponentContext);
      this._registered = true;
    }
  }

  readonly id = computed(() => this._meta()?.id ?? this._internalId);
  readonly type = computed(() => this._meta()?.type ?? 'unknown');
  readonly instance = computed(() => this._meta()?.instance);
  readonly meta = computed(() => this._meta());
  readonly registered = computed(() => this._registered);
}

