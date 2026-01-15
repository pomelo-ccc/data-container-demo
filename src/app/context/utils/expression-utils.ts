/**
 * 表达式求值工具函数
 *
 * 提供模板表达式的解析、求值和变量提取功能
 * 使用安全的沙箱环境执行表达式
 */

/**
 * 安全的表达式求值器
 * 支持 ${xxx} 格式的模板表达式
 *
 * @param expression - 表达式字符串
 * @param data - 数据上下文对象
 * @returns 求值结果
 *
 * @example
 * ```typescript
 * evaluateExpression('${name}', { name: 'Tom' }) // => 'Tom'
 * evaluateExpression('Hello, ${name}!', { name: 'Tom' }) // => 'Hello, Tom!'
 * evaluateExpression('${a + b}', { a: 1, b: 2 }) // => 3
 * evaluateExpression('${count++}', { count: 0 }) // => 0 (并修改 count)
 * ```
 */
export function evaluateExpression(
  expression: string,
  data: Record<string, any>
): any {
  if (!expression || typeof expression !== 'string') return expression;

  // 单个表达式：${xxx} 直接返回原始类型
  const singleMatch = expression.match(/^\$\{(.+)\}$/);
  if (singleMatch) {
    return safeEval(singleMatch[1].trim(), data);
  }

  // 多个表达式的字符串模板
  return expression.replace(/\$\{([^}]+)\}/g, (_, code) => {
    const value = safeEval(code.trim(), data);
    return value !== undefined ? String(value) : '';
  });
}

/**
 * 安全的表达式执行
 * 使用 Proxy 创建沙箱环境，限制访问范围
 */
function safeEval(code: string, context: Record<string, any>): any {
  // 创建安全的沙箱上下文
  const sandbox = createSandbox(context);

  try {
    // 使用 with 语句限制作用域到沙箱
    const fn = new Function(
      'sandbox',
      `
            with (sandbox) {
                return (${code});
            }
        `
    );
    return fn(sandbox);
  } catch (e) {
    // 执行失败时尝试简单路径访问
    return getNestedValue(context, code);
  }
}

/**
 * 创建沙箱环境
 * 使用 Proxy 拦截所有属性访问，只允许访问白名单内的内容
 */
function createSandbox(context: Record<string, any>): Record<string, any> {
  // 允许的安全函数和对象
  const allowedGlobals: Record<string, any> = {
    // 调试
    console,
    // 数学
    Math,
    // 类型转换
    Number,
    String,
    Boolean,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    // 数组方法
    Array,
    // JSON
    JSON,
    // 基础值
    undefined,
    null: null,
    true: true,
    false: false,
    NaN,
    Infinity,
    // 表达式计数器 (挂在 window 上的全局对象)
    __exprCount: (window as any).__exprCount,
  };

  // 合并上下文和允许的全局对象
  const merged = { ...allowedGlobals, ...context };

  // 使用 Proxy 拦截属性访问
  return new Proxy(merged, {
    has() {
      // 让 with 语句认为所有属性都存在于沙箱中
      // 这样可以阻止访问真正的全局对象
      return true;
    },
    get(target, prop) {
      if (prop === Symbol.unscopables) {
        return undefined;
      }

      const key = String(prop);

      // 阻止访问危险对象
      if (isDangerous(key)) {
        return undefined;
      }

      // 从合并的上下文中获取值
      if (key in target) {
        return target[key];
      }

      return undefined;
    },
    set(target, prop, value) {
      const key = String(prop);
      // 只允许修改上下文中已存在的属性
      if (key in context) {
        context[key] = value;
        target[key] = value;
        return true;
      }
      return false;
    },
  });
}

/**
 * 检查是否为危险的属性名
 */
function isDangerous(name: string): boolean {
  const dangerous = [
    'window',
    'document',
    'globalThis',
    'global',
    'eval',
    'Function',
    'constructor',
    'prototype',
    '__proto__',
    'process',
    'require',
    'module',
    'exports',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'alert',
    'confirm',
    'prompt',
    'setTimeout',
    'setInterval',
    'setImmediate',
    'importScripts',
    'postMessage',
    'postMessage',
  ];
  return dangerous.includes(name);
}

/**
 * 获取嵌套对象的值
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * 从表达式中提取变量名
 */
export function extractVariables(expression: string): string[] {
  if (!expression || typeof expression !== 'string') return [];

  const variables: string[] = [];
  const matches = expression.matchAll(/\$\{([^}]+)\}/g);

  for (const match of matches) {
    const code = match[1].trim();
    const identifiers = extractIdentifiers(code);
    variables.push(...identifiers);
  }

  // 去重，并过滤掉以 _ 开头的内部变量（如计数器）
  return [...new Set(variables)].filter((v) => !v.startsWith('_'));
}

/**
 * 从代码中提取标识符
 */
function extractIdentifiers(code: string): string[] {
  const identifierRegex =
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\b/g;
  const identifiers: string[] = [];

  const reserved = new Set([
    'true',
    'false',
    'null',
    'undefined',
    'NaN',
    'Infinity',
    'if',
    'else',
    'for',
    'while',
    'return',
    'function',
    'var',
    'let',
    'const',
    'new',
    'this',
    'typeof',
    'instanceof',
    'in',
    'of',
    'Math',
    'Date',
    'JSON',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'console',
  ]);

  let match;
  while ((match = identifierRegex.exec(code)) !== null) {
    const id = match[1];
    const rootId = id.split('.')[0];
    if (!reserved.has(rootId)) {
      identifiers.push(id);
    }
  }

  return identifiers;
}

/**
 * 获取变量的根键名
 */
export function getRootKey(variable: string): string {
  const dotIndex = variable.indexOf('.');
  return dotIndex > 0 ? variable.substring(0, dotIndex) : variable;
}

