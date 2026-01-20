import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  Signal,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import {
  ComponentContext,
  evaluateExpression,
} from '../../context/component-context.service';

/**
 * 下拉选项类型
 */
export interface SelectOption {
  a: string;
  b: number;
  c: boolean;
  d: string;
  e: number;
  [key: string]: any;
}

/**
 * 带表达式的下拉列表组件 - 简洁风格
 */
@Component({
  selector: 'app-expression-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="select-wrapper">
      <div class="config-info">
        <div class="config-item">
          <span class="label">label:</span>
          <code [textContent]="labelExpression"></code>
        </div>
        <div class="config-item">
          <span class="label">value:</span>
          <code [textContent]="valueExpression"></code>
        </div>
      </div>

      <nz-select
        class="select-input"
        [(ngModel)]="selectedValue"
        nzPlaceHolder="请选择..."
        nzShowSearch
        (ngModelChange)="onSelectionChange($event)"
      >
        <nz-option
          *ngFor="let item of computedOptions()"
          [nzLabel]="item.label"
          [nzValue]="item.value"
        ></nz-option>
      </nz-select>

      <div class="result-info" *ngIf="selectedValue !== null">
        <span class="result-label">选中值:</span>
        <span class="result-value">{{ selectedValue }}</span>
      </div>

      <div class="options-list">
        <div class="list-header">选项预览</div>
        <table class="options-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of computedOptions(); let i = index">
              <td class="idx">{{ i + 1 }}</td>
              <td>{{ item.label }}</td>
              <td class="val">{{ item.value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .select-wrapper {
        font-size: 13px;
      }

      .config-info {
        display: flex;
        gap: 24px;
        margin-bottom: 12px;
        padding: 10px 12px;
        background: #fafafa;
        border-radius: 4px;
      }

      .config-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .config-item .label {
        font-size: 12px;
        color: #666;
      }

      .config-item code {
        font-family: 'SF Mono', Consolas, monospace;
        font-size: 11px;
        background: #fff;
        border: 1px solid #e8e8e8;
        padding: 2px 6px;
        border-radius: 3px;
        color: #d63384;
      }

      .select-input {
        width: 100%;
        margin-bottom: 12px;
      }

      .result-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .result-label {
        font-size: 12px;
        color: #666;
      }

      .result-value {
        font-family: 'SF Mono', Consolas, monospace;
        font-weight: 500;
        color: #1890ff;
      }

      .options-list {
        border-top: 1px solid #f0f0f0;
        padding-top: 12px;
      }

      .list-header {
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
      }

      .options-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .options-table th,
      .options-table td {
        padding: 6px 10px;
        text-align: left;
        border-bottom: 1px solid #f5f5f5;
      }

      .options-table th {
        font-weight: 500;
        color: #999;
        font-size: 11px;
      }

      .options-table .idx {
        color: #ccc;
        width: 30px;
      }

      .options-table .val {
        font-family: 'SF Mono', Consolas, monospace;
        color: #1890ff;
      }
    `,
  ],
})
export class ExpressionSelectComponent implements OnInit {
  @Input({ required: true }) options!: Signal<SelectOption[]>;
  @Input({ required: true }) labelExpression!: string;
  @Input({ required: true }) valueExpression!: string;

  readonly ctx = inject(ComponentContext);

  selectedValue: any = null;

  readonly computedOptions = signal<
    Array<{ label: string; value: any; raw: SelectOption }>
  >([]);

  readonly selectedOption = signal<SelectOption | null>(null);

  ngOnInit(): void {
    const computedOptionsSignal = computed(() => {
      const opts = this.options();
      return opts.map((item) => ({
        label: evaluateExpression(this.labelExpression, item),
        value: evaluateExpression(this.valueExpression, item),
        raw: item,
      }));
    });

    this.computedOptions.set(computedOptionsSignal());
  }

  onSelectionChange(value: any): void {
    const option = this.computedOptions().find((o) => o.value === value);
    this.selectedOption.set(option?.raw ?? null);
  }
}
