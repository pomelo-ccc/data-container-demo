import { computed, Signal } from '@angular/core';
import {
  evaluateExpression,
  extractVariables,
  getNestedValue,
  getRootKey,
} from '../utils/expression-utils';
import type { ExpressionDependency } from '../types/context-types';
import { ComponentContextStore } from './store';

export abstract class ComponentContextExpression extends ComponentContextStore {
  private readonly _expressionOwners = new Map<string, Set<string>>();

  setExpressionOwnerExpressions(ownerId: string, expressions: string[]): void {
    const normalized = (expressions ?? [])
      .filter((e) => typeof e === 'string')
      .map((e) => e.trim())
      .filter(Boolean);

    if (normalized.length === 0) {
      this._expressionOwners.delete(ownerId);
    } else {
      this._expressionOwners.set(ownerId, new Set(normalized));
    }

    this._reconcileExpressionCaches();
  }

  removeExpressionOwner(ownerId: string): void {
    if (this._expressionOwners.delete(ownerId)) {
      this._reconcileExpressionCaches();
    }
  }

  private _reconcileExpressionCaches(): void {
    if (this._expressionOwners.size === 0) {
      this._expressionDeps.clear();
      this._fieldSelectors.clear();
      return;
    }

    const activeExpressions = new Set<string>();
    for (const set of this._expressionOwners.values()) {
      for (const expr of set) activeExpressions.add(expr);
    }

    for (const expr of this._expressionDeps.keys()) {
      if (!activeExpressions.has(expr)) {
        this._expressionDeps.delete(expr);
      }
    }

    const activeRootKeys = new Set<string>();
    for (const expr of activeExpressions) {
      const variables = extractVariables(expr);
      for (const variable of variables) {
        activeRootKeys.add(getRootKey(variable));
      }
    }

    for (const key of this._fieldSelectors.keys()) {
      if (!activeRootKeys.has(key)) {
        this._fieldSelectors.delete(key);
      }
    }
  }

  evalExpression<T = any>(expression: string): T {
    if (!expression || typeof expression !== 'string') {
      return expression as T;
    }

    let dep = this._expressionDeps.get(expression);
    if (!dep) {
      dep = this._createExpressionDependency(expression);
      this._expressionDeps.set(expression, dep);
    }

    this._updateDependencySources(dep);

    const scopeData = this.data();
    const value = evaluateExpression(expression, scopeData);
    dep.lastValue = value;

    return value as T;
  }

  createExpressionSignal<T = any>(expression: string): Signal<T> {
    const variables = extractVariables(expression);

    if (variables.length === 0) {
      const staticValue = evaluateExpression(expression, {});
      return computed(() => staticValue as T);
    }

    const rootKeys = [...new Set(variables.map(getRootKey))];
    const selectors = rootKeys.map((key) =>
      this._getOrCreateFieldSelector(key)
    );

    return computed(() => {
      selectors.forEach((selector) => selector());
      const scopeData = this._buildScopeForExpression(variables);
      return evaluateExpression(expression, scopeData) as T;
    });
  }

  protected _getOrCreateFieldSelector(key: string): Signal<any> {
    let selector = this._fieldSelectors.get(key);
    if (!selector) {
      selector = computed(() => {
        const localValue = this._store().get(key);
        if (localValue !== undefined) {
          return localValue;
        }
        if (this.parent) {
          return this.parent._getFieldValueFromChain(key);
        }
        return undefined;
      });
      this._fieldSelectors.set(key, selector);
    }
    return selector;
  }

  _getFieldValueFromChain(key: string): any {
    const localValue = this._store().get(key);
    if (localValue !== undefined) {
      return localValue;
    }
    if (this.parent) {
      return this.parent._getFieldValueFromChain(key);
    }
    return undefined;
  }

  protected _buildScopeForExpression(variables: string[]): Record<string, any> {
    const rootKeys = [...new Set(variables.map(getRootKey))];
    const scope: Record<string, any> = {};
    const ctx = this;

    for (const key of rootKeys) {
      const selector = this._fieldSelectors.get(key);
      if (selector) {
        scope[key] = selector();
      }
    }

    const needsParent = variables.some((v) => v.startsWith('$parent'));
    const needsNamed = variables.some((v) => v.startsWith('$named'));

    if (needsParent && this.parent) {
      scope['$parent'] = this.parent.data();
    }
    if (needsNamed) {
      scope['$named'] = this.data()['$named'];
    }

    return new Proxy(scope, {
      set(target, prop, value) {
        const key = String(prop);
        target[key] = value;
        if (ctx.hasData(key)) {
          ctx.setData(key, value);
        }
        return true;
      },
    });
  }

  createExpressionSignals<T extends Record<string, string>>(
    expressions: T
  ): { [K in keyof T]: Signal<any> } {
    const result = {} as { [K in keyof T]: Signal<any> };
    for (const [key, expr] of Object.entries(expressions)) {
      result[key as keyof T] = this.createExpressionSignal(expr);
    }
    return result;
  }

  createExpressionSignalsFromSchema<TSchema extends Record<string, any>>(
    schema: TSchema,
    expressionKeys: (keyof TSchema)[]
  ): { [K in (typeof expressionKeys)[number]]?: Signal<any> } {
    const result: Record<string, Signal<any> | undefined> = {};

    for (const key of expressionKeys) {
      const expression = schema[key];
      if (typeof expression === 'string' && expression.includes('${')) {
        result[key as string] = this.createExpressionSignal(expression);
      } else {
        result[key as string] = undefined;
      }
    }

    return result as { [K in (typeof expressionKeys)[number]]?: Signal<any> };
  }

  createExpressionOrStatic<T = any>(
    expressionOrValue: string | T | undefined,
    defaultValue: T
  ): Signal<T> {
    if (expressionOrValue === undefined || expressionOrValue === null) {
      return computed(() => defaultValue);
    }

    if (
      typeof expressionOrValue === 'string' &&
      expressionOrValue.includes('${')
    ) {
      return this.createExpressionSignal<T>(expressionOrValue);
    }

    return computed(() => expressionOrValue as T);
  }

  getExpressionDependency(
    expression: string
  ): ExpressionDependency | undefined {
    return this._expressionDeps.get(expression);
  }

  getAllExpressionDependencies(): Map<string, ExpressionDependency> {
    return new Map(this._expressionDeps);
  }

  clearExpressionDependency(expression?: string): void {
    if (expression) {
      this._expressionDeps.delete(expression);
    } else {
      this._expressionDeps.clear();
    }
  }

  protected _createExpressionDependency(
    expression: string
  ): ExpressionDependency {
    const variables = extractVariables(expression);
    const sources = new Map<string, string>();

    for (const variable of variables) {
      const rootKey = getRootKey(variable);
      const source = this.getDataSource(rootKey);
      if (source) {
        sources.set(variable, source.id());
      }
    }

    return {
      expression,
      variables,
      sources,
      lastValue: undefined,
    };
  }

  protected _updateDependencySources(dep: ExpressionDependency): void {
    const localKeys = new Set(this._store().keys());

    for (const variable of dep.variables) {
      const rootKey = getRootKey(variable);

      if (localKeys.has(rootKey)) {
        const currentSource = dep.sources.get(variable);
        if (currentSource !== this.id()) {
          dep.sources.set(variable, this.id());
        }
      } else {
        const source = this.getDataSource(rootKey);
        if (source) {
          dep.sources.set(variable, source.id());
        }
      }
    }
  }

  shouldRecalculateExpression(expression: string): boolean {
    const dep = this._expressionDeps.get(expression);
    if (!dep) return true;

    const currentData = this.data();

    for (const variable of dep.variables) {
      getNestedValue(currentData, variable);
      const rootKey = getRootKey(variable);

      const source = this.getDataSource(rootKey);
      const cachedSource = dep.sources.get(variable);
      if (source?.id() !== cachedSource) {
        return true;
      }
    }

    const newValue = evaluateExpression(expression, currentData);
    return !Object.is(newValue, dep.lastValue);
  }
}
