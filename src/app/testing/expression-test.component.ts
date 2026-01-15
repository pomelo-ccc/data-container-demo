import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ComponentContext, ContextHost } from '../context';
import { DynamicExpressionParentComponent } from './dynamic-expression/parent.component';

// 全局计数器挂在 window 上
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
    <div class="warp-panel">
      <div class="title-bar">
        <div class="window-controls">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="title">Expression Signal Test</span>
      </div>

      <div class="content">
        <div class="block">
          <div class="block-label">Variables</div>
          <div class="input-grid">
            <div class="input-item">
              <span class="var-name">a</span>
              <input nz-input [(ngModel)]="inputA" class="warp-input" />
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateA()"
              >
                设置
              </button>
              <span class="var-current">{{ dataA() }}</span>
            </div>
            <div class="input-item">
              <span class="var-name">b</span>
              <nz-input-number
                [(ngModel)]="inputB"
                [nzMin]="0"
                class="warp-input-number"
              ></nz-input-number>
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateB()"
              >
                设置
              </button>
              <span class="var-current">{{ dataB() }}</span>
            </div>
          </div>
        </div>

        <div class="block">
          <div class="block-label">Expressions</div>
          <div class="expr-list">
            <div class="expr-row">
              <code class="expr-code">$&#123;a&#125;</code>
              <span class="expr-arrow">→</span>
              <span class="expr-result">{{ exprA() }}</span>
            </div>
            <div class="expr-row">
              <code class="expr-code">$&#123;b&#125;</code>
              <span class="expr-arrow">→</span>
              <span class="expr-result">{{ exprB() }}</span>
            </div>
          </div>
        </div>

        <div class="hint-block">
          <span class="hint-icon">i</span>
          <span>修改 a 只触发含 a 的表达式，修改 b 只触发含 b 的表达式</span>
          <button
            nz-button
            nzType="text"
            class="warp-btn"
            (click)="printCount()"
          >
            打印次数
          </button>
        </div>
      </div>
    </div>

    <!-- 动态表达式测试: DI vs Input 方式对比 -->
    <!-- <div class="section-divider"></div>
    <app-dynamic-expression-parent></app-dynamic-expression-parent> -->
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .warp-panel {
        max-width: 520px;
        margin: 0 auto;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.04),
          0 8px 24px rgba(0, 0, 0, 0.06);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text',
          sans-serif;
      }

      .title-bar {
        height: 40px;
        background: #f7f7f7;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        align-items: center;
        padding: 0 14px;
        gap: 10px;
      }

      .window-controls {
        display: flex;
        gap: 6px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .dot.red {
        background: #ff5f57;
      }
      .dot.yellow {
        background: #febc2e;
      }
      .dot.green {
        background: #28c840;
      }

      .title {
        flex: 1;
        text-align: center;
        font-size: 12px;
        color: #666;
        font-weight: 500;
        margin-right: 52px;
      }

      .content {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .block {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .block-label {
        font-size: 11px;
        font-weight: 600;
        color: #8e8e93;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .input-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .input-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #ebebeb;
      }

      .var-name {
        font-family: 'SF Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #007aff;
        min-width: 16px;
      }

      .var-current {
        margin-left: auto;
        font-family: 'SF Mono', monospace;
        font-size: 12px;
        color: #8e8e93;
        background: #f0f0f0;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .warp-input {
        width: 140px !important;
        border-radius: 6px !important;
        border-color: #d1d1d6 !important;
        font-size: 13px !important;
      }

      .warp-input-number {
        width: 140px !important;
      }

      ::ng-deep .warp-input-number .ant-input-number {
        border-radius: 6px !important;
        border-color: #d1d1d6 !important;
      }

      .warp-btn {
        font-size: 13px !important;
        font-weight: 500 !important;
        color: #007aff !important;
        padding: 4px 12px !important;
        height: auto !important;
        border-radius: 6px !important;
      }

      .warp-btn:hover {
        background: rgba(0, 122, 255, 0.08) !important;
      }

      .expr-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .expr-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: #f9f9f9;
        border-radius: 8px;
        border: 1px solid #ebebeb;
      }

      .expr-code {
        font-family: 'SF Mono', monospace;
        font-size: 12px;
        color: #666;
        background: #ebebeb;
        padding: 3px 8px;
        border-radius: 4px;
        min-width: 120px;
      }

      .expr-arrow {
        color: #c7c7cc;
        font-size: 12px;
      }

      .expr-result {
        font-family: 'SF Mono', monospace;
        font-size: 14px;
        font-weight: 500;
        color: #1c1c1e;
        flex: 1;
      }

      .hint-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        border-radius: 8px;
        border: 1px solid #bae6fd;
        font-size: 12px;
        color: #0369a1;
      }

      .hint-icon {
        width: 18px;
        height: 18px;
        background: #0ea5e9;
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
      }

      .section-divider {
        height: 24px;
      }
    `,
  ],
})
export class ExpressionTestComponent extends ContextHost {
  protected override contextType = 'test';
  protected override contextId = 'expr-test';

  inputA = 'Hello';
  inputB = 42;

  // 响应式数据显示
  readonly dataA = this.ctx.createExpressionSignal<string>('${a}');
  readonly dataB = this.ctx.createExpressionSignal<number>('${b}');

  // 表达式中使用 window.__exprCount 计数
  readonly exprA = this.ctx.createExpressionSignal<string>(
    '${(__exprCount.a++, b)}'
  );
  readonly exprB = this.ctx.createExpressionSignal<number>(
    '${(__exprCount.b++, b)}'
  );

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData(
      {
        a: 'Hello',
        b: 42,
      },
      { replace: true }
    );
  }

  updateA(): void {
    this.ctx.setData('a', this.inputA);
  }

  updateB(): void {
    this.ctx.setData('b', this.inputB);
  }

  printCount(): void {
    const count = (window as any).__exprCount;
    console.log('表达式执行次数:', count);
    console.log('  ${a}:', count.a);
    console.log('  ${b}:', count.b);
    console.log('  ${a} is ${b}:', count.ab);
  }
}
