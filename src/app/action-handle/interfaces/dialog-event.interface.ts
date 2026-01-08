/**
 * 对话框事件类型
 */
export type DialogEventType = 'refresh' | 'close' | 'data' | 'focus' | 'custom';

/**
 * 对话框事件接口
 * 
 * 用于对话框之间的通信
 */
export interface DialogEvent<T = unknown> {
    /** 事件类型 */
    type: DialogEventType;

    /** 目标对话框 ID（'*' 表示广播给所有对话框） */
    targetId: string;

    /** 事件数据 */
    data?: T;

    /** 来源对话框 ID */
    sourceId?: string;

    /** 时间戳 */
    timestamp?: number;
}

/**
 * 刷新事件数据
 */
export interface RefreshEventData {
    /** 刷新动作 */
    action: 'saved' | 'deleted' | 'updated' | 'created' | string;

    /** 相关实体 ID */
    entityId?: string | number;

    /** 额外数据 */
    extra?: Record<string, any>;
}

/**
 * 数据传递事件
 */
export interface DataEventData<T = any> {
    /** 数据键 */
    key: string;

    /** 数据值 */
    value: T;
}

/**
 * 创建刷新事件
 */
export function createRefreshEvent(
    targetId: string,
    data: RefreshEventData,
    sourceId?: string
): DialogEvent<RefreshEventData> {
    return {
        type: 'refresh',
        targetId,
        data,
        sourceId,
        timestamp: Date.now()
    };
}

/**
 * 创建数据事件
 */
export function createDataEvent<T>(
    targetId: string,
    key: string,
    value: T,
    sourceId?: string
): DialogEvent<DataEventData<T>> {
    return {
        type: 'data',
        targetId,
        data: { key, value },
        sourceId,
        timestamp: Date.now()
    };
}

/**
 * 创建广播事件
 */
export function createBroadcastEvent<T>(
    type: DialogEventType,
    data: T,
    sourceId?: string
): DialogEvent<T> {
    return {
        type,
        targetId: '*',
        data,
        sourceId,
        timestamp: Date.now()
    };
}
