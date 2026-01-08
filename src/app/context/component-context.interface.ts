/**
 * 组件上下文接口
 */
export interface ComponentContextData {
    /** 组件唯一ID */
    id: string;

    /** 组件类型 (container/form/table/button 等) */
    type: string;

    /** 组件实例引用 */
    instance?: any;

    /** 自定义数据 */
    [key: string]: any;
}

/**
 * 组件事件
 */
export interface ComponentEvent<T = any> {
    /** 事件源组件ID */
    sourceId: string;

    /** 事件名称 */
    event: string;

    /** 事件数据 */
    data?: T;

    /** 时间戳 */
    timestamp: number;
}
