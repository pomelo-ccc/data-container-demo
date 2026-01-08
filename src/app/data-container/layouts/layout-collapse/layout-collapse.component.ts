import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RuntimeSchema, CollapseLayoutProps } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { SchemaRendererComponent } from '../../renderer/schema-renderer.component';
import { ComponentContext } from '../../../context';

/**
 * Collapse 布局组件 - 折叠面板式布局
 */
@Component({
  selector: 'app-layout-collapse',
  standalone: true,
  imports: [CommonModule, NzCollapseModule, NzIconModule, SchemaRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-collapse 
      [nzAccordion]="collapseProps.accordion || false"
      [nzBordered]="false"
      [nzExpandIconPosition]="collapseProps.expandIconPosition || 'left'">
      
      <nz-collapse-panel *ngFor="let child of children; trackBy: trackById"
        [nzHeader]="getTitle(child)"
        [nzActive]="isActive(child.id)"
        [nzDisabled]="isDisabled(child)"
        [nzExtra]="extraTpl"
        (nzActiveChange)="toggle(child, $event)">
        
        <div class="collapse-content">
             <app-schema-renderer [schema]="child" [ctx]="ctx"></app-schema-renderer>
        </div>
        
        <ng-template #extraTpl>
          <span *ngIf="getExtraIcon(child)" 
                nz-icon 
                [nzType]="getExtraIcon(child)!" 
                nzTheme="outline"></span>
        </ng-template>
      </nz-collapse-panel>
    </nz-collapse>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .collapse-content {
      padding: 8px 0;
    }
  `]
})
export class LayoutCollapseComponent {
  /** 子组件列表 */
  @Input() children: RuntimeSchema[] = [];

  /** 上下文 */
  @Input() ctx?: ComponentContext;

  /** 布局属性 */
  @Input() layoutProps: CollapseLayoutProps = {};

  /** 面板切换事件 */
  @Output() panelToggle = new EventEmitter<{ id: string; active: boolean }>();

  /** 激活的面板 ID 集合 */
  activePanels = signal<Set<string>>(new Set());

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** 获取 collapse 属性 */
  get collapseProps(): CollapseLayoutProps {
    return this.layoutProps;
  }

  /** TrackBy 函数 */
  trackById(index: number, child: RuntimeSchema): string {
    return child.id;
  }

  /** 获取标题 */
  getTitle(child: RuntimeSchema): string {
    return child.childExtras?.title || child.id || '未命名';
  }

  /** 获取额外图标 */
  getExtraIcon(child: RuntimeSchema): string | null {
    return child.childExtras?.extra?.icon ?? null;
  }

  /** 判断是否激活 */
  isActive(id: string): boolean {
    return this.activePanels().has(id);
  }

  /** 判断是否禁用 */
  isDisabled(child: RuntimeSchema): boolean {
    return child.childExtras?.disabled ?? false;
  }

  /** 切换面板状态 */
  toggle(child: RuntimeSchema, active: boolean): void {
    this.activePanels.update(panels => {
      const newPanels = new Set(panels);

      if (this.collapseProps.accordion) {
        newPanels.clear();
        if (active) {
          newPanels.add(child.id);
        }
      } else {
        if (active) {
          newPanels.add(child.id);
        } else {
          newPanels.delete(child.id);
        }
      }

      return newPanels;
    });

    this.panelToggle.emit({ id: child.id, active });
    this.scope.setValue('_activePanels', Array.from(this.activePanels()));
  }
}
