import { InjectionToken, Type } from '@angular/core';

/**
 * Widget 注册条目接口
 * 
 * 用于定义可动态渲染的组件
 */
export interface WidgetRegistryEntry {
    /** 组件类型标识 (如 'table', 'form', 'button') */
    type: string;

    /** 组件类 */
    component: Type<any>;

    /** 可选的元数据 */
    metadata?: WidgetMetadata;
}

/**
 * Widget 元数据接口
 */
export interface WidgetMetadata {
    /** 显示名称 */
    displayName?: string;

    /** 图标 */
    icon?: string;

    /** 分类 */
    category?: string;

    /** 描述 */
    description?: string;
}

/**
 * Widget 注册 InjectionToken
 * 
 * 使用 multi: true 支持多模块注册
 * 
 * @example
 * ```typescript
 * // 模块中注册
 * providers: [
 *   { provide: WIDGET_REGISTRY, useValue: { type: 'table', component: TableComponent }, multi: true }
 * ]
 * ```
 */
export const WIDGET_REGISTRY = new InjectionToken<WidgetRegistryEntry[]>('WIDGET_REGISTRY');
