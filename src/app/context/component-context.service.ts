import { Injectable, Optional, SkipSelf, signal, inject, DestroyRef, computed } from '@angular/core';
import { ComponentContextData } from './component-context.interface';
import { ComponentRegistry } from './component-registry.service';

let contextIdCounter = 0;


export interface ScopeObj {
    $parent: ScopeObj | null;
    $named: Record<string, ScopeObj>;
    [key: string]: any;
}

/**
 * 数据作用域选项
 */
export interface DataScopeOptions {
    /** 是否继承父级数据 (默认 false) */
    inherit?: boolean;
    /** 是否向上冒泡变更 (默认 false) */
    bubble?: boolean;
}

/**
 * 组件上下文服务
 *
 * 每个组件在 providers 中提供独立实例
 * 支持层级数据作用域
 *
 * @example
 * ```typescript
 * // 设置本层数据
 * this.ctx.setData('users', userData);
 *
 * // 获取本层数据
 * const users = this.ctx.getData('users');
 *
 * // 向上查找数据 (从本层到根)
 * const config = this.ctx.lookupData('config');
 *
 * // 获取合并后的数据 (继承父级)
 * const merged = this.ctx.getMergedData();
 * ```
 */
@Injectable()
export class ComponentContext {
    private readonly _internalId = `ctx-${++contextIdCounter}`;
    private readonly _meta = signal<ComponentContextData | null>(null);
    private readonly _store = signal<Map<string, any>>(new Map());
    private readonly registry = inject(ComponentRegistry);
    private readonly destroyRef = inject(DestroyRef);

    readonly parent: ComponentContext | null;
    private _registered = false;

    constructor(@SkipSelf() @Optional() parent?: ComponentContext) {
        this.parent = parent ?? null;

        // 自动清理
        this.destroyRef.onDestroy(() => {
            if (this._registered) {
                this.registry.unregister(this.id());
                this._registered = false;
            }
            this._store().clear();
        });
    }

    // ===== 核心数据结构 (基于 Signal 的作用域链) =====

    /**
     * 统一的作用域数据对象
     * 包含:
     * 1. 自身数据 (Own Data)
     * 2. 原型链 (Prototype Chain) -> 实现向上查找
     * 3. $parent 指针 -> 显式访问父级
     * 4. $named 映射 -> 全局(链路上)命名空间访问
     */
    readonly data = computed<ScopeObj>(() => {
        const parentScope: ScopeObj | null = (this.parent?.data() as ScopeObj | null) ?? null;
        const localData = Object.fromEntries(this._store().entries());

        // 1. 创建原型链对象 (实现直接访问父级变量)
        // 如果有父级，则以父级 scope 为原型；否则为空对象
        const scope: ScopeObj = parentScope ? Object.create(parentScope) : { $parent: null, $named: {} };

        // 2. 写入自身数据 (覆盖父级同名变量)
        Object.assign(scope, localData);

        // 3. 设置相对路径指针 ($parent)
        scope.$parent = parentScope;

        // 4. 设置绝对路径映射 ($named Scopes)
        // 继承父级映射表
        const named: Record<string, ScopeObj> = parentScope?.$named ? { ...parentScope.$named } : {};
        // 注册当前节点 (ID -> Scope)
        named[this.id()] = scope as ScopeObj;

        scope.$named = named;

        return scope;
    });

    /**
     * 初始化（自动注册）
     */
    init(meta: ComponentContextData): void {
        this._meta.set(meta);
        if (!this._registered) {
            this.registry.register(this);
            this._registered = true;
        }
    }

    // ===== 元数据属性 (计算属性) =====
    readonly id = computed(() => this._meta()?.id ?? this._internalId);
    readonly type = computed(() => this._meta()?.type ?? 'unknown');
    readonly instance = computed(() => this._meta()?.instance);
    readonly meta = computed(() => this._meta());
    readonly registered = computed(() => this._registered);

    // ===== 层级导航 =====
    getParent(): ComponentContext | null { return this.parent; }

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
        let current: ComponentContext = this;
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

    /**
     * 获取层级深度 (根为 0)
     */
    getDepth(): number {
        let depth = 0;
        let current = this.parent;
        while (current) {
            depth++;
            current = current.parent;
        }
        return depth;
    }

    /**
     * 获取从根到当前的路径
     */
    getPath(): string[] {
        const path: string[] = [];
        let current: ComponentContext | null = this;
        while (current) {
            path.unshift(current.id());
            current = current.parent;
        }
        return path;
    }

    // ===== 跨组件访问 =====
    getComponent(id: string): ComponentContext | undefined {
        return this.registry.get(id);
    }

    getComponentsByType(type: string): ComponentContext[] {
        return this.registry.getByType(type);
    }

    emit<T = any>(targetId: string, event: string, data?: T): void {
        this.registry.emit(targetId, event, data);
    }

    // ===== 本层数据操作 =====

    /**
     * 设置本层数据
     */
    setData<T>(key: string, value: T): void {
        const store = this._store();
        store.set(key, value);
        // 触发信号更新
        this._store.set(new Map(store));
    }

    /**
     * 获取本层数据 (不向上查找)
     * - 仅访问当前组件的数据
     */
    getData<T>(key: string): T | undefined {
        return this._store().get(key) as T | undefined;
    }

    /**
     * 检查本层是否有数据
     */
    hasData(key: string): boolean {
        return this._store().has(key);
    }

    /**
     * 删除本层数据
     */
    deleteData(key: string): boolean {
        const store = this._store();
        const result = store.delete(key);
        this._store.set(new Map(store));
        return result;
    }

    /**
     * 获取本层所有数据
     */
    getAllData(): Record<string, any> {
        return Object.fromEntries(this._store());
    }

    /**
     * 批量设置数据
     */
    setAllData(data: Record<string, any>): void {
        const store = this._store();
        for (const [key, value] of Object.entries(data)) {
            store.set(key, value);
        }
        this._store.set(new Map(store));
    }

    // ===== 响应式数据 (Computed/Derived) =====

    /**
     * 获取响应式数据信号 (单个 key)
     *
     * @example
     * ```typescript
     * readonly users = this.ctx.select<User[]>('users');
     * // 在模板中使用: {{ users() | json }}
     * ```
     */
    select<T>(key: string) {
        return computed(() => this._store().get(key) as T | undefined);
    }

    /**
     * 创建派生计算属性
     *
     * @example
     * ```typescript
     * // 派生状态
     * readonly activeUsers = this.ctx.derive(
     *     ['users', 'filter'],
     *     (users, filter) => users.filter(u => u.status === filter)
     * );
     *
     * // 自定义计算
     * readonly total = this.ctx.derive(
     *     () => this.ctx.getData<Item[]>('items')?.reduce((s, i) => s + i.price, 0)
     * );
     * ```
     */
    derive<T>(
        depsOrFn: string[] | (() => T),
        computeFn?: (...args: any[]) => T
    ) {
        if (typeof depsOrFn === 'function') {
            return computed(depsOrFn);
        }

        return computed(() => {
            const values = depsOrFn.map(key => this._store().get(key));
            return computeFn!(...values);
        });
    }

    /**
     * 向上查找的响应式信号
     */
    lookupSignal<T>(key: string) {
        return computed(() => this.lookupData<T>(key));
    }

    /**
     * 合并数据的响应式信号
     */
    readonly mergedSignal = computed(() => this.getMergedData());

    // ===== 跨层数据操作 =====

    /**
     * 向上查找数据 (基于原型链 lookup)
     * - 可访问自身及所有父级数据
     */
    lookupData<T>(key: string): T | undefined {
        return this.data()[key];
    }

    /**
     * 【问题3解决】数据溯源：找到拥有该 key 的原始 Context
     * 
     * @example
     * ```typescript
     * // 获取 'status' 是哪个 context 定义的
     * const owner = this.ctx.getDataSource('status');
     * console.log(owner?.id(), owner?.type()); // 'page-1', 'page'
     * ```
     */
    getDataSource(key: string): ComponentContext | null {
        // 从当前层开始，向上查找第一个拥有该 key 的 context
        let current: ComponentContext | null = this;
        while (current) {
            if (current.hasData(key)) {
                return current;
            }
            current = current.parent;
        }
        return null;
    }

    /**
     * 【问题3解决】获取数据的详细来源信息
     * 
     * @example
     * ```typescript
     * const info = this.ctx.getDataSourceInfo('status');
     * // { value: 'draft', ownerId: 'page-1', ownerType: 'page', depth: 2 }
     * ```
     */
    getDataSourceInfo<T>(key: string): {
        value: T | undefined;
        ownerId: string | null;
        ownerType: string | null;
        depth: number;  // 距离当前 context 的层数 (0 = 自己)
    } {
        let current: ComponentContext | null = this;
        let depth = 0;
        while (current) {
            if (current.hasData(key)) {
                return {
                    value: current.getData<T>(key),
                    ownerId: current.id(),
                    ownerType: current.type(),
                    depth
                };
            }
            current = current.parent;
            depth++;
        }
        return { value: undefined, ownerId: null, ownerType: null, depth: -1 };
    }

    /**
     * 【问题1解决】在指定的 Context 上设置数据
     * 
     * @param key - 数据键
     * @param value - 数据值
     * @param target - 目标 context (可选，默认为数据原始 owner)
     * 
     * @example
     * ```typescript
     * // Form 修改 Page 的数据 (自动找到 owner)
     * this.ctx.setDataAt('status', 'published');
     * 
     * // 明确指定目标 context
     * this.ctx.setDataAt('status', 'published', pageCtx);
     * 
     * // 通过 ID 指定
     * this.ctx.setDataAt('status', 'published', this.ctx.getComponent('page-1'));
     * 
     * // 通过 $named 访问
     * const pageScope = this.ctx.data().$named['page-1'];
     * ```
     */
    setDataAt<T>(key: string, value: T, target?: ComponentContext): boolean {
        const targetCtx = target ?? this.getDataSource(key);
        if (targetCtx) {
            targetCtx.setData(key, value);
            return true;
        }
        // 如果没有找到 owner，则在当前层设置（新建）
        this.setData(key, value);
        return false;
    }

    /**
     * 通过类型查找祖先并设置数据
     * 
     * @example
     * ```typescript
     * // Form 在 Page 层设置数据
     * this.ctx.setDataAtType('page', 'formData', this.formValue);
     * ```
     */
    setDataAtType<T>(type: string, key: string, value: T): boolean {
        const target = this.findAncestor(type);
        if (target) {
            target.setData(key, value);
            return true;
        }
        return false;
    }

    /**
     * 通过 ID 查找 Context 并设置数据
     * 
     * @example
     * ```typescript
     * // Form 修改指定 Page 的数据
     * this.ctx.setDataAtId('page-main', 'status', 'published');
     * ```
     */
    setDataAtId<T>(id: string, key: string, value: T): boolean {
        const target = this.getComponent(id);
        if (target) {
            target.setData(key, value);
            return true;
        }
        return false;
    }

    /**
     * 【问题2解决】创建向上查找的响应式 Signal
     * 
     * 当任意祖先的数据变化时，信号会自动更新
     * 子组件只需在模板/effect/computed 中使用此信号即可自动响应变化
     * 
     * @example
     * ```typescript
     * // 在子组件中
     * readonly pageStatus = this.ctx.selectLookup<string>('status');
     * 
     * // 模板中使用 (自动响应 Page 的 status 变化)
     * // <div [class.disabled]="pageStatus() === 'locked'">
     * 
     * // 或在 effect 中
     * effect(() => {
     *     console.log('Status changed:', this.pageStatus());
     * });
     * ```
     */
    selectLookup<T>(key: string) {
        // 因为 this.data() 是 computed，依赖于所有祖先的 _store
        // 任何祖先数据变化都会触发 data() 重新计算
        return computed(() => this.data()[key] as T | undefined);
    }

    /**
     * 【问题2解决】创建带溯源信息的响应式 Signal
     * 
     * @example
     * ```typescript
     * readonly statusInfo = this.ctx.selectLookupWithSource<string>('status');
     * 
     * // 使用
     * const { value, ownerId } = this.statusInfo();
     * ```
     */
    selectLookupWithSource<T>(key: string) {
        return computed(() => this.getDataSourceInfo<T>(key));
    }

    /**
     * 向下广播数据到指定类型的子组件
     */
    broadcastData(key: string, value: any, targetType?: string): void {
        const targets = targetType
            ? this.registry.getByType(targetType)
            : this.registry.getAll();

        for (const target of targets) {
            if (this.isAncestorOf(target)) {
                target.setData(key, value);
            }
        }
    }

    /**
     * 检查当前 context 是否为目标的祖先
     */
    private isAncestorOf(target: ComponentContext): boolean {
        let current = target.parent;
        while (current) {
            if (current === this) return true;
            current = current.parent;
        }
        return false;
    }

    /**
     * 获取合并后的数据 (从根到当前层层合并)
     */
    getMergedData(): Record<string, any> {
        const ancestors = this.getAncestors().reverse();
        const merged: Record<string, any> = {};

        for (const ancestor of ancestors) {
            Object.assign(merged, ancestor.getAllData());
        }
        Object.assign(merged, this.getAllData());

        return merged;
    }

    /**
     * 向根传递数据
     */
    setRootData<T>(key: string, value: T): void {
        this.getRoot().setData(key, value);
    }

    /**
     * 从根获取数据
     */
    getRootData<T>(key: string): T | undefined {
        return this.getRoot().getData<T>(key);
    }
}




let button = {}
// dpprender.data + 最近的 context.data

let toolbar = {}
// dpprender.data + 最近的 context.data

let page = {}
// dpprender.data + 最近的 context.data + 自身.data