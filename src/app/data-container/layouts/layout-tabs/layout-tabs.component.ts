import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { RuntimeSchema, TabsLayoutProps } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { SchemaRendererComponent } from '../../renderer/schema-renderer.component';
import { ComponentContext } from '../../../context';

/**
 * Tabs 布局组件 - 选项卡式布局
 */
@Component({
  selector: 'app-layout-tabs',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzBadgeModule, SchemaRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-tabset 
    [nzCentered]="true"
      [nzType]="tabsProps.type || 'line'"
      [nzTabPosition]="tabsProps.tabPosition || 'top'"
      [nzSelectedIndex]="selectedIndex()"
      (nzSelectedIndexChange)="handleSwitch($event)">
      
      <nz-tab *ngFor="let child of children; let i = index; trackBy: trackById"
      
              [nzTitle]="getTitle(child)"
              [nzDisabled]="isDisabled(child)">
        <!-- 
          懒加载策略:
          - destroyInactive=true: 只渲染当前激活的 tab
          - destroyInactive=false (默认): 首次访问后保持渲染
        -->
        <ng-template nz-tab>
          <div class="tab-content" *ngIf="!tabsProps.destroyInactive || selectedIndex() === i">
             <app-schema-renderer [schema]="child" [ctx]="ctx"></app-schema-renderer>
          </div>
        </ng-template>
      </nz-tab>
    </nz-tabset>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .tab-content {
      padding: 16px 0;
    }
    
    ::ng-deep .ant-tabs-nav {
      margin-bottom: 0 !important;
    }
  `]
})
export class LayoutTabsComponent implements OnChanges {
  /** 子组件列表 */
  @Input() children: RuntimeSchema[] = [];

  /** 上下文 */
  @Input() ctx?: ComponentContext;

  /** 布局属性 */
  @Input() layoutProps: TabsLayoutProps = {};

  /** Tab 切换事件 */
  @Output() tabSwitch = new EventEmitter<{ index: number; child: RuntimeSchema }>();

  /** 当前选中索引 */
  selectedIndex = signal(0);

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** 获取 tabs 属性 */
  get tabsProps(): TabsLayoutProps {
    return this.layoutProps;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['layoutProps'] || changes['children']) {
      this.syncActiveKey();
    }
  }

  private syncActiveKey(): void {
    const props = this.layoutProps as any;
    const activeKey = props.activeKey || props.defaultActiveKey;

    if (activeKey && this.children.length > 0) {
      const index = this.children.findIndex(c => c.id === activeKey);
      if (index !== -1 && index !== this.selectedIndex()) {
        this.selectedIndex.set(index);
      }
    }
  }

  /** TrackBy 函数 */
  trackById(index: number, child: RuntimeSchema): string {
    return child.id;
  }

  /** 获取标题 */
  getTitle(child: RuntimeSchema): string {
    return child.childExtras?.title || child.id || '未命名';
  }

  /** 处理 Tab 切换 */
  handleSwitch(index: number): void {
    this.selectedIndex.set(index);
    const child = this.children[index];
    if (child) {
      this.tabSwitch.emit({ index, child });
      this.scope.setValue('_activeTab', child.id);
    }
  }

  /** 判断是否禁用 */
  isDisabled(child: RuntimeSchema): boolean {
    return child.childExtras?.disabled ?? false;
  }
}
