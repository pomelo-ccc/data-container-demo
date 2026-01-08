/**
 * Registry 模块公共导出
 * 
 * 提供组件和事件的注册系统
 */

// Module
export { RegistryModule } from './registry.module';

// Tokens
export {
    WIDGET_REGISTRY,
    WidgetRegistryEntry,
    WidgetMetadata
} from './tokens/widget-registry.token';

export {
    EVENT_REGISTRY,
    EventRegistryEntry,
    EventMetadata,
    EventParamDef
} from './tokens/event-registry.token';

// Services
export { WidgetRegistryService } from './services/widget-registry.service';
export { EventRegistryService, EventHandler } from './services/event-registry.service';

// Legacy Compat (for backward compatibility)
export {
    registerWidget,
    getWidget,
    getSupportedWidgetTypes,
    registerEvent,
    unregisterEvent,
    emitEvent,
    emitEventSync
} from './compat/legacy-compat';
