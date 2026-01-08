import { Injectable, Inject, Optional } from '@angular/core';
import { EVENT_REGISTRY, EventRegistryEntry, EventMetadata } from '../tokens/event-registry.token';

/**
 * 事件处理器类型
 */
export type EventHandler = (...args: any[]) => void | Promise<void>;

/**
 * Event 注册服务
 * 
 * 管理事件处理器映射，提供以下功能：
 * 1. 收集所有模块注册的 Event Handler（通过 DI）
 * 2. 动态注册/注销事件处理器
 * 3. 触发事件
 * 4. 支持多个处理器监听同一事件
 * 
 * @example
 * ```typescript
 * // 注册事件
 * eventRegistry.on('onRowClick', (row) => console.log(row));
 * 
 * // 触发事件
 * eventRegistry.emit('onRowClick', rowData);
 * 
 * // 注销事件
 * eventRegistry.off('onRowClick', handler);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventRegistryService {
    /** 事件处理器映射表 (一个事件可以有多个处理器) */
    private readonly handlersMap = new Map<string, Set<EventHandler>>();

    /** 元数据映射表 */
    private readonly metadataMap = new Map<string, EventMetadata>();

    /** 是否启用调试日志 */
    private debugMode = false;

    constructor(
        @Optional() @Inject(EVENT_REGISTRY) entries: EventRegistryEntry[][] | null
    ) {
        // 合并所有模块注册的 Event
        if (entries) {
            const flatEntries = entries.flat();
            flatEntries.forEach(entry => {
                if (entry && entry.name && entry.handler) {
                    this.onInternal(entry.name, entry.handler, entry.metadata, 'DI');
                }
            });
        }

        this.log('EventRegistryService initialized', { count: this.handlersMap.size });
    }

    /**
     * 启用/禁用调试日志
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * 注册事件处理器
     * @param name 事件名称
     * @param handler 事件处理函数
     * @param metadata 可选的元数据
     */
    on(name: string, handler: EventHandler, metadata?: EventMetadata): void {
        this.onInternal(name, handler, metadata, 'runtime');
    }

    /**
     * 注销事件处理器
     * @param name 事件名称
     * @param handler 要注销的处理函数（如果不传则注销所有）
     */
    off(name: string, handler?: EventHandler): void {
        if (!this.handlersMap.has(name)) {
            return;
        }

        if (handler) {
            // 移除特定处理器
            const handlers = this.handlersMap.get(name)!;
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlersMap.delete(name);
                this.metadataMap.delete(name);
            }
            this.log(`Event handler removed: "${name}"`);
        } else {
            // 移除所有处理器
            this.handlersMap.delete(name);
            this.metadataMap.delete(name);
            this.log(`All handlers removed for event: "${name}"`);
        }
    }

    /**
     * 触发事件
     * @param name 事件名称
     * @param args 事件参数
     */
    async emit(name: string, ...args: any[]): Promise<void> {
        const handlers = this.handlersMap.get(name);

        if (!handlers || handlers.size === 0) {
            this.log(`No handlers for event: "${name}"`, 'warn');
            return;
        }

        this.log(`Emitting event: "${name}"`, { args, handlerCount: handlers.size });

        // 依次执行所有处理器
        for (const handler of handlers) {
            try {
                await handler(...args);
            } catch (error) {
                this.log(`Error in event handler for "${name}": ${error}`, 'error');
            }
        }
    }

    /**
     * 同步触发事件（不等待异步处理器）
     * @param name 事件名称
     * @param args 事件参数
     */
    emitSync(name: string, ...args: any[]): void {
        const handlers = this.handlersMap.get(name);

        if (!handlers || handlers.size === 0) {
            return;
        }

        for (const handler of handlers) {
            try {
                handler(...args);
            } catch (error) {
                this.log(`Error in event handler for "${name}": ${error}`, 'error');
            }
        }
    }

    /**
     * 检查是否有处理器
     * @param name 事件名称
     */
    has(name: string): boolean {
        const handlers = this.handlersMap.get(name);
        return !!handlers && handlers.size > 0;
    }

    /**
     * 获取事件元数据
     * @param name 事件名称
     */
    getMetadata(name: string): EventMetadata | undefined {
        return this.metadataMap.get(name);
    }

    /**
     * 获取所有已注册的事件名称
     */
    getRegisteredEvents(): string[] {
        return Array.from(this.handlersMap.keys());
    }

    /**
     * 一次性监听（触发后自动注销）
     * @param name 事件名称
     * @param handler 事件处理函数
     */
    once(name: string, handler: EventHandler): void {
        const wrappedHandler: EventHandler = (...args) => {
            this.off(name, wrappedHandler);
            return handler(...args);
        };
        this.on(name, wrappedHandler);
    }

    /**
     * 内部注册方法
     */
    private onInternal(
        name: string,
        handler: EventHandler,
        metadata?: EventMetadata,
        source: 'DI' | 'runtime' = 'runtime'
    ): void {
        if (!this.handlersMap.has(name)) {
            this.handlersMap.set(name, new Set());
        }

        this.handlersMap.get(name)!.add(handler);

        if (metadata) {
            this.metadataMap.set(name, metadata);
        }

        this.log(`Event handler registered: "${name}" (source: ${source})`);
    }

    /**
     * 日志输出
     */
    private log(message: string, levelOrData: 'info' | 'warn' | 'error' | object = 'info'): void {
        if (!this.debugMode && typeof levelOrData === 'string' && levelOrData === 'info') {
            return;
        }

        const prefix = '[EventRegistry]';

        if (typeof levelOrData === 'object') {
            console.log(prefix, message, levelOrData);
        } else {
            switch (levelOrData) {
                case 'warn':
                    console.warn(prefix, message);
                    break;
                case 'error':
                    console.error(prefix, message);
                    break;
                default:
                    console.log(prefix, message);
            }
        }
    }
}
