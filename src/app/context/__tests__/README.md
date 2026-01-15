# Context 模块测试套件

## 测试概览

本测试套件包含 **281 个测试用例**，覆盖上下文系统的各个方面。

## 运行测试

```bash
# 运行所有上下文测试
ng test --include='src/app/context/__tests__/*.spec.ts'

# 运行单个测试文件
ng test --include='src/app/context/__tests__/expression-accuracy.spec.ts'

# 无头模式运行（CI环境）
ng test --include='src/app/context/__tests__/*.spec.ts' --browsers=ChromeHeadless --watch=false
```

---

## 测试文件详细说明

### 1. expression-accuracy.spec.ts - 表达式求值准确性测试

测试表达式引擎的计算是否正确。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| 简单变量 | `${name}` 当 name='Tom' | 返回 'Tom' |
| 嵌套属性 | `${user.profile.name}` | 正确访问深层属性 |
| 数组访问 | `${items[0].name}` | 正确访问数组元素 |
| undefined处理 | `${notExist}` | 返回 undefined，不报错 |
| null处理 | `${nullValue}` | 返回 null |
| 布尔值 | `${flag}` | 返回 true/false |
| 数字 | `${count}` | 返回数字类型 |
| 算术运算 | `${a + b}`, `${a * b}` | 正确计算结果 |
| 比较运算 | `${a > b}`, `${a === 10}` | 返回布尔值 |
| 三元表达式 | `${flag ? "yes" : "no"}` | 根据条件返回 |
| 逻辑运算 | `${x && y}`, `${!x}` | 正确逻辑判断 |
| 字符串拼接 | `${firstName + " " + lastName}` | 拼接字符串 |
| 复杂表达式 | `${items.map(x => x * 2).join(",")}` | 支持数组方法 |
| 混合模板 | `Hello, ${name}!` | 文本和表达式混合 |
| default管道 | `${value} \| default("N/A")` | 空值时返回默认值 |
| json管道 | `${data} \| json` | 对象转JSON字符串 |
| 链式管道 | `${name} \| trim \| upper` | 多个管道依次处理 |
| Math函数 | `${Math.floor(a)}` | 支持Math方法 |
| Array方法 | `${arr.filter(x => x > 2)}` | 支持数组方法 |

---

### 2. data-inheritance.spec.ts - 数据继承准确性测试

测试父子组件之间的数据继承机制。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| 子访问父数据 | 子组件读取父组件的数据 | 能正确获取 |
| 孙访问祖先数据 | 孙组件读取父和祖父的数据 | 能正确获取 |
| 同名覆盖 | 子组件定义同名数据 | 子组件看到自己的值 |
| 独立存储 | 各组件有独立的数据存储 | hasData只检查本地 |
| 数据源追踪 | getDataSource('key') | 返回数据所在的组件 |
| 数据源深度 | getDataSourceInfo('key') | 返回深度信息 |
| $parent访问 | 通过$parent访问父级作用域 | 能访问父级数据 |
| $named访问 | 通过$named['id']访问命名组件 | 能访问指定组件 |
| 合并数据 | getMergedData() | 合并所有祖先数据 |
| 跨组件设置 | setDataAtId('id', 'key', value) | 设置指定组件的数据 |
| 按类型设置 | setDataAtType('form', 'key', value) | 设置指定类型组件的数据 |
| 获取父级 | getParent() | 返回父组件上下文 |
| 获取祖先链 | getAncestors() | 返回所有祖先 |
| 获取根 | getRoot() | 返回根组件 |
| 按类型查找 | findAncestor('form') | 找到指定类型的祖先 |
| 获取深度 | getDepth() | 返回组件层级深度 |
| 获取路径 | getPath() | 返回从根到当前的ID路径 |

---

### 3. track-mode.spec.ts - 追踪模式准确性测试

测试三种数据追踪模式的行为。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **Auto模式** | | |
| 默认模式 | 新组件的默认追踪模式 | 是 'auto' |
| 自动追踪 | 父数据变化时子组件表达式更新 | 自动更新 |
| 追踪所有变量 | 父组件的所有变量都被追踪 | 全部响应变化 |
| Signal更新 | createExpressionSignal响应父数据变化 | 自动更新 |
| **None模式** | | |
| 模式配置 | setTrackConfig({ mode: 'none' }) | 模式变为 'none' |
| 本地数据正常 | 本地数据的读写 | 正常工作 |
| 访问父数据 | 仍能访问父数据 | 可以访问 |
| **Explicit模式** | | |
| 模式配置 | 配置trackExpression | 只追踪指定变量 |
| 追踪指定变量 | 指定变量变化时更新 | 正确更新 |
| 修改追踪表达式 | 运行时修改trackExpression | 追踪新变量 |
| **模式切换** | | |
| auto转none | 运行时切换模式 | 模式正确切换 |
| none转auto | 运行时切换模式 | 恢复自动追踪 |

---

### 4. reactive-performance.spec.ts - 响应式更新性能测试

测试响应式系统的性能和精准更新能力。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **精准更新** | | |
| 只触发相关表达式 | 修改a，只有依赖a的表达式重算 | b、c的表达式不触发 |
| 不触发无关表达式 | 修改x多次，y的表达式不触发 | y计数不变 |
| 复合表达式 | `${a + b}` 修改a或b都触发 | 正确响应两个变量 |
| **批量更新** | | |
| setAllData效率 | 一次设置多个值 | 只触发少量更新 |
| replaceAllData效率 | 替换所有数据 | 只触发少量更新 |
| **表达式求值性能** | | |
| 简单表达式 | 1000次 `${value}` | < 100ms |
| 复杂表达式 | 1000次复杂模板 | < 500ms |
| 缓存效果 | 重复求值同一表达式 | 第二次更快 |
| **Signal创建性能** | | |
| 批量创建 | 创建100个Signal | < 50ms |
| 并发更新 | 50个Signal同时更新 | < 100ms |
| **管道性能** | | |
| 管道处理 | 1000次带管道的表达式 | < 200ms |

---

### 5. memory-safety.spec.ts - 内存安全测试

测试组件销毁后的资源清理。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **组件清理** | | |
| 创建时注册 | 组件创建后注册到registry | registry.has(id) = true |
| 销毁时注销 | 组件销毁后从registry移除 | registry.has(id) = false |
| 容器销毁 | 容器销毁时清理所有子组件 | 所有子组件注销 |
| **表达式缓存清理** | | |
| 依赖清理 | 组件销毁后清理表达式依赖 | 不影响其他组件 |
| Owner清理 | removeExpressionOwner正常工作 | 不报错 |
| **内存泄漏预防** | | |
| 重复创建销毁 | 50次创建/销毁循环 | registry大小回到初始值 |
| 快速创建销毁 | 100次快速操作 | 不报错 |
| 类型索引清理 | 销毁后类型索引更新 | getByType返回空 |
| **数据存储清理** | | |
| 数据清理 | 组件销毁后数据被清理 | 不影响其他组件 |
| 兄弟组件独立 | 销毁一个不影响兄弟 | 兄弟数据正常 |
| **事件订阅清理** | | |
| 订阅安全 | 组件销毁后发送事件 | 不报错 |
| **压力测试** | | |
| 大量组件 | 创建100个组件 | < 5000ms |
| 大量销毁 | 销毁100个组件 | < 1000ms |

---

### 6. api-usability.spec.ts - API易用性测试

测试各种API的使用是否方便正确。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **基础数据操作** | | |
| setData/getData | 设置和获取数据 | 正确存取 |
| hasData | 检查数据是否存在 | 返回布尔值 |
| deleteData | 删除数据 | 数据被移除 |
| getAllData | 获取所有数据 | 返回对象 |
| setAllData合并 | 默认合并模式 | 保留原有数据 |
| setAllData替换 | replace: true | 清空原有数据 |
| replaceAllData | 替换所有数据 | 清空原有数据 |
| **响应式选择器** | | |
| select() | 创建单字段选择器 | 返回Signal |
| derive() | 创建派生计算 | 返回计算Signal |
| lookupData | 查找数据（含继承） | 返回值 |
| lookupSignal | 创建查找Signal | 返回Signal |
| **表达式API** | | |
| evalExpression | 立即求值 | 返回结果 |
| createExpressionSignal | 创建响应式表达式 | 返回Signal |
| createExpressionSignals | 批量创建 | 返回Signal对象 |
| createExpressionOrStatic | 自动判断动态/静态 | 返回Signal |
| createExpressionSignalsFromSchema | 从schema创建 | 返回Signal对象 |
| 自定义管道 | pipeRegistry选项 | 支持自定义管道 |
| 外部Signal源 | sources选项 | 支持外部Signal |
| **依赖追踪** | | |
| getExpressionDependency | 获取表达式依赖 | 返回依赖信息 |
| getAllExpressionDependencies | 获取所有依赖 | 返回Map |
| clearExpressionDependency | 清除依赖 | 依赖被移除 |
| shouldRecalculateExpression | 检查是否需要重算 | 返回布尔值 |
| **上下文元数据** | | |
| id() | 获取组件ID | 返回字符串 |
| type() | 获取组件类型 | 返回字符串 |
| instance() | 获取组件实例 | 返回组件引用 |
| meta() | 获取元数据 | 返回元数据对象 |
| registered() | 获取注册状态 | 返回布尔值 |
| **ContextHost基类** | | |
| 自动注入 | 继承后自动获得ctx | ctx已定义 |
| 自动初始化 | ngOnInit自动初始化 | id和type正确 |
| **ContextExprPipe** | | |
| 模板中使用 | `{{ '\${x}' \| ctxExpr }}` | 正确渲染 |
| 数据更新 | 数据变化后模板更新 | 正确更新 |
| 非表达式值 | 传入非字符串 | 原样返回 |

---

### 7. edge-cases.spec.ts - 边界情况测试

测试各种边界条件和异常情况。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **空值处理** | | |
| 空字符串表达式 | evalExpression('') | 返回 '' |
| null表达式 | evalExpression(null) | 返回 null |
| undefined表达式 | evalExpression(undefined) | 返回 undefined |
| 空对象数据 | `${empty}` 当 empty={} | 返回 {} |
| 空数组数据 | `${arr.length}` 当 arr=[] | 返回 0 |
| NaN处理 | `${isNaN(nan)}` | 返回 true |
| Infinity处理 | `${inf > 1000000}` | 返回 true |
| **特殊字符** | | |
| 闭合大括号 | 数据中包含 } | 正确处理 |
| 对象字面量 | `${{ a: 1 }}` | 返回对象 |
| 引号 | `${obj["key"]}` | 正确访问 |
| 单引号 | `${'hello'}` | 返回字符串 |
| 反引号 | 数据中包含反引号 | 正确处理 |
| Unicode | 中文和emoji | 正确处理 |
| 换行符 | 数据中包含\n | 正确处理 |
| 正则特殊字符 | 数据中包含.*+? | 正确处理 |
| **深层嵌套** | | |
| 深层对象 | 5层嵌套对象访问 | 正确访问 |
| 深层数组 | 5层嵌套数组访问 | 正确访问 |
| 混合嵌套 | 对象和数组混合嵌套 | 正确访问 |
| 不存在的深层路径 | `${obj.a.b.c}` 当a不存在 | 返回 undefined |
| **类型转换** | | |
| 数字转字符串 | `Value: ${num}` | 正确拼接 |
| 布尔转字符串 | `Is: ${bool}` | 正确拼接 |
| 对象转字符串 | `Obj: ${obj}` | [object Object] |
| 数组转字符串 | `Arr: ${arr}` | 逗号分隔 |
| 保持类型 | 单表达式 `${num}` | 保持number类型 |
| **安全性** | | |
| 阻止window | `${window}` | 返回 undefined |
| 阻止document | `${document}` | 返回 undefined |
| 阻止eval | `${eval}` | 返回 undefined |
| 阻止Function | `${Function}` | 返回 undefined |
| 阻止fetch | `${fetch}` | 返回 undefined |
| 阻止localStorage | `${localStorage}` | 返回 undefined |
| 危险代码 | 尝试执行危险代码 | 不报错 |
| **错误处理** | | |
| 语法错误 | 无效的表达式语法 | 不抛异常 |
| 运行时错误 | 访问undefined的属性 | 不抛异常 |
| 除以零 | `${1 / zero}` | 返回 Infinity |
| 循环引用JSON | 循环引用对象转JSON | 不抛异常 |
| **并发操作** | | |
| 快速连续更新 | 100次快速setData | 最终值正确 |
| 多键快速更新 | 50个不同key快速设置 | 所有值正确 |
| 更新时求值 | 更新过程中读取Signal | 不报错 |
| **大数据** | | |
| 大数组 | 10000元素数组 | 正确处理 |
| 大对象 | 1000个属性对象 | 正确处理 |
| 长字符串 | 100000字符字符串 | 正确处理 |
| **表达式变体** | | |
| 空格 | `${  a  }` | 正确解析 |
| 纯文本 | 不含${}的字符串 | 原样返回 |
| **管道边界** | | |
| 空值default | undefined使用default | 返回默认值 |
| 空字符串default | ''使用default | 返回默认值 |
| 0不替换 | 0使用default | 返回0 |
| false不替换 | false使用default | 返回false |
| 未知管道 | 使用不存在的管道 | 不报错 |

---

### 8. registry-events.spec.ts - 注册表和事件通信测试

测试组件注册表和事件系统。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **组件注册** | | |
| 注册正确ID | 组件创建后注册 | has(id) = true |
| 按ID获取 | registry.get(id) | 返回组件上下文 |
| 按类型获取 | registry.getByType(type) | 返回数组 |
| 获取所有 | registry.getAll() | 返回所有组件 |
| 获取所有ID | registry.getAllIds() | 返回ID数组 |
| 获取数量 | registry.size | 返回正确数量 |
| 销毁时注销 | 组件销毁后 | has(id) = false |
| **事件通信** | | |
| 发送事件 | registry.emit(id, event, data) | 目标收到事件 |
| 广播事件 | registry.broadcast(event, data) | 所有组件收到 |
| 事件过滤 | registry.on$(event) | 只收到指定事件 |
| 事件时间戳 | 事件对象 | 包含timestamp |
| 通过ctx发送 | ctx.emit(id, event, data) | 目标收到事件 |
| **跨组件查询** | | |
| 通过ctx查询 | ctx.getComponent(id) | 返回组件上下文 |
| 按类型查询 | ctx.getComponentsByType(type) | 返回数组 |
| 查询不存在 | ctx.getComponent('not-exist') | 返回 undefined |
| **订阅管理** | | |
| 多订阅者 | 多个订阅同一事件 | 都能收到 |
| 取消订阅 | unsubscribe后 | 不再收到事件 |

---

### 9. integration.spec.ts - 集成测试

测试真实场景下的组件协作。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **表单联动场景** | | |
| 数据共享 | 表单容器和字段组件共享数据 | 字段能访问表单数据 |
| 验证状态 | 填写数据后验证状态更新 | isValid正确变化 |
| 提交按钮 | 表单无效时按钮禁用 | isDisabled正确 |
| 脏状态 | 修改字段后isDirty变化 | isDirty = true |
| **表格数据场景** | | |
| 汇总计算 | 计算所有行的总价 | totalPrice正确 |
| 行数统计 | 统计行数 | rowCount正确 |
| 数据更新 | 添加行后汇总更新 | 自动重算 |
| 选中追踪 | 选中行后selectedId更新 | 正确追踪 |
| **弹窗数据场景** | | |
| 访问页面数据 | 弹窗访问父页面数据 | 能正确访问 |
| 独立本地状态 | 弹窗有自己的状态 | 页面没有弹窗状态 |
| 更新父数据 | 弹窗保存时更新页面数据 | 页面数据更新 |
| 响应父变化 | 页面数据变化弹窗响应 | 弹窗看到新值 |
| **跨组件通信** | | |
| 事件通信 | 通过registry发送事件 | 正确接收 |
| 类型查询 | 按类型查询组件 | 返回正确组件 |

---

## 性能基准

基于测试运行结果：

| 操作 | 性能 |
|------|------|
| 简单表达式求值 (1000次) | ~2-4ms |
| 复杂表达式求值 (1000次) | ~5-6ms |
| 管道表达式求值 (1000次) | ~5-7ms |
| 创建 100 个 Signal | ~0.1ms |
| 创建 100 个组件 | ~2ms |
| 销毁 100 个组件 | ~0.5-4ms |

---

### 10. advanced-security.spec.ts - 高级安全性与边界测试 (新增)

测试原型链污染、沙箱逃逸、逻辑短路、循环依赖等高阶场景。

| 测试项 | 测试内容 | 预期结果 |
|--------|----------|----------|
| **原型链污染防护** | | |
| 阻止__proto__访问 | `${__proto__}` | 返回 undefined |
| 阻止通过对象访问__proto__ | `${obj.__proto__}` | 受限访问 |
| 阻止修改Object.prototype | `${{}.__proto__.x = 1}` | ⚠️ 当前存在风险 |
| 阻止constructor攻击 | `${str.constructor.constructor}` | 受限访问 |
| 阻止字符串constructor攻击 | `${"".constructor.constructor(...)}` | ⚠️ 当前存在风险 |
| **沙箱逃逸防护** | | |
| this指向检查 | `${(function(){ return this; })()}` | ⚠️ 可能指向window |
| 阻止globalThis | `${globalThis}` | 返回 undefined |
| 阻止self/top/parent/frames | 各种全局对象访问 | 返回 undefined |
| **危险API防护** | | |
| 阻止setTimeout/setInterval | `${setTimeout}` | 返回 undefined |
| 阻止XMLHttpRequest/WebSocket | 网络API访问 | 返回 undefined |
| 阻止alert/confirm/prompt | 弹窗API访问 | 返回 undefined |
| **Unicode欺骗防护** | | |
| 零宽字符处理 | 包含零宽空格的变量 | 正确处理 |
| 同形字符处理 | 西里尔字母vs拉丁字母 | 正确区分 |
| **逻辑与短路** | | |
| false && expr | 右侧不求值 | 返回 false |
| null && expr | 右侧不求值 | 返回 null |
| 0 && expr | 右侧不求值 | 返回 0 |
| **逻辑或短路** | | |
| true \|\| expr | 右侧不求值 | 返回 true |
| false \|\| expr | 右侧求值 | 返回右侧值 |
| **空值合并短路** | | |
| 0 ?? expr | 右侧不求值 | 返回 0 |
| null ?? expr | 右侧求值 | 返回右侧值 |
| **三元表达式短路** | | |
| true ? a : b | 只求值a | 返回 a |
| 嵌套三元 | 复杂条件 | 正确求值 |
| **可选链短路** | | |
| obj?.prop | obj为null时 | 返回 undefined |
| 深层可选链 | `${a?.b?.c?.d}` | 安全访问 |
| **Signal依赖** | | |
| 简单依赖链 | a -> b | 正确更新 |
| 多级依赖链 | a -> b -> c | 正确传播 |
| 菱形依赖 | D更新时A只更新一次 | Glitch-free |
| 外部Signal源 | sources选项 | 正确响应 |
| **derive计算** | | |
| 多字段derive | derive(['a','b'], fn) | 正确计算 |
| derive响应变化 | 数据变化时 | 自动重算 |
| **管道参数动态化** | | |
| 参数使用变量 | `${text} \| slice(start, end)` | 正确求值 |
| 参数变化时重算 | 参数Signal变化 | 自动更新 |
| **管道异常处理** | | |
| 管道抛出异常 | 自定义管道throw | ⚠️ 当前会抛出 |
| 参数类型错误 | 类型不匹配 | 不崩溃 |
| **自定义管道** | | |
| 注册自定义管道 | pipeRegistry选项 | 正确使用 |
| 覆盖内置管道 | 同名管道 | 使用自定义版本 |
| 函数式管道 | 直接传入函数 | 正确执行 |
| **表达式副作用** | | |
| 赋值操作 | `${count = 10}` | 修改数据 |
| 自增操作 | `${count++}` | 修改并返回原值 |

---

## 已知安全风险

以下是测试中发现的安全风险，建议在生产环境中加强防护：

| 风险 | 描述 | 建议 |
|------|------|------|
| 原型链污染 | 可通过 `__proto__` 修改 Object.prototype | 在沙箱中拦截所有 `__proto__` 访问 |
| constructor攻击 | 可通过字符串/数组的constructor获取Function | 拦截所有 constructor 属性访问 |
| this逃逸 | 函数中的this可能指向window | 使用严格模式或绑定this |
| 管道异常 | 自定义管道异常会向上抛出 | 在管道执行时添加try-catch |
