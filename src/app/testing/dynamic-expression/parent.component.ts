import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ComponentContext, ContextHost } from '../../context';
import { DynamicFieldComponent, ExpressionMap } from './field.component';
import { DynamicFieldInputComponent } from './field-input.component';
import {
  ExpressionSelectComponent,
  SelectOption,
} from './expression-select.component';

// 全局计数器 - 用于统计表达式执行次数
(window as any).__exprCount = {
  name: 0,
  age: 0,
  ageCheck: 0,
  status: 0,
};

/**
 * 父组件职责:
 * 1. 持有并管理数据 (通过 ComponentContext)
 * 2. 修改数据
 * 3. 传递表达式对象给子组件
 */
@Component({
  selector: 'app-dynamic-expression-parent',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    DynamicFieldComponent,
    DynamicFieldInputComponent,
    ExpressionSelectComponent,
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
        <span class="title">Dynamic Expression Test</span>
      </div>

      <div class="content">
        <div class="block">
          <div class="block-label">Parent Data (修改这里的数据)</div>
          <div class="input-grid">
            <div class="input-item">
              <span class="var-name">name</span>
              <input nz-input [(ngModel)]="inputName" class="warp-input" />
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateName()"
              >
                设置
              </button>
              <span class="var-current">当前: {{ ctx.getData('name') }}</span>
            </div>
            <div class="input-item">
              <span class="var-name">age</span>
              <nz-input-number
                [(ngModel)]="inputAge"
                [nzMin]="0"
                class="warp-input-number"
              ></nz-input-number>
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateAge()"
              >
                设置
              </button>
              <span class="var-current">当前: {{ ctx.getData('age') }}</span>
            </div>
            <div class="input-item">
              <span class="var-name">status</span>
              <input nz-input [(ngModel)]="inputStatus" class="warp-input" />
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateStatus()"
              >
                设置
              </button>
              <span class="var-current">当前: {{ ctx.getData('status') }}</span>
            </div>
            <div class="input-item bulk-item">
              <span class="var-name">data</span>
              <textarea
                nz-input
                [(ngModel)]="bulkDataJson"
                class="warp-textarea"
                rows="3"
              ></textarea>
              <button
                nz-button
                nzType="text"
                class="warp-btn"
                (click)="updateAllData()"
              >
                整包设置
              </button>
              <span class="var-current"
                >当前: {{ ctx.getAllData() | json }}</span
              >
            </div>
          </div>
        </div>

        <div class="block">
          <div class="block-label">
            🔵 DI 方式 (子组件通过 inject 获取 Context)
          </div>
          <div class="field-list">
            <app-dynamic-field
              [expressions]="diExpressions"
            ></app-dynamic-field>
          </div>
        </div>

        <div class="block">
          <div class="block-label">🟠 Input 方式 (父组件显式传递数据)</div>
          <div class="field-list">
            <app-dynamic-field-input
              [expressions]="inputExpressions"
              [inputData]="ctx.data"
            ></app-dynamic-field-input>
          </div>
        </div>

        <div class="hint-block">
          <span class="hint-icon">i</span>
          <div class="hint-content">
            <p>
              <strong>DI 方式:</strong> 子组件只需传递 [expressions]，通过
              inject(ComponentContext) 获取数据
            </p>
            <p>
              <strong>Input 方式:</strong> 子组件需要同时传递 [expressions] 和
              [inputData]
            </p>
          </div>
          <button
            nz-button
            nzType="text"
            class="warp-btn"
            (click)="printCount()"
          >
            打印次数
          </button>
        </div>

        <div class="block">
          <div class="block-label">
            🟣 表达式下拉列表 (动态计算 label 和 value)
          </div>
          <div class="field-list">
            <app-expression-select
              [options]="selectOptions"
              labelExpression="\${a} - \${b}岁 (\${c ? '合格' : '不合格'})"
              valueExpression="\${e}"
            ></app-expression-select>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .warp-panel {
        max-width: 700px;
        margin: 0 auto;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05),
          0 4px 16px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text',
          sans-serif;
      }

      .title-bar {
        height: 44px;
        background: linear-gradient(to bottom, #f8f8f8, #f0f0f0);
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        padding: 0 16px;
        gap: 12px;
      }

      .window-controls {
        display: flex;
        gap: 8px;
      }

      .dot {
        width: 12px;
        height: 12px;
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
        font-size: 13px;
        color: #333;
        font-weight: 600;
      }

      .content {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .block {
        display: flex;
        flex-direction: column;
        gap: 12px;
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
        min-width: 60px;
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

      .field-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .bulk-item {
        align-items: flex-start;
      }

      .warp-textarea {
        width: 320px !important;
        border-radius: 6px !important;
        border-color: #d1d1d6 !important;
        font-family: 'SF Mono', monospace;
        font-size: 11px;
        line-height: 16px;
      }

      .hint-block {
        display: flex;
        align-items: flex-start;
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
        flex-shrink: 0;
        margin-top: 2px;
      }

      .hint-content {
        flex: 1;
      }

      .hint-content p {
        margin: 0 0 4px 0;
      }

      .hint-content p:last-child {
        margin-bottom: 0;
      }
    `,
  ],
})
export class DynamicExpressionParentComponent extends ContextHost {
  protected override contextType = 'parent';
  protected override contextId = 'parent';

  // 输入临时值
  inputName = 'Alice';
  inputAge = 25;
  inputStatus = 'active';
  bulkDataJson = `{"name":"Alice","age":25,"status":"active"}`;

  /**
   * DI 方式的表达式配置 (带计数器)
   */
  readonly diExpressions: ExpressionMap = {
    name: '${(__exprCount.name++, name)}',
    'age-name': '${(__exprCount.age++, age + name)}',
    isAdult: "${(__exprCount.ageCheck++, age >= 18 ? '成年' : '未成年')}",
    status:
      "${(__exprCount.status++, status === 'active' ? '✅ 活跃' : '❌ 非活跃')}",
  };

  /**
   * Input 方式的表达式配置 (不带计数器，用于对比)
   */
  readonly inputExpressions: ExpressionMap = {
    name: '${name}',
    age: '${age}',
    isAdult: "${age >= 18 ? '成年' : '未成年'}",
    status: "${status === 'active' ? '✅ 活跃' : '❌ 非活跃'}",
  };

  /**
   * 下拉列表选项 (Signal)
   * 每个选项都有 a, b, c, d, e 字段
   */
  readonly selectOptions = signal<SelectOption[]>([
    { a: '张三', b: 28, c: true, d: '工程师', e: 1001 },
    { a: '李四', b: 35, c: false, d: '设计师', e: 1002 },
    { a: '王五', b: 22, c: true, d: '产品', e: 1003 },
    { a: '赵六', b: 45, c: true, d: '经理', e: 1004 },
    { a: '钱七', b: 19, c: false, d: '实习生', e: 1005 },
  ]);

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData(
      {
        name: 'Alice',
        age: 25,
        status: 'active',
      },
      { replace: true }
    );
  }

  updateName(): void {
    this.ctx.setData('name', this.inputName);
  }

  updateAge(): void {
    this.ctx.setData('age', this.inputAge);
  }

  updateStatus(): void {
    this.ctx.setData('status', this.inputStatus);
  }

  updateAllData(): void {
    try {
      const parsed = JSON.parse(this.bulkDataJson);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('invalid');
      }
      this.ctx.setAllData(parsed as Record<string, any>, { replace: true });

      if ('name' in parsed) this.inputName = (parsed as any).name ?? '';
      if ('age' in parsed) this.inputAge = Number((parsed as any).age ?? 0);
      if ('status' in parsed) this.inputStatus = (parsed as any).status ?? '';
    } catch {
      alert(
        'JSON 无效：请输入对象，例如 {"name":"Alice","age":25,"status":"active"}'
      );
    }
  }

  printCount(): void {
    const count = (window as any).__exprCount;
    console.log('===== 表达式执行次数统计 =====');
    console.log('  ${name}:', count.name);
    console.log('  ${age}:', count.age);
    console.log('  ${age >= 18 ? ...}:', count.ageCheck);
    console.log('  ${status === ...}:', count.status);
    console.log(this.ctx);
  }
}
