import {
  Injectable,
  signal,
  computed,
  Signal,
  WritableSignal,
} from '@angular/core';

/**
 * Named Scopes 注册表类型
 * 存储整个链路上所有 Page 的引用，以 ID 为 Key
 */
export type NamedScopes = Record<string, ScopeService>;

/**
 * Scope 服务 - 管理数据容器的数据上下文
 *
 * 功能:
 * 1. 维护局部数据状态 (Signal)
 * 2. 支持父子 Scope 链接 (双向)
 * 3. 提供数据读写接口
 * 4. 支持向上冒泡写入
 * 5. 支持访问同级和子级 Scope
 * 6. 【新特性】$parent - 相对路径指针
 * 7. 【新特性】$named - 绝对路径映射 (Named Scopes)
 * 8. 【新特性】原型链继承 - 通过原型链直接访问父级变量
 */
@Injectable()
export class ScopeService {
  /** 父级 Scope 引用 ($parent) */
  private readonly _parent = signal<ScopeService | null>(null);

  /** 子级 Scope Map (ID -> ScopeService) */
  private readonly _children: Map<string, ScopeService> = new Map();

  /** Scope 标识 (必须设置，用于在 Parent 中索引和 $named 注册) */
  private _id: string = '';

  /** 本地数据存储 */
  private readonly _localData: WritableSignal<Record<string, any>> = signal({});

  /**
   * Named Scopes 注册表 ($named)
   * 存储整个链路上所有 Scope 的引用，以 ID 为 Key
   * 子 Scope 会继承父级的 $named 并添加自己
   */
  private readonly _namedScopes: WritableSignal<NamedScopes> = signal({});

  /**
   * 计算型 Signal: 使用原型链继承父级数据
   *
   * 实现方式:
   * - 使用 Object.create(parentData) 创建以父级数据为原型的对象
   * - 本地数据作为自身属性覆盖
   * - 访问时自动沿原型链向上查找
   */
    readonly data: Signal<Record<string, any>> = computed(() => {
        const parentData = this._parent()?.data() ?? null;
        const localData = this._localData();

        if (parentData) {
            return { ...parentData, ...localData };
        }

        return { ...localData };
    });

  /**
   * 获取 $named 注册表 (只读)
   * 包含整个链路上所有已注册的 Scope
   */
  get $named(): NamedScopes {
    return this._namedScopes();
  }

  /**
   * 获取 $parent 引用
   */
  get $parent(): ScopeService | null {
    return this._parent();
  }

  /**
   * 设置 Scope ID 并更新 $named 注册
   */
  setId(id: string): void {
    const oldId = this._id;

    // 如果已在 Parent 中注册，需要更新 key
    const currentParent = this._parent();
    if (currentParent && oldId) {
      currentParent._removeChild(this);
    }

    this._id = id;

    const newParent = this._parent();
    if (newParent && id) {
      newParent._addChild(this);
    }

    // 更新 $named 注册表
    this._updateNamedScopes();
  }

  /**
   * 获取 Scope ID
   */
  getId(): string {
    return this._id;
  }

  /**
   * 设置父级 Scope (建立双向链接，并同步 $named)
   */
  setParent(parent: ScopeService | null): void {
    // 从旧 Parent 移除
    const currentParent = this._parent();
    if (currentParent) {
      currentParent._removeChild(this);
    }

    this._parent.set(parent);

    // 向新 Parent 注册
    if (parent && this._id) {
      parent._addChild(this);
    }

    // 重新构建 $named 注册表
    this._updateNamedScopes();
  }

  /**
   * 更新 $named 注册表
   * 继承父级的 $named 并添加自己
   */
  private _updateNamedScopes(): void {
    const parentNamed = this._parent()?.$named ?? {};
    const currentNamed: NamedScopes = { ...parentNamed };

    if (this._id) {
      currentNamed[this._id] = this;
    }

    this._namedScopes.set(currentNamed);

    // 递归更新子级的 $named
    for (const child of this._children.values()) {
      child._updateNamedScopes();
    }
  }

  /**
   * 通过名称获取 Scope (使用 $named)
   * @param name Scope 的 ID
   */
  getScopeByName(name: string): ScopeService | null {
    return this.$named[name] ?? null;
  }

  /**
   * 获取父级 Scope
   */
  getParent(): ScopeService | null {
    return this._parent();
  }

  /**
   * 获取根级 Scope
   */
  getRoot(): ScopeService {
    let current: ScopeService = this;
    while (current._parent()) {
      current = current._parent()!;
    }
    return current;
  }

  /**
   * 按 ID 获取直接子级 Scope (O(1))
   */
  getChild(id: string): ScopeService | null {
    return this._children.get(id) ?? null;
  }

  /**
   * 获取所有子级 Scope
   */
  getChildren(): ScopeService[] {
    return Array.from(this._children.values());
  }

  /**
   * 获取子级 Scope 的 ID 列表
   */
  getChildIds(): string[] {
    return Array.from(this._children.keys());
  }

  /**
   * 获取同级 Scope (通过 Parent 的 Children 排除自己)
   */
  getSiblings(): ScopeService[] {
    const parent = this._parent();
    if (!parent) {
      return [];
    }
    return parent.getChildren().filter((child) => child._id !== this._id);
  }

  /**
   * 按 ID 查找子级 Scope (递归，深度优先)
   */
  findChildById(id: string): ScopeService | null {
    // 先在直接子级中查找 (O(1))
    const direct = this._children.get(id);
    if (direct) return direct;

    // 递归查找
    for (const child of this._children.values()) {
      const found = child.findChildById(id);
      if (found) return found;
    }
    return null;
  }

  /**
   * 按 ID 在整个树中查找 Scope
   */
  findById(id: string): ScopeService | null {
    const root = this.getRoot();
    if (root._id === id) return root;
    return root.findChildById(id);
  }

  /** 内部方法: 添加子 Scope */
  private _addChild(child: ScopeService): void {
    if (child._id) {
      this._children.set(child._id, child);
    }
  }

  /** 内部方法: 移除子 Scope */
  private _removeChild(child: ScopeService): void {
    if (child._id) {
      this._children.delete(child._id);
    }
  }

  /**
   * 设置单个值
   * @param key 键名
   * @param value 值
   * @param bubble 是否向上冒泡写入 (默认 false)
   */
  setValue(key: string, value: any, bubble: boolean = false): void {
    const parent = this._parent();
    if (bubble && parent) {
      parent.setValue(key, value, bubble);
    } else {
      this._localData.update((data) => ({ ...data, [key]: value }));
    }
  }

  /**
   * 获取单个值
   * @param key 键名
   * @param defaultValue 默认值
   */
  getValue<T = any>(key: string, defaultValue?: T): T {
    return this.data()[key] ?? defaultValue;
  }

  /**
   * 批量更新数据
   * @param newData 新数据对象
   */
  updateData(newData: Record<string, any>): void {
    this._localData.update((data) => ({ ...data, ...newData }));
  }

  /**
   * 重置本地数据
   */
  resetData(): void {
    this._localData.set({});
  }

  /**
   * 获取本地数据 (不包含父级)
   */
  getLocalData(): Record<string, any> {
    return this._localData();
  }

  /**
   * 评估表达式 (简化版)
   * 支持 ${key} 语法
   */
  evaluateExpression(expression: string): any {
    if (!expression) return true;

    const data = this.data();
    const safeData = new Proxy(data, {
      has: () => true,
      get: (target, prop) => {
        if (typeof prop === 'string') {
          return target[prop];
        }
        return undefined;
      },
    });

    const evalCode = (code: string): any => {
      return new Function('data', `with(data) { return (${code}); }`)(safeData);
    };

    const trimmed = expression.trim();
    const isSingleExpression =
      trimmed.startsWith('${') &&
      trimmed.endsWith('}') &&
      !trimmed.slice(2, -1).includes('${');

    if (isSingleExpression) {
      const code = trimmed.slice(2, -1).trim();
      try {
        return evalCode(code);
      } catch (error) {
        console.warn('Expression evaluation failed:', expression, error);
        return true;
      }
    }

    if (trimmed.includes('${')) {
      const withoutPlaceholders = trimmed.replace(/\$\{[^}]+\}/g, ' ');
      const looksLikeLogic =
        /(?:===|!==|==|!=|>=|<=|&&|\|\||[<>+\-*/%?:()])/.test(
          withoutPlaceholders
        );

      if (looksLikeLogic) {
        const code = trimmed.replace(/\$\{([^}]+)\}/g, (_, inner) => {
          const innerCode = String(inner).trim();
          return `((${innerCode}) ?? null)`;
        });
        try {
          return evalCode(code);
        } catch (error) {
          console.warn('Expression evaluation failed:', expression, error);
          return true;
        }
      }

      return expression.replace(/\$\{([^}]+)\}/g, (_, inner) => {
        try {
          const value = evalCode(String(inner).trim());
          return value ?? '';
        } catch {
          return '';
        }
      });
    }

    try {
      return evalCode(trimmed);
    } catch (error) {
      console.warn('Expression evaluation failed:', expression, error);
      return true;
    }
  }

  /** 组件实例注册表 */
  private readonly _components = new Map<string, any>();

  /**
   * 注册组件实例/API
   * @param id 组件 ID
   * @param api 组件暴露的 API 对象
   */
  registerComponent(id: string, api: any): void {
    this._components.set(id, api);
  }

  /**
   * 注销组件实例
   * @param id 组件 ID
   */
  unregisterComponent(id: string): void {
    this._components.delete(id);
  }

  /**
   * 获取组件实例 API
   * @param id 组件 ID
   */
  getComponent(id: string): any {
    if (this._components.has(id)) {
      return this._components.get(id);
    }
    // 向上查找
    return this._parent()?.getComponent(id) ?? null;
  }
}
