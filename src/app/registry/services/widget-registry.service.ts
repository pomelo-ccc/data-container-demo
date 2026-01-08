import { Injectable, Inject, Optional, Type } from '@angular/core';
import { WIDGET_REGISTRY, WidgetRegistryEntry, WidgetMetadata } from '../tokens/widget-registry.token';

/**
 * Widget 注册服务
 * 
 * 管理组件类型映射，提供以下功能：
 * 1. 收集所有模块注册的 Widget（通过 DI）
 * 2. 动态注册/注销组件
 * 3. 按类型获取组件
 * 4. 日志追踪
 * 
 * @example
 * ```typescript
 * // 获取组件
 * const component = widgetRegistry.get('table');
 * 
 * // 动态注册
 * widgetRegistry.register('custom', CustomComponent);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
    /** 组件映射表 */
    private readonly componentMap = new Map<string, Type<any>>();

    /** 元数据映射表 */
    private readonly metadataMap = new Map<string, WidgetMetadata>();

    /** 是否启用调试日志 */
    private debugMode = false;

    constructor(
        @Optional() @Inject(WIDGET_REGISTRY) entries: WidgetRegistryEntry[][] | null
    ) {
        // 合并所有模块注册的 Widget
        if (entries) {
            // entries 是二维数组，因为每个 provider 返回一个数组
            const flatEntries = entries.flat();
            flatEntries.forEach(entry => {
                if (entry && entry.type && entry.component) {
                    this.registerInternal(entry.type, entry.component, entry.metadata, 'DI');
                }
            });
        }

        this.log('WidgetRegistryService initialized', { count: this.componentMap.size });
    }

    /**
     * 启用/禁用调试日志
     */
    setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * 获取组件类型
     * @param type 组件类型标识
     * @returns 组件类，如果未找到则返回 undefined
     */
    get<T = any>(type: string): Type<T> | undefined {
        return this.componentMap.get(type);
    }

    /**
     * 检查是否已注册
     * @param type 组件类型标识
     */
    has(type: string): boolean {
        return this.componentMap.has(type);
    }

    /**
     * 获取组件元数据
     * @param type 组件类型标识
     */
    getMetadata(type: string): WidgetMetadata | undefined {
        return this.metadataMap.get(type);
    }

    /**
     * 动态注册组件
     * @param type 组件类型标识
     * @param component 组件类
     * @param metadata 可选的元数据
     */
    register<T>(type: string, component: Type<T>, metadata?: WidgetMetadata): void {
        this.registerInternal(type, component, metadata, 'runtime');
    }

    /**
     * 注销组件
     * @param type 组件类型标识
     */
    unregister(type: string): boolean {
        const existed = this.componentMap.has(type);
        if (existed) {
            this.componentMap.delete(type);
            this.metadataMap.delete(type);
            this.log(`Widget unregistered: "${type}"`);
        }
        return existed;
    }

    /**
     * 获取所有已注册的组件类型
     */
    getRegisteredTypes(): string[] {
        return Array.from(this.componentMap.keys());
    }

    /**
     * 获取所有注册条目
     */
    getAll(): Array<{ type: string; component: Type<any>; metadata?: WidgetMetadata }> {
        return Array.from(this.componentMap.entries()).map(([type, component]) => ({
            type,
            component,
            metadata: this.metadataMap.get(type)
        }));
    }

    /**
     * 内部注册方法
     */
    private registerInternal<T>(
        type: string,
        component: Type<T>,
        metadata?: WidgetMetadata,
        source: 'DI' | 'runtime' = 'runtime'
    ): void {
        if (this.componentMap.has(type)) {
            this.log(`Widget "${type}" already exists, overwriting (source: ${source})`, 'warn');
        }

        this.componentMap.set(type, component);
        if (metadata) {
            this.metadataMap.set(type, metadata);
        }

        this.log(`Widget registered: "${type}" (source: ${source})`);
    }

    /**
     * 日志输出
     */
    private log(message: string, levelOrData: 'info' | 'warn' | 'error' | object = 'info'): void {
        if (!this.debugMode && typeof levelOrData === 'string' && levelOrData === 'info') {
            return;
        }

        const prefix = '[WidgetRegistry]';

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
