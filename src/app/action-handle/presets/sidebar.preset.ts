import { Injectable } from '@angular/core';
import { IPresetStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam } from '../interfaces/render-param.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { DrawerStrategy } from '../strategies/drawer.strategy';

/**
 * 侧边栏预设
 * 
 * 用于显示导航或工具面板的侧边栏
 * 
 * @example
 * ```typescript
 * this.actionFactory.drawer('sidebar')
 *   .content(NavigationComponent)
 *   .open();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class SidebarPreset extends DrawerStrategy implements IPresetStrategy {
    readonly presetType = 'sidebar';

    getPresetConfig(): Partial<RenderParam> {
        return {
            type: 'drawer',
            position: 'right',
            width: '300px',
            className: 'sidebar-drawer',
            backdrop: false,
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
