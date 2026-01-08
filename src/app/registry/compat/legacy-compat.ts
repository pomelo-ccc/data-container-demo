import { inject, Type } from '@angular/core';
import { WidgetRegistryService } from '../services/widget-registry.service';
import { EventRegistryService, EventHandler } from '../services/event-registry.service';
import { WidgetMetadata } from '../tokens/widget-registry.token';
import { EventMetadata } from '../tokens/event-registry.token';

/**
 * 兼容层 - 全局服务实例缓存
 * 
 * 注意：这些变量仅在 Angular 应用启动后才会被赋值
 * 在应用启动前调用会抛出错误
 */
let _widgetRegistry: WidgetRegistryService | null = null;
let _eventRegistry: EventRegistryService | null = null;

/**
 * 初始化兼容层
 * 
 * 应在应用启动时调用（通常在 APP_INITIALIZER 中）
 * 
 * @internal
 */
export function initLegacyCompat(
    widgetRegistry: WidgetRegistryService,
    eventRegistry: EventRegistryService
): void {
    _widgetRegistry = widgetRegistry;
    _eventRegistry = eventRegistry;
}

/**
 * 获取 WidgetRegistryService 实例
 * 
 * @internal
 */
function getWidgetRegistry(): WidgetRegistryService {
    if (!_widgetRegistry) {
        // 尝试通过 inject 获取（仅在注入上下文中有效）
        try {
            _widgetRegistry = inject(WidgetRegistryService);
        } catch {
            throw new Error(
                '[Legacy Compat] WidgetRegistryService not initialized. ' +
                'Make sure to import RegistryModule.forRoot() in your app module.'
            );
        }
    }
    return _widgetRegistry;
}

/**
 * 获取 EventRegistryService 实例
 * 
 * @internal
 */
function getEventRegistry(): EventRegistryService {
    if (!_eventRegistry) {
        try {
            _eventRegistry = inject(EventRegistryService);
        } catch {
            throw new Error(
                '[Legacy Compat] EventRegistryService not initialized. ' +
                'Make sure to import RegistryModule.forRoot() in your app module.'
            );
        }
    }
    return _eventRegistry;
}

/**
 * 注册 Widget 组件（兼容旧 API）
 * 
 * @deprecated 推荐使用 DI 方式注册：
 * ```typescript
 * providers: [
 *   { provide: WIDGET_REGISTRY, useValue: { type: 'custom', component: CustomComponent }, multi: true }
 * ]
 * ```
 * 
 * @param type 组件类型标识
 * @param component 组件类
 * @param metadata 可选的元数据
 */
export function registerWidget<T>(
    type: string,
    component: Type<T>,
    metadata?: WidgetMetadata
): void {
    getWidgetRegistry().register(type, component, metadata);
}

/**
 * 获取已注册的 Widget 组件（兼容旧 API）
 * 
 * @param type 组件类型标识
 */
export function getWidget<T = any>(type: string): Type<T> | undefined {
    return getWidgetRegistry().get<T>(type);
}

/**
 * 获取所有支持的 Widget 类型（兼容旧 API）
 */
export function getSupportedWidgetTypes(): string[] {
    return getWidgetRegistry().getRegisteredTypes();
}

/**
 * 注册事件处理器（兼容旧 API）
 * 
 * @deprecated 推荐使用 DI 方式注册或直接使用 EventRegistryService
 * 
 * @param name 事件名称
 * @param handler 事件处理函数
 * @param metadata 可选的元数据
 */
export function registerEvent(
    name: string,
    handler: EventHandler,
    metadata?: EventMetadata
): void {
    getEventRegistry().on(name, handler, metadata);
}

/**
 * 注销事件处理器（兼容旧 API）
 * 
 * @param name 事件名称
 * @param handler 要注销的处理函数
 */
export function unregisterEvent(name: string, handler?: EventHandler): void {
    getEventRegistry().off(name, handler);
}

/**
 * 触发事件（兼容旧 API）
 * 
 * @param name 事件名称
 * @param args 事件参数
 */
export function emitEvent(name: string, ...args: any[]): Promise<void> {
    return getEventRegistry().emit(name, ...args);
}

/**
 * 同步触发事件（兼容旧 API）
 * 
 * @param name 事件名称
 * @param args 事件参数
 */
export function emitEventSync(name: string, ...args: any[]): void {
    getEventRegistry().emitSync(name, ...args);
}
