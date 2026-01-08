import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetSchema, NormalLayoutProps } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { SchemaRendererComponent } from '../../renderer/schema-renderer.component';
import { ComponentContext } from '../../../context';

/**
 * Normal 布局组件 - 简单的列表渲染
 */
@Component({
  selector: 'app-layout-normal',
  standalone: true,
  imports: [CommonModule, SchemaRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-normal" [ngStyle]="containerStyle">
      <div *ngFor="let child of children; trackBy: trackById" class="layout-normal-item">
         <app-schema-renderer [schema]="child" [ctx]="ctx"></app-schema-renderer>
      </div>
    </div>
  `,
  styles: [`
    .layout-normal {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .layout-normal-item {
      width: 100%;
    }
    
    :host-context(.layout-row) .layout-normal {
      flex-direction: row;
    }
  `]
})
export class LayoutNormalComponent {
  /** 子组件列表 */
  @Input() children: WidgetSchema[] = [];

  /** 上下文 */
  @Input() ctx?: ComponentContext;

  /** 布局属性 */
  @Input() layoutProps: NormalLayoutProps = {};

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** TrackBy 函数 */
  trackById(index: number, child: WidgetSchema): string {
    return child.id;
  }

  /** 计算容器样式 */
  get containerStyle(): Record<string, string> {
    const { gap, direction } = this.layoutProps;
    return {
      gap: gap ? `${gap}px` : '16px',
      flexDirection: direction === 'row' ? 'row' : 'column'
    };
  }
}
