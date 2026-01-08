import { Injectable, inject } from '@angular/core';
import { IPresetStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam } from '../interfaces/render-param.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { ModalStrategy } from '../strategies/modal.strategy';

/**
 * 确认框预设
 * 
 * 用于确认操作的小型弹窗
 * 
 * @example
 * ```typescript
 * this.actionFactory.modal('confirm')
 *   .content(ConfirmDialogComponent)
 *   .data({ message: '确定删除吗？' })
 *   .open();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ConfirmPreset extends ModalStrategy implements IPresetStrategy {
    readonly presetType = 'confirm';

    getPresetConfig(): Partial<RenderParam> {
        return {
            type: 'modal',
            width: '400px',
            className: 'confirm-dialog',
            backdrop: 'static',
            keyboard: false,
            closable: true,
            footer: 'none'
        };
    }

    override execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        // 合并预设配置
        const presetConfig = this.getPresetConfig();
        context.param = { ...presetConfig, ...context.param };
        return super.execute<T, R>(context);
    }
}
