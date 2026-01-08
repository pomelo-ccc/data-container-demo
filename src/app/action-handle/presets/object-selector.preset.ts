import { Injectable } from '@angular/core';
import { IPresetStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam } from '../interfaces/render-param.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { ModalStrategy } from '../strategies/modal.strategy';

/**
 * 对象选择器预设
 * 
 * 用于选择数据对象的大型弹窗
 * 
 * @example
 * ```typescript
 * this.actionFactory.modal('objectSelector')
 *   .content(UserSelectorComponent)
 *   .data({ multiple: true })
 *   .open();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ObjectSelectorPreset extends ModalStrategy implements IPresetStrategy {
    readonly presetType = 'objectSelector';

    getPresetConfig(): Partial<RenderParam> {
        return {
            type: 'modal',
            width: '80%',
            height: '70%',
            className: 'object-selector-modal',
            backdrop: true,
            closable: true,
            keyboard: true,
            draggable: true
        };
    }

    override execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const presetConfig = this.getPresetConfig();
        context.param = { ...presetConfig, ...context.param };
        return super.execute<T, R>(context);
    }
}
