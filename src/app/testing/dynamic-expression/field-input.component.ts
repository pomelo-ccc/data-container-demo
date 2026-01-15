import {
  Component,
  Input,
  ChangeDetectionStrategy,
  Signal,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { evaluateExpression } from '../../context/component-context.service';

/**
 * 表达式对象类型
 */
export type ExpressionMapInput = Record<string, string>;

/**
 * Input 方式子组件
 *
 * 接收一个表达式对象和数据 Signal
 */
@Component({
  selector: 'app-dynamic-field-input',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field-container">
      <div class="mode-badge">INPUT MODE</div>
      <div class="expression-list">
        <div *ngFor="let item of resultEntries()" class="expression-row">
          <span class="label">{{ item.key }}</span>
          <code class="expression" [textContent]="item.expression"></code>
          <span class="arrow">➜</span>
          <span class="result">{{ item.signal() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Neubrutalism - Input Component */
      @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@700;900&family=Space+Mono:wght@400;700&display=swap');

      :host {
        --nb-border: #000;
        --nb-shadow: 4px 4px 0 #000;
        --nb-green: #34d399;
      }

      .field-container {
        font-family: 'Public Sans', sans-serif;
        padding: 0;
        background: #fff;
        border: 3px solid var(--nb-border);
        box-shadow: var(--nb-shadow);
        position: relative;
        margin-bottom: 24px;
      }

      .mode-badge {
        position: absolute;
        top: -16px;
        right: 16px;
        background: var(--nb-green);
        border: 3px solid var(--nb-border);
        color: #000;
        font-weight: 900;
        padding: 4px 12px;
        transform: rotate(-2deg);
        z-index: 5;
        box-shadow: 2px 2px 0 #000;
      }

      .expression-list {
        display: flex;
        flex-direction: column;
      }

      .expression-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 3px solid var(--nb-border);
        transition: background-color 0.1s;
      }

      .expression-row:last-child {
        border-bottom: none;
      }

      .expression-row:hover {
        background: #d1fae5;
      }

      .label {
        font-weight: 900;
        text-transform: uppercase;
        background: #000;
        color: #fff;
        padding: 2px 8px;
        font-size: 12px;
      }

      .expression {
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        background: #f1f5f9;
        padding: 4px 8px;
        border: 2px solid #e2e8f0;
        flex: 1;
      }

      .arrow {
        font-weight: 900;
        font-size: 16px;
      }

      .result {
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        background: var(--nb-green);
        border: 2px solid #000;
        padding: 4px 12px;
        box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
      }
    `,
  ],
})
export class DynamicFieldInputComponent implements OnInit {
  /**
   * 表达式对象
   */
  @Input({ required: true }) expressions!: ExpressionMapInput;

  /**
   * 数据 Signal (通过 @Input 显式传递)
   */
  @Input({ required: true }) inputData!: Signal<Record<string, any>>;

  /**
   * 存储每个表达式的 Signal 结果
   */
  readonly resultEntries = signal<
    Array<{ key: string; expression: string; signal: Signal<any> }>
  >([]);

  /**
   * 在 ngOnInit 中初始化，此时 @Input 已绑定
   */
  ngOnInit(): void {
    const entries = Object.entries(this.expressions).map(
      ([key, expression]) => ({
        key,
        expression,
        signal: computed(() => {
          const data = this.inputData();
          return evaluateExpression(expression, data);
        }),
      })
    );
    this.resultEntries.set(entries);
  }
}
