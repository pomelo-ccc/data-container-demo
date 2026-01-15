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
      <nz-tag nzColor="orange" class="mode-tag">Input</nz-tag>
      <div class="expression-list">
        <div *ngFor="let item of resultEntries()" class="expression-row">
          <span class="label">{{ item.key }}</span>
          <code class="expression" [textContent]="item.expression"></code>
          <span class="arrow">→</span>
          <span class="result">{{ item.signal() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .field-container {
        padding: 16px;
        background: linear-gradient(135deg, #fffbeb, #fef3c7);
        border-radius: 8px;
        border: 1px solid #fcd34d;
        position: relative;
      }

      .mode-tag {
        position: absolute;
        top: -10px;
        right: 10px;
        font-size: 10px !important;
        line-height: 16px !important;
        height: 18px !important;
        padding: 0 6px !important;
      }

      .expression-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .expression-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .label {
        font-size: 12px;
        font-weight: 600;
        color: #92400e;
        min-width: 80px;
      }

      .expression {
        font-family: 'SF Mono', monospace;
        font-size: 11px;
        color: #d97706;
        background: #fef3c7;
        padding: 3px 8px;
        border-radius: 4px;
        flex: 1;
        word-break: break-all;
      }

      .arrow {
        color: #f59e0b;
        font-size: 14px;
      }

      .result {
        font-family: 'SF Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #92400e;
        min-width: 80px;
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
