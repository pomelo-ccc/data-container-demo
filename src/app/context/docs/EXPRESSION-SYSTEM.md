# 表达式系统设计文档

> 用于低代码/配置化场景的动态表达式引擎

---

## 目录

1. [概述](#概述)
2. [表达式语法](#表达式语法)
3. [内置函数与对象](#内置函数与对象)
4. [内置管道](#内置管道)
5. [安全机制](#安全机制)
6. [已知风险与待讨论项](#已知风险与待讨论项)
7. [扩展建议](#扩展建议)

---

## 概述

表达式系统是上下文模块的核心能力，用于在配置/模板中动态计算值。

### 设计目标

- **简洁**：`$var` 语法，无需额外包裹，学习成本低
- **安全**：沙箱隔离，防止恶意代码执行
- **响应式**：与 Angular Signals 集成，数据变化自动更新
- **可扩展**：支持自定义管道和函数

### 基本用法

```typescript
// 简单求值
ctx.evalExpression('$name')                    // => 'Tom'
ctx.evalExpression('$a + $b')                  // => 3
ctx.evalExpression('$price * $quantity')       // => 200

// 响应式 Signal
const sig = ctx.createExpressionSignal('$count * 2')
sig()  // => 自动响应 count 变化
```

---

## 表达式语法

### 语法规则

| 语法 | 说明 | 示例 |
|------|------|------|
| `$var` | 访问变量 | `$name` → "Tom" |
| `$obj.prop` | 属性访问 | `$user.profile.name` |
| `$arr[index]` | 数组访问 | `$items[0]` |
| `$obj["key"]` | 动态属性 | `$obj["special-key"]` |

### 运算符

| 分类 | 运算符 | 示例 |
|------|--------|------|
| **算术** | `+ - * / %` | `$a + $b`, `$price * 0.9` |
| **比较** | `> < >= <= === !==` | `$age >= 18` |
| **逻辑** | `&& \|\| !` | `$a && $b`, `!$flag` |
| **三元** | `? :` | `$flag ? "yes" : "no"` |
| **可选链** | `?.` | `$user?.address?.city` |
| **空值合并** | `??` | `$value ?? "default"` |

### 完整示例

```typescript
// 变量访问
'$name'                              // => "Tom"
'$user.profile.age'                  // => 25
'$items[0].name'                     // => "Apple"

// 算术运算
'$a + $b'                            // => 15
'$price * $quantity'                 // => 200
'$total / $count'                    // => 平均值

// 比较运算
'$age >= 18'                         // => true/false
'$status === "active"'               // => true/false

// 逻辑运算
'$isAdmin && $isActive'              // => 与
'$hasPermA || $hasPermB'             // => 或
'!$disabled'                         // => 非

// 三元表达式
'$score >= 60 ? "及格" : "不及格"'    // => 条件判断
'$gender === "M" ? "先生" : "女士"'

// 可选链（安全访问）
'$user?.address?.city'               // => 避免空指针
'$data?.items?.[0]?.name'

// 空值合并
'$nickname ?? $name ?? "匿名"'       // => 取第一个非空值

// 复杂表达式
'$items.filter(x => x.price > 100).length'
'$list.map(x => x.name).join(", ")'
'$total > 0 ? $success / $total * 100 : 0'
```

### 特殊作用域

| 变量 | 说明 | 示例 |
|------|------|------|
| `$parent` | 访问父组件数据 | `$parent.formData` |
| `$named` | 按ID访问命名组件 | `$named["form-1"].values` |
| `$root` | 访问根组件数据 | `$root.globalConfig` |

### 字符串模板（可选支持）

当需要混合文本和表达式时：

```typescript
// 方案A：字符串拼接
'"Hello, " + $name + "!"'            // => "Hello, Tom!"

// 方案B：模板语法（待讨论是否支持）
'`Hello, ${name}!`'                  // => "Hello, Tom!"
```

---

## 内置函数与对象

### 当前白名单

| 分类 | 对象/函数 | 可用方法 |
|------|----------|----------|
| **数学** | `Math` | `floor`, `ceil`, `round`, `abs`, `max`, `min`, `pow`, `sqrt`, `random` |
| **类型转换** | `Number` | `Number("123")` → 123 |
| | `String` | `String(123)` → "123" |
| | `Boolean` | `Boolean(1)` → true |
| | `parseInt` | `parseInt("42")` → 42 |
| | `parseFloat` | `parseFloat("3.14")` → 3.14 |
| **类型检查** | `isNaN` | `isNaN(NaN)` → true |
| | `isFinite` | `isFinite(100)` → true |
| **数组** | `Array` | 实例方法：`map`, `filter`, `reduce`, `find`, `includes`, `join`, `slice`, `length` |
| **JSON** | `JSON` | `stringify`, `parse` |
| **调试** | `console` | `log`, `warn`, `error` |
| **常量** | - | `undefined`, `null`, `true`, `false`, `NaN`, `Infinity` |

### 使用示例

```typescript
// Math
'Math.floor($price)'                        // => 取整
'Math.max($a, $b, $c)'                      // => 最大值
'Math.round($score * 100) / 100'            // => 保留两位小数

// 数组方法
'$items.filter(x => x.price > 0).length'    // => 正数个数
'$items.map(x => x.name).join(", ")'        // => "苹果, 香蕉, 橙子"
'$items.reduce((a, b) => a + b.price, 0)'   // => 总价

// JSON
'JSON.stringify($obj)'                      // => '{"a":1}'
```

### 未开放的对象（待讨论）

| 对象 | 风险等级 | 用途 | 建议 |
|------|----------|------|------|
| `Date` | 低 | 日期处理 | 建议开放 |
| `Object` | 中 | keys/values/entries | 可选择性开放 |
| `RegExp` | 中 | 正则匹配 | 需评估 ReDoS 风险 |
| `Promise` | 高 | 异步操作 | 不建议开放 |
| `fetch` | 高 | 网络请求 | 禁止 |

---

## 内置管道

### 语法

```
表达式 | 管道名(参数)
```

### 当前管道列表

| 管道 | 语法 | 说明 | 示例 |
|------|------|------|------|
| `default` | `\| default(fallback)` | 空值时返回默认值 | `$name \| default("匿名")` |
| `json` | `\| json` 或 `\| json(space)` | 转 JSON 字符串 | `$obj \| json(2)` |
| `number` | `\| number` | 转数字 | `$str \| number` |
| `string` | `\| string` | 转字符串 | `$val \| string` |
| `upper` | `\| upper` | 转大写 | `$name \| upper` |
| `lower` | `\| lower` | 转小写 | `$name \| lower` |
| `trim` | `\| trim` | 去首尾空格 | `$input \| trim` |
| `slice` | `\| slice(start, end)` | 截取字符串 | `$text \| slice(0, 10)` |

### 管道特性

```typescript
// 链式调用
'$name | trim | upper'                      // 先去空格，再转大写

// 动态参数
'$text | slice(0, $maxLen)'                 // 参数可以是变量

// 表达式参数
'$text | slice($offset, $offset + 5)'       // 参数可以是表达式

// 自定义管道
ctx.evalExpression('$price', {
  pipeRegistry: {
    currency: (val, symbol = '¥') => `${symbol}${val.toFixed(2)}`
  },
  pipes: ['currency("$")']
})  // => "$99.00"

// 函数式管道
ctx.evalExpression('$items', {
  pipes: [
    arr => arr.filter(x => x > 0),
    arr => arr.reduce((a, b) => a + b, 0)
  ]
})
```

### 待扩展管道（建议）

| 管道 | 语法 | 说明 |
|------|------|------|
| `date` | `\| date("YYYY-MM-DD")` | 日期格式化 |
| `currency` | `\| currency("CNY")` | 货币格式化 |
| `percent` | `\| percent(2)` | 百分比格式化 |
| `join` | `\| join(",")` | 数组转字符串 |
| `split` | `\| split(",")` | 字符串转数组 |
| `keys` | `\| keys` | 获取对象键 |
| `values` | `\| values` | 获取对象值 |
| `length` | `\| length` | 获取长度 |
| `first` | `\| first` | 获取第一个元素 |
| `last` | `\| last` | 获取最后一个元素 |
| `sort` | `\| sort` | 排序 |
| `reverse` | `\| reverse` | 反转 |
| `unique` | `\| unique` | 去重 |
| `pluck` | `\| pluck("name")` | 提取属性 |
| `where` | `\| where("age", ">", 18)` | 条件过滤 |

---

## 安全机制

### 当前实现

```
┌─────────────────────────────────────────────────────┐
│                    表达式输入                        │
│                   '$user.name'                      │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                  解析 & 提取变量                     │
│              variables: ['user.name']               │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                   创建沙箱环境                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Proxy 拦截器                                  │  │
│  │  - has(): 始终返回 true（阻止全局访问）        │  │
│  │  - get(): 检查黑名单，返回白名单内容           │  │
│  │  - set(): 只允许修改已存在的上下文属性         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│              with (sandbox) { ... }                 │
│                   执行表达式                         │
└─────────────────────┬───────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────────┐
│                   返回结果                           │
└─────────────────────────────────────────────────────┘
```

### 黑名单（禁止访问）

```typescript
const dangerous = [
  // 全局对象
  'window', 'document', 'globalThis', 'global', 'self', 'top', 'parent', 'frames',
  
  // 代码执行
  'eval', 'Function', 'constructor', 'prototype', '__proto__',
  
  // Node.js
  'process', 'require', 'module', 'exports',
  
  // 网络
  'fetch', 'XMLHttpRequest', 'WebSocket',
  
  // 存储
  'localStorage', 'sessionStorage', 'indexedDB',
  
  // 弹窗
  'alert', 'confirm', 'prompt',
  
  // 定时器
  'setTimeout', 'setInterval', 'setImmediate',
  
  // 其他
  'importScripts', 'postMessage'
];
```

---

## 已知风险与待讨论项

### 已发现的安全风险

| 风险 | 严重程度 | 描述 | 攻击示例 |
|------|----------|------|----------|
| **原型链污染** | 🔴 高 | 可通过 `__proto__` 修改全局原型 | `{}.__proto__.polluted = true` |
| **constructor攻击** | 🔴 高 | 可通过字符串constructor获取Function | `"".constructor.constructor("alert(1)")()` |
| **this逃逸** | 🟡 中 | 函数中的this可能指向window | `(function(){ return this; })()` |
| **管道异常** | 🟡 中 | 自定义管道异常会向上抛出 | 管道内 throw Error |

### 修复建议

#### 1. 原型链污染防护

```typescript
// 方案A：在黑名单检查中增加深度检查
function isDangerous(name: string): boolean {
  if (name.includes('__proto__')) return true;
  if (name.includes('constructor')) return true;
  if (name.includes('prototype')) return true;
  // ...
}

// 方案B：冻结原型
Object.freeze(Object.prototype);  // 可能影响其他代码
```

#### 2. constructor攻击防护

```typescript
// 在 Proxy get 中拦截 constructor 访问
get(target, prop) {
  if (prop === 'constructor') return undefined;
  // ...
}
```

#### 3. this逃逸防护

```typescript
// 方案A：使用严格模式
const fn = new Function('sandbox', `
  "use strict";
  with (sandbox) {
    return (${code});
  }
`);

// 方案B：绑定this为null或沙箱
fn.call(null, sandbox);
```

#### 4. 管道异常处理

```typescript
// 在管道执行时添加 try-catch
const applyCall = (name: string, args: any[]) => {
  const fn = registry[name];
  if (!fn) return result;
  try {
    result = fn(result, ...(args ?? []));
  } catch (e) {
    console.warn(`Pipe "${name}" error:`, e);
    // 返回原值或 undefined
  }
  return result;
};
```

---

## 扩展建议

### 1. 语法扩展

| 建议 | 优先级 | 说明 |
|------|--------|------|
| 支持 `Date` 对象 | 高 | 日期处理是常见需求 |
| 支持 `Object.keys/values` | 中 | 对象遍历常用 |
| 支持解构语法 | 低 | `({ name }) => name` |
| 支持 async/await | 低 | 异步表达式，复杂度高 |

### 2. 安全加固

| 建议 | 优先级 | 说明 |
|------|--------|------|
| 修复原型链污染 | 🔴 高 | 生产环境必须修复 |
| 修复constructor攻击 | 🔴 高 | 生产环境必须修复 |
| 添加只读模式 | 中 | 禁止表达式修改数据 |
| 表达式长度限制 | 中 | 防止 ReDoS |
| 执行超时机制 | 低 | 防止死循环 |

### 3. 管道扩展

| 建议 | 优先级 | 说明 |
|------|--------|------|
| 日期格式化 `date` | 高 | 依赖 date-fns 或 dayjs |
| 数字格式化 `number` | 高 | 千分位、小数位 |
| 货币格式化 `currency` | 中 | 多币种支持 |
| 数组操作 `pluck/where` | 中 | 简化数组处理 |
| 条件管道 `if` | 低 | `\| if(condition, then, else)` |

### 4. 开发体验

| 建议 | 优先级 | 说明 |
|------|--------|------|
| 表达式语法高亮 | 中 | VSCode 插件 |
| 表达式自动补全 | 中 | 基于上下文数据 |
| 表达式调试工具 | 低 | 查看求值过程 |
| 表达式性能分析 | 低 | 识别慢表达式 |

---

## 讨论议题

### 议题1：语法风格

**当前方案**：`$var` 直接访问变量，运算符直接写

```typescript
'$a + $b'                    // 加法
'$price * $quantity'         // 乘法
'$age >= 18 ? "成年" : "未成年"'  // 三元
```

**备选方案**：是否需要支持模板字符串混合文本？

```typescript
// 方案A：纯表达式，字符串用拼接
'"总价: " + $total + "元"'

// 方案B：支持模板语法
'`总价: ${total}元`'
```

### 议题2：安全性 vs 功能性

- 是否需要更严格的沙箱（如 iframe sandbox）？
- 是否接受当前的安全风险，还是必须修复？
- 用户可自定义表达式的场景下，如何平衡？

### 议题3：内置函数范围

- 是否开放 `Date` 对象？
- 是否开放 `Object.keys/values/entries`？
- 是否需要自定义全局函数注册机制？

### 议题4：管道扩展策略

- 内置管道应该包含哪些？
- 是否需要支持异步管道？
- 管道命名规范（驼峰 vs 短横线）？

### 议题5：表达式副作用

- 是否允许表达式修改数据（如 `$count++`）？
- 是否需要只读模式选项？
- 副作用的调试和追踪？

---

## 附录

### A. 语法对比

| 场景 | 新语法 | 旧语法 |
|------|--------|--------|
| 变量访问 | `$name` | `${name}` |
| 属性访问 | `$user.name` | `${user.name}` |
| 算术运算 | `$a + $b` | `${a + b}` |
| 三元表达式 | `$flag ? "a" : "b"` | `${flag ? "a" : "b"}` |
| 管道 | `$name \| upper` | `${name} \| upper` |

### B. 测试覆盖

当前测试套件包含 281 个测试用例，覆盖：

- 表达式求值准确性（45个）
- 数据继承准确性（25个）
- 追踪模式（15个）
- 响应式性能（20个）
- 内存安全（18个）
- API易用性（30个）
- 边界情况（40个）
- 注册表和事件（20个）
- 集成测试（20个）
- 高级安全性（68个）

### C. 性能基准

| 操作 | 性能 |
|------|------|
| 简单表达式求值 (1000次) | ~2-4ms |
| 复杂表达式求值 (1000次) | ~5-6ms |
| 管道表达式求值 (1000次) | ~5-7ms |
| 创建 100 个 Signal | ~0.1ms |

### D. 相关文件

```
src/app/context/
├── utils/
│   └── expression-utils.ts      # 表达式求值核心
├── component-context/
│   └── expression.ts            # 表达式 Signal 集成
├── __tests__/
│   ├── expression-accuracy.spec.ts
│   ├── advanced-security.spec.ts
│   └── ...
└── docs/
    └── EXPRESSION-SYSTEM.md     # 本文档
```
