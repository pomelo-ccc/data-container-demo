import { Type } from '@angular/core';

/**
 * 对话框类型（包含所有 Action 类型）
 * 
 * - modal: NG-ZORRO Modal 弹窗
 * - drawer: NG-ZORRO Drawer 抽屉
 * - event: 执行脚本/事件处理
 * - external: 外部 API 调用
 * - openBlank: 新窗口/新标签页
 * - cover: 路由覆盖/页面跳转
 */
export type DialogType = 'modal' | 'drawer' | 'event' | 'external' | 'openBlank' | 'cover';

/**
 * 对话框位置（用于 Drawer）
 */
export type DialogPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * 背景遮罩配置
 * - true: 显示遮罩，点击可关闭
 * - false: 不显示遮罩
 * - 'static': 显示遮罩，点击不可关闭
 */
export type BackdropConfig = boolean | 'static';

/**
 * 渲染参数接口
 * 
 * 用于配置 Modal/Drawer 的打开方式
 */
export interface RenderParam<T = any> {
    /** 对话框类型 */
    type: DialogType;

    /** 预设名称 */
    preset?: string;

    /** 内容组件 */
    content: Type<T>;

    /** 传递给组件的数据 */
    data?: Record<string, any>;

    // ===== 样式配置 =====

    /** 宽度 */
    width?: string | number;

    /** 高度 */
    height?: string | number;

    /** 位置（仅 Drawer） */
    position?: DialogPosition;

    /** 自定义 CSS 类名 */
    className?: string;

    /** 层级 */
    zIndex?: number;

    // ===== 行为配置 =====

    /** 背景遮罩 */
    backdrop?: BackdropConfig;

    /** 是否显示关闭按钮 */
    closable?: boolean;

    /** 是否支持键盘 ESC 关闭 */
    keyboard?: boolean;

    /** 是否支持拖拽（仅 Modal） */
    draggable?: boolean;

    /** 标题 */
    title?: string;

    /** 页脚配置 */
    footer?: 'default' | 'none' | Type<any>;

    // ===== 回调 =====

    /** 打开后回调 */
    onOpen?: () => void;

    /** 关闭后回调 */
    onClose?: (result?: any) => void;

    /** 销毁后回调 */
    onDestroy?: () => void;
}

/**
 * 创建默认渲染参数
 */
export function createDefaultRenderParam(): Partial<RenderParam> {
    return {
        type: 'modal',
        backdrop: true,
        closable: true,
        keyboard: true,
        draggable: false
    };
}
