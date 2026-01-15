import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  Signal,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ComponentContext } from '../../context/component-context.service';

/**
 * 表达式对象类型
 * key: 标签名
 * value: 表达式字符串
 */
export type ExpressionMap = Record<string, string>;

/**
 * DI 方式子组件
 *
 * 接收一个表达式对象，包含多个表达式，数量不确定
 */
@Component({
  selector: 'app-dynamic-field',
  standalone: true,
  imports: [CommonModule, NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field-container">
      <nz-tag nzColor="blue" class="mode-tag">DI</nz-tag>
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
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        border-radius: 8px;
        border: 1px solid #93c5fd;
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
        color: #1e40af;
        min-width: 80px;
      }

      .expression {
        font-family: 'SF Mono', monospace;
        font-size: 11px;
        color: #3b82f6;
        background: #dbeafe;
        padding: 3px 8px;
        border-radius: 4px;
        flex: 1;
        word-break: break-all;
      }

      .arrow {
        color: #60a5fa;
        font-size: 14px;
      }

      .result {
        font-family: 'SF Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #1e40af;
        min-width: 80px;
      }
    `,
  ],
})
export class DynamicFieldComponent implements OnInit, OnChanges {
  /**
   * 表达式对象
   */
  @Input({ required: true }) expressions!: ExpressionMap;

  /**
   * 通过 DI 注入父组件的 ComponentContext
   */
  readonly ctx = inject(ComponentContext);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ownerId = `dynamic-field-${++dynamicFieldOwnerCounter}`;

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
    this.destroyRef.onDestroy(() => {
      this.ctx.removeExpressionOwner(this.ownerId);
    });
    this._syncEntries();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('expressions' in changes) {
      this._syncEntries();
    }
  }

  private _syncEntries(): void {
    const expressions = this.expressions ?? {};

    this.ctx.setExpressionOwnerExpressions(
      this.ownerId,
      Object.values(expressions)
    );

    const entries = Object.entries(expressions).map(([key, expression]) => ({
      key,
      expression,
      signal: this.ctx.createExpressionSignal(expression),
    }));

    this.resultEntries.set(entries);
  }
}

let dynamicFieldOwnerCounter = 0;
