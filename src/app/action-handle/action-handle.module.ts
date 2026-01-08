import { NgModule, ModuleWithProviders } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';

// Main Entry Service
import { ActionHandleService } from './action-handle.service';

// Services
import { DialogCoordinatorService } from './coordinator/dialog-coordinator.service';
import { ActionFactoryService } from './factory/action-factory.service';
import { PresetRegistryService, PRESET_REGISTRY } from './presets/preset.registry';

// Strategy Registry
import { ACTION_STRATEGY_REGISTRY } from './strategies/strategy.registry';

// UI Strategies
import { ModalStrategy } from './strategies/modal.strategy';
import { DrawerStrategy } from './strategies/drawer.strategy';

// Non-UI Strategies
import { EventStrategy } from './strategies/event.strategy';
import { ExternalStrategy } from './strategies/external.strategy';
import { OpenBlankStrategy } from './strategies/open-blank.strategy';
import { CoverStrategy } from './strategies/cover.strategy';

// Presets
import { ConfirmPreset } from './presets/confirm.preset';
import { ObjectSelectorPreset } from './presets/object-selector.preset';
import { DetailPanelPreset } from './presets/detail-panel.preset';
import { SidebarPreset } from './presets/sidebar.preset';


/**
 * ActionHandle 模块
 * 
 * 提供统一的 Modal/Drawer 管理系统
 * 
 * @example
 * ```typescript
 * // app.config.ts
 * import { ActionHandleModule } from './action-handle';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     importProvidersFrom(ActionHandleModule.forRoot()),
 *   ]
 * };
 * 
 * // 使用
 * @Component({...})
 * class MyComponent {
 *   private actionHandle = inject(ActionHandleService);
 *   
 *   open() {
 *     this.actionHandle.modal(MyDialog, { id: 123 });
 *   }
 * }
 * ```
 */
@NgModule({
    imports: [
        NzModalModule,
        NzDrawerModule
    ]
})
export class ActionHandleModule {
    /**
     * 在应用根模块中使用
     */
    static forRoot(): ModuleWithProviders<ActionHandleModule> {
        return {
            ngModule: ActionHandleModule,
            providers: [
                // 主入口服务
                ActionHandleService,

                // 核心服务
                DialogCoordinatorService,
                ActionFactoryService,
                PresetRegistryService,

                // ===== 策略注册 (通过 ACTION_STRATEGY_REGISTRY) =====
                // UI 策略
                ModalStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'modal', strategy: ModalStrategy }, multi: true },

                DrawerStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'drawer', strategy: DrawerStrategy }, multi: true },

                // 非 UI 策略
                EventStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'event', strategy: EventStrategy }, multi: true },

                ExternalStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'external', strategy: ExternalStrategy }, multi: true },

                OpenBlankStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'openBlank', strategy: OpenBlankStrategy }, multi: true },

                CoverStrategy,
                { provide: ACTION_STRATEGY_REGISTRY, useValue: { type: 'cover', strategy: CoverStrategy }, multi: true },

                // ===== 预设注册 (通过 PRESET_REGISTRY) =====
                ConfirmPreset,
                { provide: PRESET_REGISTRY, useExisting: ConfirmPreset, multi: true },

                ObjectSelectorPreset,
                { provide: PRESET_REGISTRY, useExisting: ObjectSelectorPreset, multi: true },

                DetailPanelPreset,
                { provide: PRESET_REGISTRY, useExisting: DetailPanelPreset, multi: true },

                SidebarPreset,
                { provide: PRESET_REGISTRY, useExisting: SidebarPreset, multi: true }
            ]
        };
    }

    /**
     * 在子模块中使用（添加额外预设）
     */
    static forChild(presets?: any[]): ModuleWithProviders<ActionHandleModule> {
        const providers: any[] = [];

        if (presets) {
            presets.forEach(preset => {
                providers.push(preset);
                providers.push({ provide: PRESET_REGISTRY, useExisting: preset, multi: true });
            });
        }

        return {
            ngModule: ActionHandleModule,
            providers
        };
    }
}

