import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutType, RuntimeSchema, LayoutProps } from '../models/schema.interface';
import { ComponentContext } from '../../context';
import { LayoutTabsComponent } from './layout-tabs/layout-tabs.component';
import { LayoutCollapseComponent } from './layout-collapse/layout-collapse.component';
import { LayoutSplitterComponent } from './layout-splitter/layout-splitter.component';
import { LayoutNormalComponent } from './layout-normal/layout-normal.component';

/**
 * 布局渲染器组件
 * 职责：根据 layout 类型分发到具体的布局组件 (Tabs, Collapse, Splitter, Normal)
 */
@Component({
    selector: 'app-layout-renderer',
    standalone: true,
    imports: [
        CommonModule,
        LayoutTabsComponent,
        LayoutCollapseComponent,
        LayoutSplitterComponent,
        LayoutNormalComponent
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <ng-container [ngSwitch]="layout">
      
      <!-- Tabs 布局 -->
      <app-layout-tabs *ngSwitchCase="'tabs'"
        [children]="children"
        [layoutProps]="getProps('tabs')"
        [ctx]="ctx">
      </app-layout-tabs>
      
      <!-- Collapse 布局 -->
      <app-layout-collapse *ngSwitchCase="'collapse'"
        [children]="children"
        [layoutProps]="getProps('collapse')"
        [ctx]="ctx">
      </app-layout-collapse>
      
      <!-- Splitter 布局 -->
      <app-layout-splitter *ngSwitchCase="'splitter'"
        [children]="children"
        [layoutProps]="getProps('splitter')"
        [ctx]="ctx">
      </app-layout-splitter>
      
      <!-- Normal 布局 (默认) -->
      <app-layout-normal *ngSwitchDefault
        [children]="children"
        [layoutProps]="getProps('normal')"
        [ctx]="ctx">
      </app-layout-normal>

    </ng-container>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class LayoutRendererComponent {
    /** 布局类型 */
    @Input() layout: LayoutType = 'normal';

    /** 子组件列表 (已过滤可见性) */
    @Input() children: RuntimeSchema[] = [];

    /** 布局属性 */
    @Input() layoutProps: LayoutProps | undefined;

    /** 上下文 */
    @Input() ctx?: ComponentContext;

    /** 获取指定类型的 Props (带类型转换) */
    getProps(type: string): any {
        return this.layoutProps || {};
    }
}
