import { Provider } from '@angular/core';
import { WIDGET_REGISTRY, WidgetRegistryEntry } from '../registry';

// 导入所有 Widget 组件
import { TableWidgetComponent } from './widgets/table/table-widget.component';
import { FormWidgetComponent } from './widgets/form/form-widget.component';
import { ButtonWidgetComponent } from './widgets/button/button-widget.component';
import { ListWidgetComponent } from './widgets/list/list-widget.component';
import { PageWidgetComponent } from './widgets/page/page-widget.component';
import { ContainerComponent } from './container/container.component';

/**
 * Data Container 模块的 Widget 注册列表
 */
export const DATA_CONTAINER_WIDGETS: WidgetRegistryEntry[] = [
    {
        type: 'table',
        component: TableWidgetComponent,
        metadata: { displayName: '表格', category: 'data' }
    },
    {
        type: 'form',
        component: FormWidgetComponent,
        metadata: { displayName: '表单', category: 'input' }
    },
    {
        type: 'button',
        component: ButtonWidgetComponent,
        metadata: { displayName: '按钮', category: 'action' }
    },
    {
        type: 'list',
        component: ListWidgetComponent,
        metadata: { displayName: '列表', category: 'data' }
    },
    {
        type: 'page',
        component: PageWidgetComponent,
        metadata: { displayName: '页面', category: 'layout' }
    },
    {
        type: 'container',
        component: ContainerComponent,
        metadata: { displayName: '容器', category: 'layout' }
    },
];

/**
 * Data Container 模块的 Providers
 * 
 * 在 app.config.ts 中使用：
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     ...DATA_CONTAINER_PROVIDERS,
 *   ]
 * };
 * ```
 */
export const DATA_CONTAINER_PROVIDERS: Provider[] = DATA_CONTAINER_WIDGETS.map(entry => ({
    provide: WIDGET_REGISTRY,
    useValue: entry,
    multi: true
}));
