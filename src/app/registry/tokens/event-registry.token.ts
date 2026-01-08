import { InjectionToken } from '@angular/core';

/**
 * 事件参数定义
 */
export interface EventParamDef {
    /** 参数名 */
    name: string;

    /** 参数类型 */
    type: string;

    /** 是否可选 */
    optional?: boolean;

    /** 描述 */
    description?: string;
}

/**
 * Event 注册条目接口
 * 
 * 用于定义可触发的事件处理器
 */
export interface EventRegistryEntry {
    /** 事件名称 (如 'onRowClick', 'onFormSubmit') */
    name: string;

    /** 事件处理函数 */
    handler: (...args: any[]) => void | Promise<void>;

    /** 可选的元数据 */
    metadata?: EventMetadata;
}

/**
 * Event 元数据接口
 */
export interface EventMetadata {
    /** 描述 */
    description?: string;

    /** 参数定义 */
    params?: EventParamDef[];

    /** 分类 */
    category?: string;
}

/**
 * Event 注册 InjectionToken
 * 
 * 使用 multi: true 支持多模块注册
 * 
 * @example
 * ```typescript
 * // 模块中注册
 * providers: [
 *   { provide: EVENT_REGISTRY, useValue: { name: 'onRowClick', handler: handleRowClick }, multi: true }
 * ]
 * ```
 */
export const EVENT_REGISTRY = new InjectionToken<EventRegistryEntry[]>('EVENT_REGISTRY');
