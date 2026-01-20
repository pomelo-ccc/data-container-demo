import { computed, Signal } from '@angular/core';
import {
  evaluateExpression,
  extractVariables,
  getNestedValue,
  getRootKey,
} from '../utils/expression-utils';
import type { ExpressionDependency } from '../types/context-types';
import { ComponentContextStore } from './store';
import { deepMergeScope } from './scope-utils';

export type ExpressionPipeFn = (value: any, ...args: any[]) => any;

export type ExpressionPipeCall =
  | string
  | { name: string; args?: any[] | string }
  | ((value: any, scope: Record<string, any>) => any);

export interface CreateExpressionSignalOptions {
  sources?: Record<string, Signal<any>>;
  pipes?: ExpressionPipeCall[];
  pipeRegistry?: Record<string, ExpressionPipeFn>;
  /**
   * 额外的数据作用域数组（Signal），其属性优先级高于 Context 中的数据
   * 数组后面的元素优先级高于前面的元素
   */
  extraScopes?: Signal<Record<string, any>>[];
}

const defaultPipeRegistry: Record<string, ExpressionPipeFn> = {
  default: (value: any, fallback: any) => {
    return value === undefined || value === null || value === ''
      ? fallback
      : value;
  },
  json: (value: any, space?: number) => {
    try {
      return JSON.stringify(value, null, space ?? 0);
    } catch {
      return String(value);
    }
  },
  number: (value: any) => Number(value),
  string: (value: any) => String(value),
  upper: (value: any) => String(value).toUpperCase(),
  lower: (value: any) => String(value).toLowerCase(),
  trim: (value: any) => String(value).trim(),
  slice: (value: any, start?: number, end?: number) =>
    String(value).slice(start ?? 0, end),
};

function findTemplateExpressionEnd(input: string): number {
  if (!input.startsWith('${')) return -1;
  let i = 2;
  let depth = 1;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  while (i < input.length) {
    const ch = input[i];

    if (inSingle) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (inDouble) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '"') inDouble = false;
      i += 1;
      continue;
    }

    if (inBacktick) {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') {
        inBacktick = false;
        i += 1;
        continue;
      }
      if (ch === '$' && input[i + 1] === '{') {
        depth += 1;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      i += 1;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      i += 1;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
      i += 1;
      continue;
    }

    i += 1;
  }

  return -1;
}

function splitPipelineExpression(raw: string): {
  baseExpression: string;
  pipeTokens: string[];
} {
  const input = raw.trim();
  const end = findTemplateExpressionEnd(input);
  if (end < 0) return { baseExpression: raw, pipeTokens: [] };

  const baseExpression = input.slice(0, end + 1).trim();
  const rest = input.slice(end + 1).trim();
  if (!rest.startsWith('|')) return { baseExpression: raw, pipeTokens: [] };

  const pipePart = rest.slice(1);
  const tokens: string[] = [];

  let buf = '';
  let parenDepth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;

  for (let i = 0; i < pipePart.length; i++) {
    const ch = pipePart[i];

    if (inSingle) {
      buf += ch;
      if (ch === '\\') {
        if (i + 1 < pipePart.length) {
          buf += pipePart[i + 1];
          i += 1;
        }
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      buf += ch;
      if (ch === '\\') {
        if (i + 1 < pipePart.length) {
          buf += pipePart[i + 1];
          i += 1;
        }
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inBacktick) {
      buf += ch;
      if (ch === '\\') {
        if (i + 1 < pipePart.length) {
          buf += pipePart[i + 1];
          i += 1;
        }
        continue;
      }
      if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      buf += ch;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      buf += ch;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      buf += ch;
      continue;
    }

    if (ch === '(') {
      parenDepth += 1;
      buf += ch;
      continue;
    }
    if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      buf += ch;
      continue;
    }

    if (ch === '|' && parenDepth === 0) {
      const token = buf.trim();
      if (token) tokens.push(token);
      buf = '';
      continue;
    }

    buf += ch;
  }

  const last = buf.trim();
  if (last) tokens.push(last);

  return { baseExpression, pipeTokens: tokens };
}

function parsePipeToken(token: string): {
  name: string;
  argsExpression?: string;
} {
  const input = token.trim();
  if (!input) return { name: '' };

  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inSingle) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (inDouble) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === '"') inDouble = false;
      continue;
    }

    if (inBacktick) {
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (ch === '`') inBacktick = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inBacktick = true;
      continue;
    }

    if (ch === '(') {
      const name = input.slice(0, i).trim();
      const argsExpression = input.endsWith(')')
        ? input.slice(i + 1, -1).trim()
        : input.slice(i + 1).trim();
      return { name, argsExpression };
    }
  }

  return { name: input };
}

function extractVariablesFromExpression(expression: string): string[] {
  const { baseExpression, pipeTokens } = splitPipelineExpression(expression);
  const pipeCalls = pipeTokens.map(parsePipeToken).filter((p) => !!p.name);
  const vars = [
    ...extractVariables(baseExpression),
    ...pipeCalls.flatMap((p) =>
      p.argsExpression ? extractVariables('${' + p.argsExpression + '}') : []
    ),
  ];
  return [...new Set(vars)];
}

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
      const variables = extractVariablesFromExpression(expr);
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

  evalExpression<T = any>(
    expression: string,
    options?: CreateExpressionSignalOptions
  ): T {
    if (!expression || typeof expression !== 'string') {
      return expression as T;
    }

    let dep = this._expressionDeps.get(expression);
    if (!dep) {
      dep = this._createExpressionDependency(expression);
      this._expressionDeps.set(expression, dep);
    }

    this._updateDependencySources(dep);

    const { baseExpression, pipeTokens } = splitPipelineExpression(expression);
    const pipeCallsFromExpression = pipeTokens
      .map(parsePipeToken)
      .filter((p) => !!p.name);
    const optionPipes = options?.pipes ?? [];

    const variables = [
      ...extractVariables(baseExpression),
      ...pipeCallsFromExpression.flatMap((p) =>
        p.argsExpression ? extractVariables('${' + p.argsExpression + '}') : []
      ),
      ...optionPipes.flatMap((p) => {
        if (typeof p === 'function') return [];
        if (typeof p === 'string') {
          const parsed = parsePipeToken(p);
          return parsed.argsExpression
            ? extractVariables('${' + parsed.argsExpression + '}')
            : [];
        }
        if (typeof p?.args === 'string') {
          return extractVariables('${' + p.args + '}');
        }
        return [];
      }),
    ];

    const sourceSignals = options?.sources ?? {};
    const sourceKeys = new Set(Object.keys(sourceSignals));
    const rootKeys = [
      ...new Set(variables.map(getRootKey).filter((k) => !sourceKeys.has(k))),
    ];

    const selectors = rootKeys.map((key) =>
      this._getOrCreateFieldSelector(key)
    );
    selectors.forEach((selector) => selector());

    const scopeData =
      variables.length > 0
        ? this._buildScopeForExpression(variables, sourceSignals)
        : {};

    let value = evaluateExpression(baseExpression, scopeData);
    value = this._applyExpressionPipes(
      value,
      scopeData,
      pipeCallsFromExpression,
      optionPipes,
      options?.pipeRegistry
    );
    dep.lastValue = value;

    return value as T;
  }

  /**
   * 获取缓存的表达式信号。
   * 
   * 此方法会缓存创建的信号，适用于动态列表等场景：
   * - 模板插值：`{{ ctx.expr('${user.name}')() }}`
   * - 属性绑定：`[disabled]="ctx.expr('${isDisabled}')()"`
   * - *ngFor 循环：`{{ ctx.expr(item.labelExpr)() }}`
   * 
   * @param expression 表达式字符串
   * @returns 缓存的信号
   */
  private readonly _signalCache = new Map<string, Signal<any>>();

  expr<T = any>(expression: string): Signal<T> {
    if (!expression || typeof expression !== 'string') {
      return computed(() => expression as T);
    }

    let sig = this._signalCache.get(expression);
    if (!sig) {
      sig = this.createExpressionSignal<T>(expression);
      this._signalCache.set(expression, sig);
    }
    return sig as Signal<T>;
  }

  createExpressionSignal<T = any>(
    expression: string,
    options?: CreateExpressionSignalOptions
  ): Signal<T> {
    const { baseExpression, pipeTokens } = splitPipelineExpression(expression);

    const pipeCallsFromExpression: Array<{
      name: string;
      argsExpression?: string;
    }> = pipeTokens.map(parsePipeToken).filter((p) => !!p.name);

    const optionPipes = options?.pipes ?? [];

    const variables = [
      ...extractVariables(baseExpression),
      ...pipeCallsFromExpression.flatMap((p) =>
        p.argsExpression ? extractVariables('${' + p.argsExpression + '}') : []
      ),
      ...optionPipes.flatMap((p) => {
        if (typeof p === 'function') return [];
        if (typeof p === 'string') {
          const parsed = parsePipeToken(p);
          return parsed.argsExpression
            ? extractVariables('${' + parsed.argsExpression + '}')
            : [];
        }
        if (typeof p?.args === 'string') {
          return extractVariables('${' + p.args + '}');
        }
        return [];
      }),
    ];

    if (variables.length === 0) {
      const staticScope: Record<string, any> = {};
      let staticValue = evaluateExpression(baseExpression, staticScope);
      staticValue = this._applyExpressionPipes(
        staticValue,
        staticScope,
        pipeCallsFromExpression,
        optionPipes,
        options?.pipeRegistry
      );
      return computed(() => staticValue as T);
    }

    const sourceSignals = options?.sources ?? {};
    const sourceKeys = new Set(Object.keys(sourceSignals));

    const rootKeys = [
      ...new Set(variables.map(getRootKey).filter((k) => !sourceKeys.has(k))),
    ];

    // 记录新创建的 fieldSelector
    const newSelectors: string[] = [];
    const selectors = rootKeys.map((key) => {
      const existingSelector = this._fieldSelectors.get(key);
      if (!existingSelector) {
        newSelectors.push(key);
      }
      return this._getOrCreateFieldSelector(key);
    });

    if (newSelectors.length > 0) {
      console.log(
        `%c[Signal 创建] ${this.id()}`,
        'color: #52c41a; font-weight: bold',
        `\n  表达式: ${expression}\n  新建 fieldSelector: [${newSelectors.join(
          ', '
        )}]\n  当前 fieldSelectors 总数: ${this._fieldSelectors.size}`
      );
    }

    return computed(() => {
      selectors.forEach((selector) => selector());
      const baseScopeData = this._buildScopeForExpression(
        variables,
        sourceSignals
      );

      let finalScopeData = baseScopeData;

      // 合并 extraScopes 数据，优先级高于 scopeData
      // 数组顺序：后面的覆盖前面的
      // 注意：这里创建新对象 finalScopeData 以避免修改 baseScopeData (Proxy)，
      // 从而避免在 computed 中触发 Signal 写入 (NG0600 错误)
      if (options?.extraScopes?.length) {
        // 先浅拷贝 baseScopeData，这会得到一个普通对象，失去 Proxy 的自动写回功能，
        // 这在 extraScope 场景下是预期的行为（临时覆盖不应影响 Context）
        finalScopeData = { ...baseScopeData };

        options.extraScopes.forEach((scopeSignal) => {
          const extraData = scopeSignal();
          if (extraData && typeof extraData === 'object') {
            deepMergeScope(finalScopeData, extraData);
          }
        });
      }

      let value = evaluateExpression(baseExpression, finalScopeData);
      value = this._applyExpressionPipes(
        value,
        finalScopeData,
        pipeCallsFromExpression,
        optionPipes,
        options?.pipeRegistry
      );
      return value as T;
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

  protected _buildScopeForExpression(
    variables: string[],
    sources?: Record<string, Signal<any>>
  ): Record<string, any> {
    const rootKeys = [...new Set(variables.map(getRootKey))];
    const scope: Record<string, any> = {};
    const ctx = this;
    const sourceSignals = sources ?? {};
    const sourceKeys = new Set(Object.keys(sourceSignals));

    for (const key of rootKeys) {
      const source = sourceSignals[key];
      if (source) {
        scope[key] = source();
        continue;
      }
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
        if (!sourceKeys.has(key) && ctx.hasData(key)) {
          ctx.setData(key, value);
        }
        return true;
      },
    });
  }

  private _applyExpressionPipes(
    value: any,
    scope: Record<string, any>,
    pipeCallsFromExpression: Array<{ name: string; argsExpression?: string }>,
    optionPipes: ExpressionPipeCall[],
    pipeRegistry?: Record<string, ExpressionPipeFn>
  ): any {
    const registry = { ...defaultPipeRegistry, ...(pipeRegistry ?? {}) };
    let result = value;

    const applyCall = (name: string, args: any[]) => {
      const fn = registry[name];
      if (!fn) return result;
      result = fn(result, ...(args ?? []));
      return result;
    };

    for (const p of pipeCallsFromExpression) {
      const args = p.argsExpression
        ? (evaluateExpression('${[' + p.argsExpression + ']}', scope) as any[])
        : [];
      applyCall(p.name, args);
    }

    for (const p of optionPipes) {
      if (typeof p === 'function') {
        result = p(result, scope);
        continue;
      }

      if (typeof p === 'string') {
        const parsed = parsePipeToken(p);
        if (!parsed.name) continue;
        const args = parsed.argsExpression
          ? (evaluateExpression(
            '${[' + parsed.argsExpression + ']}',
            scope
          ) as any[])
          : [];
        applyCall(parsed.name, args);
        continue;
      }

      const name = p.name?.trim();
      if (!name) continue;

      const args =
        typeof p.args === 'string'
          ? (evaluateExpression('${[' + p.args + ']}', scope) as any[])
          : Array.isArray(p.args)
            ? p.args
            : [];

      applyCall(name, args);
    }

    return result;
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
    const variables = extractVariablesFromExpression(expression);
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

    const { baseExpression, pipeTokens } = splitPipelineExpression(expression);
    const pipeCallsFromExpression = pipeTokens
      .map(parsePipeToken)
      .filter((p) => !!p.name);
    let newValue = evaluateExpression(baseExpression, currentData);
    newValue = this._applyExpressionPipes(
      newValue,
      currentData,
      pipeCallsFromExpression,
      [],
      undefined
    );
    return !Object.is(newValue, dep.lastValue);
  }
}
