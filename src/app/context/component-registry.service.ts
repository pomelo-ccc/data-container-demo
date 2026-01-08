import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { ComponentContext } from './component-context.service';
import { ComponentEvent } from './component-context.interface';

/**
 * 组件注册表服务
 * 
 * 全局单例，负责：
 * 1. 跨组件查询
 * 2. 事件通信
 * 
 * @example
 * ```typescript
 * // 注册
 * registry.register(this.ctx);
 * 
 * // 查询
 * const table = registry.get('table-1');
 * const allForms = registry.getByType('form');
 * 
 * // 事件通信
 * registry.emit('table-1', 'refresh', { page: 1 });
 * registry.on$('refresh').subscribe(e => console.log(e));
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ComponentRegistry {
    /** ID -> Context 映射 */
    private readonly contexts = new Map<string, ComponentContext>();

    /** 类型 -> ID[] 索引 */
    private readonly typeIndex = new Map<string, Set<string>>();

    /** 事件总线 */
    private readonly eventBus = new Subject<ComponentEvent>();

    // ===== 注册/注销 =====

    /**
     * 注册组件上下文
     */
    register(ctx: ComponentContext): void {
        const id = ctx.id();
        const type = ctx.type();

        // 添加到主映射
        this.contexts.set(id, ctx);

        // 更新类型索引
        if (!this.typeIndex.has(type)) {
            this.typeIndex.set(type, new Set());
        }
        this.typeIndex.get(type)!.add(id);
    }

    /**
     * 注销组件上下文
     */
    unregister(id: string): void {
        const ctx = this.contexts.get(id);
        if (ctx) {
            // 从类型索引移除
            const type = ctx.type();
            this.typeIndex.get(type)?.delete(id);
            if (this.typeIndex.get(type)?.size === 0) {
                this.typeIndex.delete(type);
            }

            // 从主映射移除
            this.contexts.delete(id);
        }
    }

    // ===== 查询 =====

    /**
     * 按 ID 获取
     */
    get(id: string): ComponentContext | undefined {
        return this.contexts.get(id);
    }

    /**
     * 按类型获取所有
     */
    getByType(type: string): ComponentContext[] {
        const ids = this.typeIndex.get(type);
        if (!ids) return [];
        return Array.from(ids)
            .map(id => this.contexts.get(id))
            .filter((ctx): ctx is ComponentContext => ctx !== undefined);
    }

    /**
     * 获取所有已注册的上下文
     */
    getAll(): ComponentContext[] {
        return Array.from(this.contexts.values());
    }

    /**
     * 获取所有已注册的 ID
     */
    getAllIds(): string[] {
        return Array.from(this.contexts.keys());
    }

    /**
     * 检查是否存在
     */
    has(id: string): boolean {
        return this.contexts.has(id);
    }

    /**
     * 获取注册数量
     */
    get size(): number {
        return this.contexts.size;
    }

    // ===== 事件通信 =====

    /**
     * 发送事件到指定组件
     */
    emit<T = any>(targetId: string, event: string, data?: T): void {
        const componentEvent: ComponentEvent<T> = {
            sourceId: targetId,
            event,
            data,
            timestamp: Date.now()
        };
        this.eventBus.next(componentEvent);
    }

    /**
     * 广播事件到所有组件
     */
    broadcast<T = any>(event: string, data?: T, sourceId = 'system'): void {
        const componentEvent: ComponentEvent<T> = {
            sourceId,
            event,
            data,
            timestamp: Date.now()
        };
        this.eventBus.next(componentEvent);
    }

    /**
     * 订阅事件流
     */
    on$<T = any>(event: string): Observable<ComponentEvent<T>> {
        return this.eventBus.asObservable().pipe(
            filter(e => e.event === event)
        ) as Observable<ComponentEvent<T>>;
    }

    /**
     * 订阅指定组件的事件
     */
    onFrom$<T = any>(sourceId: string, event?: string): Observable<ComponentEvent<T>> {
        return this.eventBus.asObservable().pipe(
            filter(e => e.sourceId === sourceId),
            filter(e => event ? e.event === event : true)
        ) as Observable<ComponentEvent<T>>;
    }

    /**
     * 获取完整事件流
     */
    get events$(): Observable<ComponentEvent> {
        return this.eventBus.asObservable();
    }
}
