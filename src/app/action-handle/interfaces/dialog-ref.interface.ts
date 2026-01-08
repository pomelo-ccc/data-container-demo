import { Observable } from 'rxjs';
import { DialogType } from './render-param.interface';

/**
 * 对话框引用接口
 * 
 * 提供对话框的控制方法和状态订阅
 */
export interface DialogRef<T = any, R = any> {
    /** 唯一标识 */
    readonly id: string;

    /** 对话框类型 */
    readonly type: DialogType;

    /** 父对话框 ID（如果有） */
    readonly parentId?: string;

    /** 组件实例 */
    readonly componentInstance: T;

    /** 原生引用（NzModalRef 或 NzDrawerRef） */
    readonly nativeRef: any;

    /**
     * 关闭对话框
     * @param result 返回给调用者的结果
     */
    close(result?: R): void;

    /**
     * 销毁对话框（强制关闭，不触发关闭动画）
     */
    destroy(): void;

    /**
     * 更新配置
     * @param config 部分配置
     */
    updateConfig(config: Partial<DialogConfig>): void;

    /**
     * 关闭后的 Observable
     */
    afterClosed(): Observable<R | undefined>;

    /**
     * 打开后的 Observable
     */
    afterOpened(): Observable<void>;
}

/**
 * 对话框配置（可更新的部分）
 */
export interface DialogConfig {
    title?: string;
    width?: string | number;
    height?: string | number;
    className?: string;
    closable?: boolean;
}

/**
 * 创建 DialogRef 的工厂函数类型
 */
export type DialogRefFactory<T, R> = (nativeRef: any, componentInstance: T) => DialogRef<T, R>;
