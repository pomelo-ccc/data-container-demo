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
import { NzTagModule } from 'ng-zorro-antd/tag';
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
 * 带表达式的下拉列表组件
 *
 * 用法:
 * <app-expression-select
 *   [options]="optionsSignal"
 *   labelExpression="${a} - ${b}"
 *   valueExpression="${e}"
 * ></app-expression-select>
 *
 * 功能说明:
 * - options: 下拉选项数组的 Signal
 * - labelExpression: 每个选项的显示文本表达式，可以访问选项对象的字段
 * - valueExpression: 每个选项的值表达式
 */
@Component({
  selector: 'app-expression-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSelectModule, NzTagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="select-container">
      <div class="mode-badge">SELECT MODE</div>

      <div class="config-row">
        <span class="config-label">LABEL:</span>
        <code class="config-value" [textContent]="labelExpression"></code>
      </div>
      <div class="config-row">
        <span class="config-label">VALUE:</span>
        <code class="config-value" [textContent]="valueExpression"></code>
      </div>

      <nz-select
        class="select-input"
        [(ngModel)]="selectedValue"
        nzPlaceHolder="CHOOSE ONE..."
        nzShowSearch
        (ngModelChange)="onSelectionChange($event)"
      >
        <nz-option
          *ngFor="let item of computedOptions()"
          [nzLabel]="item.label"
          [nzValue]="item.value"
        ></nz-option>
      </nz-select>

      <div class="result-section">
        <div class="result-badge">OUTPUT</div>
        <div class="result-row">
          <span class="result-label">VALUE:</span>
          <span class="result-value">{{ selectedValue }}</span>
        </div>
        <div class="result-row" *ngIf="selectedOption()">
          <span class="result-label">OBJECT:</span>
          <code class="result-json">{{ selectedOption() | json }}</code>
        </div>
      </div>

      <div class="options-preview">
        <div class="preview-title">OPTIONS PREVIEW</div>
        <div
          *ngFor="let item of computedOptions(); let i = index"
          class="preview-row"
        >
          <span class="preview-index">#{{ i + 1 }}</span>
          <span class="preview-label">{{ item.label }}</span>
          <span class="preview-arrow">➜</span>
          <span class="preview-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Neubrutalism - Select Component */
      @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@700;900&family=Space+Mono:wght@400;700&display=swap');

      :host {
        --nb-border: #000;
        --nb-shadow: 4px 4px 0 #000;
        --nb-blue: #60a5fa;
      }

      .select-container {
        font-family: 'Public Sans', sans-serif;
        padding: 24px;
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
        background: var(--nb-blue);
        border: 3px solid var(--nb-border);
        color: #000;
        font-weight: 900;
        padding: 4px 12px;
        transform: rotate(2deg);
        z-index: 5;
        box-shadow: 2px 2px 0 #000;
      }

      .config-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        padding: 8px 12px;
        background: #f1f5f9;
        border: 2px solid #e2e8f0;
      }

      .config-label {
        font-weight: 900;
        font-size: 11px;
        color: #000;
        min-width: 60px;
      }

      .config-value {
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        background: #fff;
        padding: 2px 6px;
        border: 1px solid #cbd5e1;
        color: var(--nb-blue);
        font-weight: 700;
      }

      .select-input {
        width: 100%;
        margin: 20px 0;
      }

      :host ::ng-deep .select-input .ant-select-selector {
        border-radius: 0 !important;
        border: 2px solid var(--nb-border) !important;
        background: #fff !important;
        box-shadow: 4px 4px 0 #e2e8f0 !important;
        height: 48px !important;
        display: flex;
        align-items: center;
      }

      :host ::ng-deep .select-input.ant-select-focused .ant-select-selector {
        border-color: var(--nb-border) !important;
        box-shadow: 4px 4px 0 var(--nb-blue) !important;
      }

      .result-section {
        background: #f8fafc;
        padding: 20px;
        border: 2px solid var(--nb-border);
        position: relative;
        margin-bottom: 24px;
      }

      .result-badge {
        position: absolute;
        top: -12px;
        left: 12px;
        background: #000;
        color: #fff;
        font-weight: 900;
        padding: 2px 8px;
        font-size: 10px;
      }

      .result-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }

      .result-row:last-child {
        margin-bottom: 0;
      }

      .result-label {
        font-weight: 900;
        font-size: 11px;
        min-width: 60px;
      }

      .result-value {
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        background: var(--nb-blue);
        border: 2px solid #000;
        padding: 2px 8px;
      }

      .result-json {
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        background: #000;
        color: #0f0;
        padding: 8px;
        word-break: break-all;
        border: 2px solid #000;
        width: 100%;
      }

      .options-preview {
        border-top: 2px dashed #cbd5e1;
        padding-top: 16px;
      }

      .preview-title {
        font-weight: 900;
        font-size: 11px;
        margin-bottom: 12px;
        color: #64748b;
      }

      .preview-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #f1f5f9;
      }

      .preview-row:last-child {
        border-bottom: none;
      }

      .preview-index {
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        color: #94a3b8;
        font-size: 10px;
        width: 24px;
      }

      .preview-label {
        font-weight: 700;
        font-size: 12px;
        flex: 1;
      }

      .preview-arrow {
        font-weight: 900;
        font-size: 12px;
        color: #cbd5e1;
      }

      .preview-value {
        font-family: 'Space Mono', monospace;
        font-weight: 700;
        color: var(--nb-blue);
        background: #eff6ff;
        padding: 2px 6px;
        border: 1px solid #dbeafe;
      }
    `,
  ],
})
export class ExpressionSelectComponent implements OnInit {
  /**
   * 下拉选项数组 (Signal)
   */
  @Input({ required: true }) options!: Signal<SelectOption[]>;

  /**
   * 显示文本表达式
   * 例如: "${a} - ${b}" 或 "${a}(${c ? '是' : '否'})"
   */
  @Input({ required: true }) labelExpression!: string;

  /**
   * 值表达式
   * 例如: "${e}" 或 "${a + '_' + b}"
   */
  @Input({ required: true }) valueExpression!: string;

  /**
   * 通过 DI 获取父级 Context (用于访问 $item 等特殊变量)
   */
  readonly ctx = inject(ComponentContext);

  /**
   * 当前选中的值
   */
  selectedValue: any = null;

  /**
   * 计算后的选项列表
   * 根据表达式动态计算 label 和 value
   */
  readonly computedOptions = signal<
    Array<{ label: string; value: any; raw: SelectOption }>
  >([]);

  /**
   * 当前选中的原始选项对象
   */
  readonly selectedOption = signal<SelectOption | null>(null);

  ngOnInit(): void {
    // 创建一个 computed Signal 来动态计算选项
    // 当 options Signal 变化时，自动重新计算
    const computedOptionsSignal = computed(() => {
      const opts = this.options();
      return opts.map((item) => ({
        // 使用表达式计算 label
        label: evaluateExpression(this.labelExpression, item),
        // 使用表达式计算 value
        value: evaluateExpression(this.valueExpression, item),
        // 保留原始对象
        raw: item,
      }));
    });

    // 订阅 computed Signal，更新到普通 signal
    // 这样模板可以正确渲染
    this.computedOptions.set(computedOptionsSignal());

    // 使用 effect 监听变化 (如果需要动态更新)
    // 但在 Angular 16 中，我们可以在模板中直接使用 computed
  }

  onSelectionChange(value: any): void {
    const option = this.computedOptions().find((o) => o.value === value);
    this.selectedOption.set(option?.raw ?? null);
  }
}
