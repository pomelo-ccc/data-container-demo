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
import { ComponentContext } from '../../context/component-context.service';

/**
 * 表达式对象类型
 */
export type ExpressionMap = Record<string, string>;

/**
 * DI 方式子组件 - 简洁表格风格
 */
@Component({
  selector: 'app-dynamic-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="expr-table">
      <thead>
        <tr>
          <th class="col-key">字段</th>
          <th class="col-expr">表达式</th>
          <th class="col-result">结果</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let item of resultEntries()">
          <td class="col-key">
            <span class="key">{{ item.key }}</span>
          </td>
          <td class="col-expr">
            <code [textContent]="item.expression"></code>
          </td>
          <td class="col-result">
            <span class="value">{{ item.signal() }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .expr-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .expr-table th,
      .expr-table td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #f0f0f0;
      }

      .expr-table th {
        font-weight: 500;
        color: #666;
        background: #fafafa;
        font-size: 12px;
      }

      .col-key {
        width: 100px;
      }

      .col-expr {
        width: auto;
      }

      .col-result {
        width: 120px;
      }

      .key {
        font-family: 'SF Mono', Consolas, monospace;
        font-size: 12px;
        font-weight: 500;
        color: #333;
      }

      code {
        font-family: 'SF Mono', Consolas, monospace;
        font-size: 11px;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        color: #666;
        display: inline-block;
        max-width: 280px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .value {
        font-family: 'SF Mono', Consolas, monospace;
        font-weight: 500;
        color: #1890ff;
      }

      tr:hover {
        background: #fafafa;
      }
    `,
  ],
})
export class DynamicFieldComponent implements OnInit, OnChanges {
  @Input({ required: true }) expressions!: ExpressionMap;

  readonly ctx = inject(ComponentContext);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ownerId = `dynamic-field-${++dynamicFieldOwnerCounter}`;

  readonly resultEntries = signal<
    Array<{ key: string; expression: string; signal: Signal<any> }>
  >([]);

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
