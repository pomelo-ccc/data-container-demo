import { Injectable } from '@angular/core';
import { IPresetStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam } from '../interfaces/render-param.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { DrawerStrategy } from '../strategies/drawer.strategy';

/**
 * 详情面板预设
 * 
 * 用于显示详情信息的右侧抽屉
 * 
 * @example
 * ```typescript
 * this.actionFactory.drawer('detailPanel')
 *   .content(UserDetailComponent)
 *   .data({ userId: 123 })
 *   .open();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class DetailPanelPreset extends DrawerStrategy implements IPresetStrategy {
    readonly presetType = 'detailPanel';

    getPresetConfig(): Partial<RenderParam> {
        return {
            type: 'drawer',
            position: 'right',
            width: '600px',
            className: 'detail-panel-drawer',
            backdrop: true,
            closable: true,
            keyboard: true
        };
    }

    override execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const presetConfig = this.getPresetConfig();
        context.param = { ...presetConfig, ...context.param };
        return super.execute<T, R>(context);
    }
}
