import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ComponentContext, ContextHost } from '../context';
import { DynamicExpressionParentComponent } from './dynamic-expression/parent.component';

// 全局计数器
(window as any).__exprCount = { a: 0, b: 0, ab: 0 };

@Component({
  selector: 'app-expression-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    DynamicExpressionParentComponent,
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 动态表达式测试页面 -->
    <app-dynamic-expression-parent></app-dynamic-expression-parent>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class ExpressionTestComponent extends ContextHost {
  protected override contextType = 'test';
  protected override contextId = 'expr-test';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData({ a: 'Hello', b: 42 }, { replace: true });
  }
}
