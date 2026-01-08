import { Injectable, inject, Injector } from '@angular/core';
import { RenderParam } from './interfaces/render-param.interface';
import { DialogRef } from './interfaces/dialog-ref.interface';
import { IActionStrategy, ActionContext, ActionResult } from './interfaces/strategy.interface';
import { DialogCoordinatorService } from './coordinator/dialog-coordinator.service';
import { ActionFactoryService } from './factory/action-factory.service';
import { ACTION_STRATEGY_REGISTRY, ActionStrategyEntry } from './strategies/strategy.registry';
import { ComponentContext } from '../context';

/**
 * 内置 Action 类型
 */
export type BuiltInActionType = 'modal' | 'drawer' | 'event' | 'external' | 'openBlank' | 'cover';

/**
 * Action 类型（可扩展）
 * 
 * 使用方式：
 * - 直接使用内置类型: 'modal' | 'drawer' | 'event' | 'external' | 'openBlank' | 'cover'
 * - 扩展自定义类型: type MyActionType = BuiltInActionType | 'custom';
 */
export type ActionType = BuiltInActionType;

/**
 * ActionHandle 服务
 * 
 * 统一入口（Facade），根据类型路由到不同的策略
 * 策略通过 DI 注入，支持扩展
 * 
 * @example
 * ```typescript
 * // 使用 handle 方法（根据 type 自动路由）
 * this.actionHandle.handle({
 *   type: 'modal',
 *   content: MyComponent,
 *   data: { id: 123 }
 * });
 * 
 * // 使用快捷方法
 * this.actionHandle.modal(MyComponent, { id: 123 });
 * this.actionHandle.drawer(DetailComponent);
 * 
 * // 添加自定义策略
 * // 在 providers 中：
 * providers: [
 *   MyCustomStrategy,
 *   { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'custom', strategy: MyCustomStrategy }, multi: true }
 * ]
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ActionHandleService {
    private readonly coordinator = inject(DialogCoordinatorService);
    private readonly factory = inject(ActionFactoryService);
    private readonly injector = inject(Injector);

    /** DI 注册的策略条目（编译时） */
    private readonly diEntries = inject(ACTION_STRATEGY_REGISTRY);

    /** 运行时注册的策略（Map: type -> instance） */
    private readonly runtimeStrategies = new Map<string, IActionStrategy>();

    /** 策略实例缓存（用于 DI 策略的懒加载） */
    private readonly strategyCache = new Map<string, IActionStrategy>();

    /**
     * 运行时注册策略
     * 
     * @example
     * ```typescript
     * this.actionHandle.registerStrategy('custom', new MyCustomStrategy());
     * ```
     */
    registerStrategy(type: string, strategy: IActionStrategy): void {
        this.runtimeStrategies.set(type, strategy);
    }

    /**
     * 取消注册策略
     */
    unregisterStrategy(type: string): boolean {
        return this.runtimeStrategies.delete(type);
    }

    /**
     * 获取策略实例
     * 优先级: 运行时注册 > DI 注册
     */
    private getStrategy(type: string): IActionStrategy | undefined {
        // 1. 先查运行时注册
        if (this.runtimeStrategies.has(type)) {
            return this.runtimeStrategies.get(type);
        }

        // 2. 再查缓存（DI 实例）
        if (this.strategyCache.has(type)) {
            return this.strategyCache.get(type);
        }

        // 3. 从 DI 注册条目中查找并实例化
        const entry = this.diEntries.find(e => e.type === type);
        if (entry) {
            const strategy = this.injector.get(entry.strategy);
            this.strategyCache.set(type, strategy);
            return strategy;
        }

        return undefined;
    }

    /**
     * 获取所有已注册的策略类型
     */
    getRegisteredTypes(): string[] {
        const diTypes = this.diEntries.map(e => e.type);
        const runtimeTypes = Array.from(this.runtimeStrategies.keys());
        return [...new Set([...diTypes, ...runtimeTypes])];
    }

    /**
     * 检查策略是否已注册
     */
    hasStrategy(type: string): boolean {
        return this.runtimeStrategies.has(type) ||
            this.diEntries.some(e => e.type === type);
    }

    /**
     * 统一处理入口
     * @param param 渲染参数
     * @returns 执行结果（类型由策略决定）
     */
    handle<T = any>(param: RenderParam<T>, ctx?: ComponentContext): ActionResult {
        const actionType = this.resolveActionType(param);
        const strategy = this.getStrategy(actionType);

        if (!strategy) {
            throw new Error(`[ActionHandle] Strategy not found for type: "${actionType}". ` +
                `Registered types: ${this.getRegisteredTypes().join(', ')}`);
        }

        // 获取当前顶层对话框作为父级
        const topDialog = this.coordinator.getTopDialog();

        const context: ActionContext<T> = {
            param,
            ctx,
            parentId: topDialog?.id
        };

        return strategy.execute<T>(context);
    }

    /**
     * 打开 Modal
     */
    modal<T = any>(
        content: any,
        data?: Record<string, any>,
        options?: Partial<RenderParam<T>>
    ): ActionResult {
        return this.handle<T>({
            type: 'modal',
            content,
            data,
            ...options
        } as RenderParam<T>);
    }

    /**
     * 打开 Drawer
     */
    drawer<T = any>(
        content: any,
        data?: Record<string, any>,
        options?: Partial<RenderParam<T>>
    ): ActionResult {
        return this.handle<T>({
            type: 'drawer',
            content,
            data,
            ...options
        } as RenderParam<T>);
    }

    /**
     * 执行事件/脚本
     */
    event<R = any>(
        handler: (context: ActionContext) => R | Promise<R> | void
    ): ActionResult<R> {
        return this.handle({
            type: 'event',
            content: undefined as any,
            data: { handler }
        } as RenderParam<void>);
    }

    /**
     * 调用外部 API
     */
    external<R = any>(
        url: string,
        options?: { method?: string; body?: any; headers?: Record<string, string> }
    ): ActionResult<R> {
        return this.handle({
            type: 'external',
            content: undefined as any,
            data: { url, ...options }
        } as RenderParam<void>);
    }

    /**
     * 新窗口/新标签页打开
     */
    openBlank(
        url: string,
        options?: { target?: string; features?: string }
    ): ActionResult {
        return this.handle({
            type: 'openBlank',
            content: undefined as any,
            data: { url, ...options }
        } as RenderParam<any>);
    }

    /**
     * 路由覆盖/页面跳转
     */
    cover(
        url: string,
        options?: { saveBackUrl?: boolean; queryParams?: Record<string, any> }
    ): ActionResult<void> {
        return this.handle({
            type: 'cover',
            content: undefined as any,
            data: { url, ...options }
        } as RenderParam<void>);
    }

    /**
     * 获取 Builder API（通过 ActionFactory）
     */
    get builder() {
        return this.factory;
    }

    /**
     * 获取协调器
     */
    get dialogCoordinator() {
        return this.coordinator;
    }

    /**
     * 解析 Action 类型
     */
    private resolveActionType(param: RenderParam): ActionType {
        // 如果有明确 type，直接返回
        if (param.type && this.hasStrategy(param.type)) {
            return param.type;
        }

        // 如果没有 content 且有特定 data 字段，推断类型
        const data = param.data;
        if (!param.content) {
            if (data?.['handler']) return 'event';
            if (data?.['url'] && data?.['method']) return 'external';
            if (data?.['url'] && (data?.['target'] || data?.['features'])) return 'openBlank';
            if (data?.['url'] || data?.['commands']) return 'cover';
        }

        // 默认返回 modal
        return param.type === 'drawer' ? 'drawer' : 'modal';
    }
}
