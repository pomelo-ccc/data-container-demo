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
import { ComponentContext, evaluateExpression } from '../../context/component-context.service';

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
      <nz-tag nzColor="purple" class="mode-tag">Expression Select</nz-tag>

      <div class="config-row">
        <span class="config-label">labelExpression:</span>
        <code class="config-value" [textContent]="labelExpression"></code>
      </div>
      <div class="config-row">
        <span class="config-label">valueExpression:</span>
        <code class="config-value" [textContent]="valueExpression"></code>
      </div>

      <nz-select
        class="select-input"
        [(ngModel)]="selectedValue"
        nzPlaceHolder="请选择"
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
        <div class="result-row">
          <span class="result-label">选中的 value:</span>
          <span class="result-value">{{ selectedValue }}</span>
        </div>
        <div class="result-row" *ngIf="selectedOption()">
          <span class="result-label">选中的原始对象:</span>
          <code class="result-json">{{ selectedOption() | json }}</code>
        </div>
      </div>

      <div class="options-preview">
        <div class="preview-title">选项列表预览:</div>
        <div *ngFor="let item of computedOptions(); let i = index" class="preview-row">
          <span class="preview-index">{{ i + 1 }}.</span>
          <span class="preview-label">{{ item.label }}</span>
          <span class="preview-arrow">→</span>
          <span class="preview-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
  `,
    styles: [
        `
      .select-container {
        padding: 20px;
        background: linear-gradient(135deg, #faf5ff, #f3e8ff);
        border-radius: 10px;
        border: 1px solid #c084fc;
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

      .config-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .config-label {
        font-size: 12px;
        font-weight: 600;
        color: #7c3aed;
        min-width: 120px;
      }

      .config-value {
        font-family: 'SF Mono', monospace;
        font-size: 12px;
        color: #6d28d9;
        background: #ede9fe;
        padding: 2px 8px;
        border-radius: 4px;
      }

      .select-input {
        width: 100%;
        margin: 16px 0;
      }

      .result-section {
        background: #fff;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 16px;
      }

      .result-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 8px;
      }

      .result-row:last-child {
        margin-bottom: 0;
      }

      .result-label {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        min-width: 100px;
      }

      .result-value {
        font-family: 'SF Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #7c3aed;
      }

      .result-json {
        font-family: 'SF Mono', monospace;
        font-size: 11px;
        color: #4b5563;
        background: #f3f4f6;
        padding: 4px 8px;
        border-radius: 4px;
        word-break: break-all;
      }

      .options-preview {
        background: #fff;
        border-radius: 8px;
        padding: 12px;
      }

      .preview-title {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        margin-bottom: 8px;
      }

      .preview-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #faf5ff;
        border-radius: 4px;
        margin-bottom: 4px;
      }

      .preview-row:last-child {
        margin-bottom: 0;
      }

      .preview-index {
        font-size: 11px;
        color: #9ca3af;
        min-width: 20px;
      }

      .preview-label {
        flex: 1;
        font-size: 13px;
        color: #1f2937;
      }

      .preview-arrow {
        color: #c084fc;
        font-size: 12px;
      }

      .preview-value {
        font-family: 'SF Mono', monospace;
        font-size: 12px;
        font-weight: 600;
        color: #7c3aed;
        min-width: 60px;
        text-align: right;
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
    readonly computedOptions = signal<Array<{ label: string; value: any; raw: SelectOption }>>([]);

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
