/**
 * ActionHandle 模块公共导出
 * 
 * 提供统一的 Modal/Drawer 管理系统
 */

// Module
export { ActionHandleModule } from './action-handle.module';

// Interfaces
export {
    RenderParam,
    DialogType,
    DialogPosition,
    BackdropConfig,
    createDefaultRenderParam
} from './interfaces/render-param.interface';

export {
    DialogRef,
    DialogConfig
} from './interfaces/dialog-ref.interface';

export {
    DialogEvent,
    DialogEventType,
    RefreshEventData,
    DataEventData,
    createRefreshEvent,
    createDataEvent,
    createBroadcastEvent
} from './interfaces/dialog-event.interface';

export {
    IActionStrategy,
    IDialogStrategy,
    IPresetStrategy,
    ActionContext,
    ActionResult,
    isPresetStrategy,
    isDialogStrategy,
    isDialogRef
} from './interfaces/strategy.interface';

// ===== 主入口服务 =====
export { ActionHandleService, ActionType } from './action-handle.service';

// Services
export { ActionFactoryService, ModalBuilder, DrawerBuilder } from './factory/action-factory.service';
export { DialogCoordinatorService } from './coordinator/dialog-coordinator.service';
export { PresetRegistryService, PRESET_REGISTRY } from './presets/preset.registry';

// Strategies - UI
export { ModalStrategy } from './strategies/modal.strategy';
export { DrawerStrategy } from './strategies/drawer.strategy';

// Strategies - Non-UI
export { EventStrategy } from './strategies/event.strategy';
export { ExternalStrategy } from './strategies/external.strategy';
export { OpenBlankStrategy } from './strategies/open-blank.strategy';
export { CoverStrategy } from './strategies/cover.strategy';

// Strategy Registry (for extending)
export {
    ACTION_STRATEGY_REGISTRY,
    ActionStrategyEntry,
    provideActionStrategies
} from './strategies/strategy.registry';

// Presets
export { ConfirmPreset } from './presets/confirm.preset';
export { ObjectSelectorPreset } from './presets/object-selector.preset';
export { DetailPanelPreset } from './presets/detail-panel.preset';
export { SidebarPreset } from './presets/sidebar.preset';


