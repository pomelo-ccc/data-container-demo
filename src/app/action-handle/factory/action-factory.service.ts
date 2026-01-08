import { Injectable, inject, Type } from '@angular/core';
import { RenderParam, createDefaultRenderParam, DialogType } from '../interfaces/render-param.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { IPresetStrategy } from '../interfaces/strategy.interface';
import { ModalStrategy } from '../strategies/modal.strategy';
import { DrawerStrategy } from '../strategies/drawer.strategy';
import { DialogCoordinatorService } from '../coordinator/dialog-coordinator.service';
import { PresetRegistryService } from '../presets/preset.registry';

/**
 * ActionFactory 服务
 * 
 * 对外统一入口，提供简洁的 API 创建各种弹窗/抽屉
 * 
 * @example
 * ```typescript
 * // 快速打开 Modal
 * this.actionFactory.modal()
 *   .content(MyComponent)
 *   .data({ id: 123 })
 *   .open();
 * 
 * // 使用预设
 * this.actionFactory.modal('confirm')
 *   .content(ConfirmComponent)
 *   .open();
 * 
 * // 直接创建
 * this.actionFactory.create({
 *   type: 'drawer',
 *   content: DetailComponent,
 *   width: '600px'
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ActionFactoryService {
    private readonly modalStrategy = inject(ModalStrategy);
    private readonly drawerStrategy = inject(DrawerStrategy);
    private readonly presetRegistry = inject(PresetRegistryService);
    private readonly coordinator = inject(DialogCoordinatorService);

    /**
     * 创建 Modal 构建器
     * @param preset 预设名称（可选）
     */
    modal<T = any, R = any>(preset?: string): ModalBuilder<T, R> {
        return new ModalBuilder<T, R>(this, preset);
    }

    /**
     * 创建 Drawer 构建器
     * @param preset 预设名称（可选）
     */
    drawer<T = any, R = any>(preset?: string): DrawerBuilder<T, R> {
        return new DrawerBuilder<T, R>(this, preset);
    }

    /**
     * 通用创建方法
     * @param param 渲染参数
     */
    create<T = any, R = any>(param: RenderParam<T>): DialogRef<T, R> {
        // 合并默认配置
        const baseParam = { ...createDefaultRenderParam(), ...param };

        // 应用预设配置
        let finalParam = baseParam;
        if (param.preset) {
            const preset = this.presetRegistry.get(param.preset);
            if (preset) {
                const presetConfig = preset.getPresetConfig();
                finalParam = { ...presetConfig, ...baseParam };
            }
        }

        // 获取当前顶层对话框作为父级
        const topDialog = this.coordinator.getTopDialog();
        const parentId = topDialog?.id;

        // 根据类型选择策略
        const context = { param: finalParam, parentId };

        if (finalParam.type === 'drawer') {
            return this.drawerStrategy.execute<T, R>(context);
        } else {
            return this.modalStrategy.execute<T, R>(context);
        }
    }

    /**
     * 使用预设打开
     * @param presetName 预设名称
     * @param content 内容组件
     * @param data 传递的数据
     */
    openWithPreset<T = any, R = any>(
        presetName: string,
        content: Type<T>,
        data?: Record<string, any>
    ): DialogRef<T, R> {
        const preset = this.presetRegistry.get(presetName);
        if (!preset) {
            console.warn(`[ActionFactory] Preset not found: ${presetName}`);
        }

        const presetConfig = preset?.getPresetConfig() ?? {};

        return this.create<T, R>({
            ...presetConfig,
            type: presetConfig.type || 'modal',
            content,
            data,
            preset: presetName
        } as RenderParam<T>);
    }
}

/**
 * 基础构建器
 */
abstract class BaseBuilder<T, R, B extends BaseBuilder<T, R, B>> {
    protected param: Partial<RenderParam<T>> = {};

    constructor(
        protected factory: ActionFactoryService,
        protected preset?: string
    ) {
        if (preset) {
            this.param.preset = preset;
        }
    }

    /** 设置内容组件 */
    content(component: Type<T>): B {
        this.param.content = component;
        return this as unknown as B;
    }

    /** 设置传递数据 */
    data(data: Record<string, any>): B {
        this.param.data = data;
        return this as unknown as B;
    }

    /** 设置宽度 */
    width(width: string | number): B {
        this.param.width = width;
        return this as unknown as B;
    }

    /** 设置高度 */
    height(height: string | number): B {
        this.param.height = height;
        return this as unknown as B;
    }

    /** 设置标题 */
    title(title: string): B {
        this.param.title = title;
        return this as unknown as B;
    }

    /** 设置 CSS 类名 */
    className(className: string): B {
        this.param.className = className;
        return this as unknown as B;
    }

    /** 设置是否可关闭 */
    closable(closable: boolean): B {
        this.param.closable = closable;
        return this as unknown as B;
    }

    /** 设置背景遮罩 */
    backdrop(backdrop: boolean | 'static'): B {
        this.param.backdrop = backdrop;
        return this as unknown as B;
    }

    /** 设置关闭回调 */
    onClose(callback: (result?: R) => void): B {
        this.param.onClose = callback;
        return this as unknown as B;
    }

    /** 设置打开回调 */
    onOpen(callback: () => void): B {
        this.param.onOpen = callback;
        return this as unknown as B;
    }

    /** 打开对话框 */
    abstract open(): DialogRef<T, R>;
}

/**
 * Modal 构建器
 */
export class ModalBuilder<T, R> extends BaseBuilder<T, R, ModalBuilder<T, R>> {
    constructor(factory: ActionFactoryService, preset?: string) {
        super(factory, preset);
        this.param.type = 'modal';
    }

    /** 设置是否支持拖拽 */
    draggable(draggable: boolean): ModalBuilder<T, R> {
        this.param.draggable = draggable;
        return this;
    }

    /** 设置 Footer */
    footer(footer: 'default' | 'none' | Type<any>): ModalBuilder<T, R> {
        this.param.footer = footer;
        return this;
    }

    /** 打开 Modal */
    open(): DialogRef<T, R> {
        if (!this.param.content) {
            throw new Error('[ModalBuilder] Content component is required');
        }
        return this.factory.create<T, R>(this.param as RenderParam<T>);
    }
}

/**
 * Drawer 构建器
 */
export class DrawerBuilder<T, R> extends BaseBuilder<T, R, DrawerBuilder<T, R>> {
    constructor(factory: ActionFactoryService, preset?: string) {
        super(factory, preset);
        this.param.type = 'drawer';
    }

    /** 设置位置 */
    position(position: 'left' | 'right' | 'top' | 'bottom'): DrawerBuilder<T, R> {
        this.param.position = position;
        return this;
    }

    /** 打开 Drawer */
    open(): DialogRef<T, R> {
        if (!this.param.content) {
            throw new Error('[DrawerBuilder] Content component is required');
        }
        return this.factory.create<T, R>(this.param as RenderParam<T>);
    }
}
