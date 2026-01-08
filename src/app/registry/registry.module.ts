import { NgModule, ModuleWithProviders, APP_INITIALIZER } from '@angular/core';
import { WIDGET_REGISTRY, WidgetRegistryEntry } from './tokens/widget-registry.token';
import { EVENT_REGISTRY, EventRegistryEntry } from './tokens/event-registry.token';
import { WidgetRegistryService } from './services/widget-registry.service';
import { EventRegistryService } from './services/event-registry.service';
import { initLegacyCompat } from './compat/legacy-compat';

/**
 * 兼容层初始化工厂
 */
function legacyCompatInitializer(
    widgetRegistry: WidgetRegistryService,
    eventRegistry: EventRegistryService
) {
    return () => {
        initLegacyCompat(widgetRegistry, eventRegistry);
    };
}

/**
 * Registry 模块
 * 
 * 提供组件和事件的注册系统
 * 
 * @example
 * ```typescript
 * // 在 app.config.ts 中使用
 * import { RegistryModule } from './registry';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     importProvidersFrom(RegistryModule.forRoot()),
 *     // 注册 Widget
 *     { provide: WIDGET_REGISTRY, useValue: { type: 'table', component: TableComponent }, multi: true },
 *   ]
 * };
 * ```
 */
@NgModule({})
export class RegistryModule {
    /**
     * 在应用根模块中使用
     * 
     * 初始化注册系统并配置兼容层
     */
    static forRoot(): ModuleWithProviders<RegistryModule> {
        return {
            ngModule: RegistryModule,
            providers: [
                // 提供默认空数组，避免没有任何注册时报错
                { provide: WIDGET_REGISTRY, useValue: [], multi: true },
                { provide: EVENT_REGISTRY, useValue: [], multi: true },

                // 服务（实际上已经是 providedIn: 'root'，这里再声明一次是为了明确性）
                WidgetRegistryService,
                EventRegistryService,

                // 初始化兼容层
                {
                    provide: APP_INITIALIZER,
                    useFactory: legacyCompatInitializer,
                    deps: [WidgetRegistryService, EventRegistryService],
                    multi: true
                }
            ]
        };
    }

    /**
     * 在子模块中使用（仅注册组件/事件，不重复初始化服务）
     */
    static forChild(config?: {
        widgets?: WidgetRegistryEntry[];
        events?: EventRegistryEntry[];
    }): ModuleWithProviders<RegistryModule> {
        const providers: any[] = [];

        if (config?.widgets) {
            config.widgets.forEach(widget => {
                providers.push({
                    provide: WIDGET_REGISTRY,
                    useValue: widget,
                    multi: true
                });
            });
        }

        if (config?.events) {
            config.events.forEach(event => {
                providers.push({
                    provide: EVENT_REGISTRY,
                    useValue: event,
                    multi: true
                });
            });
        }

        return {
            ngModule: RegistryModule,
            providers
        };
    }
}
