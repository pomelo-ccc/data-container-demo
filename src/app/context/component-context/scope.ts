import { computed, untracked } from '@angular/core';
import type { ScopeObj, TrackConfig } from '../types/context-types';
import { deepCloneJson } from '../utils/context-utils';
import { extractVariables, getRootKey } from '../utils/expression-utils';
import { ComponentContextState } from './state';

export abstract class ComponentContextScope extends ComponentContextState {
  setTrackConfig(config: Partial<TrackConfig>): void {
    this._trackConfig = { ...this._trackConfig, ...config };

    if (config.trackExpression) {
      this._trackedVariables = new Set(
        extractVariables(config.trackExpression).map(getRootKey)
      );
    }
  }

  getTrackConfig(): TrackConfig {
    return { ...this._trackConfig };
  }

  readonly localData = computed(() => {
    return Object.fromEntries(this._store().entries());
  });

  readonly parentData = computed<Record<string, any>>(() => {
    if (!this.parent) return {};

    const parentScope = this.parent.data();

    switch (this._trackConfig.mode) {
      case 'none':
        return this._parentDataSnapshot;

      case 'explicit': {
        const tracked: Record<string, any> = {};
        for (const key of this._trackedVariables) {
          if (key in parentScope) {
            tracked[key] = parentScope[key];
          }
        }
        return tracked;
      }

      case 'auto':
      default:
        return { ...parentScope };
    }
  });

  readonly data = computed<ScopeObj>(() => {
    const parentScope: ScopeObj | null = this._getTrackedParentScope();
    const localData = Object.fromEntries(this._store().entries());

    const scope: ScopeObj = parentScope
      ? Object.create(parentScope)
      : { $parent: null, $named: {} };

    Object.assign(scope, localData);

    scope.$parent = parentScope;

    const named: Record<string, ScopeObj> = parentScope?.$named
      ? { ...parentScope.$named }
      : {};
    named[this.id()] = scope as ScopeObj;

    scope.$named = named;

    return scope;
  });

  protected _getTrackedParentScope(): ScopeObj | null {
    if (!this.parent) return null;

    switch (this._trackConfig.mode) {
      case 'none':
        return this._createFrozenSnapshot();

      case 'explicit':
        return this._createFilteredParentScope();

      case 'auto':
      default:
        return this.parent.data() as ScopeObj;
    }
  }

  protected _createFrozenSnapshot(): ScopeObj | null {
    if (!this.parent) return null;

    if (Object.keys(this._parentDataSnapshot).length === 0) {
      this._parentDataSnapshot = untracked(() =>
        deepCloneJson(this.parent!.data())
      );
    }

    const snapshot = this._parentDataSnapshot as ScopeObj;
    snapshot.$parent = null;
    snapshot.$named = {};
    return snapshot;
  }

  protected _createFilteredParentScope(): ScopeObj | null {
    if (!this.parent) return null;

    const fullParentScope = this.parent.data();
    const filtered: ScopeObj = { $parent: null, $named: {} };

    for (const key of this._trackedVariables) {
      if (key in fullParentScope) {
        filtered[key] = fullParentScope[key];
      }
    }

    filtered.$parent = fullParentScope.$parent;
    filtered.$named = fullParentScope.$named;

    return filtered;
  }

  refreshParentSnapshot(): void {
    if (this.parent && this._trackConfig.mode === 'none') {
      this._parentDataSnapshot = untracked(() =>
        deepCloneJson(this.parent!.data())
      );
      this._store.set(new Map(this._store()));
    }
  }
}

