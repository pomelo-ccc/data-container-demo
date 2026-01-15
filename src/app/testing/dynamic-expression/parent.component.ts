import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ComponentContext, ContextExprPipe, ContextHost } from '../../context';
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
 *
 * Design: Swiss / International Typographic Style
 * - Strict grid system
 * - Minimalist, objective, clear
 * - Sans-serif typography (Helvetica/Arial)
 * - Limited color palette
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
    ContextExprPipe,
    DynamicFieldComponent,
    DynamicFieldInputComponent,
    ExpressionSelectComponent,
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="neubrutal-container">
      <!-- Header -->
      <header class="panel-header">
        <div class="header-left">
          <div class="logo-box">NB</div>
          <h1 class="header-title">Dynamic Expression</h1>
        </div>
        <div class="header-actions">
          <button class="btn-action primary" (click)="printCount()">
            🖨 LOG STATS
          </button>
        </div>
      </header>

      <div class="panel-body">
        <!-- Left Column: Controls (Scrollable) -->
        <div class="panel-col col-control">
          <section class="card-box">
            <h2 class="card-title">DATA SOURCE</h2>
            <div class="card-content">
              <div class="control-group">
                <div class="control-row">
                  <label>NAME</label>
                  <div class="input-group">
                    <input nz-input [(ngModel)]="inputName" />
                    <button class="btn-mini" (click)="updateName()">SET</button>
                  </div>
                  <div class="value-tag">{{ ctx.getData('name') }}</div>
                </div>

                <div class="control-row">
                  <label>AGE</label>
                  <div class="input-group">
                    <nz-input-number
                      [(ngModel)]="inputAge"
                      [nzMin]="0"
                    ></nz-input-number>
                    <button class="btn-mini" (click)="updateAge()">SET</button>
                  </div>
                  <div class="value-tag">{{ ctx.getData('age') }}</div>
                </div>

                <div class="control-row">
                  <label>STATUS</label>
                  <div class="input-group">
                    <input nz-input [(ngModel)]="inputStatus" />
                    <button class="btn-mini" (click)="updateStatus()">
                      SET
                    </button>
                  </div>
                  <div class="value-tag">{{ ctx.getData('status') }}</div>
                </div>

                <div class="control-row">
                  <label>BULK DATA (JSON)</label>
                  <textarea
                    nz-input
                    [(ngModel)]="bulkDataJson"
                    rows="4"
                  ></textarea>
                  <button
                    class="btn-action full-width"
                    (click)="updateAllData()"
                  >
                    UPDATE ALL
                  </button>
                  <div class="code-box">
                    {{ ctx.getAllData() | json }}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: Visualization (Scrollable) -->
        <div class="panel-col col-visual">
          <section class="card-box">
            <h2 class="card-title">01 / DI INJECTION</h2>
            <div class="card-content">
              <app-dynamic-field
                [expressions]="diExpressions"
              ></app-dynamic-field>
            </div>
          </section>

          <section class="card-box">
            <h2 class="card-title">02 / INPUT BINDING</h2>
            <div class="card-content">
              <app-dynamic-field-input
                [expressions]="inputExpressions"
                [inputData]="ctx.data"
              ></app-dynamic-field-input>
            </div>
          </section>

          <section class="card-box">
            <h2 class="card-title">03 / EXPRESSION SELECT</h2>
            <div class="card-content">
              <app-expression-select
                [options]="selectOptions"
                [labelExpression]="labelExpression"
                [valueExpression]="valueExpression"
              ></app-expression-select>
            </div>
          </section>

          <section class="card-box">
            <h2 class="card-title">04 / TEMPLATE PIPE</h2>
            <div class="card-content">
              <div class="pipe-list">
                <div class="pipe-item">
                  <code>&#36;&#123;name&#125;</code>
                  <span class="arrow">➔</span>
                  <span class="result">{{ exampleName | ctxExpr }}</span>
                </div>
                <div class="pipe-item">
                  <code>&#36;&#123;age&#125;</code>
                  <span class="arrow">➔</span>
                  <span class="result">{{ exampleAge | ctxExpr }}</span>
                </div>
                <div class="pipe-item">
                  <code>&#36;&#123;name&#125; | upper</code>
                  <span class="arrow">➔</span>
                  <span class="result">
                    {{ exampleUpper | ctxExpr }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div class="footer-note">
            <p>NB-UI v1.0 // NO COMPROMISE</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* Neubrutalism Style */
      @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@700;900&family=Space+Mono:wght@400;700&display=swap');

      :host {
        --nb-bg: #fffbf0; /* Cream */
        --nb-primary: #8b5cf6; /* Violet */
        --nb-secondary: #f472b6; /* Pink */
        --nb-accent: #34d399; /* Green */
        --nb-border: #000;
        --nb-shadow: 4px 4px 0 #000;
        --nb-radius: 0;

        display: block;
        height: 100vh;
        overflow: hidden;
        background-color: var(--nb-bg);
        color: #000;
        font-family: 'Public Sans', sans-serif;
      }

      .neubrutal-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      /* Header */
      .panel-header {
        height: 80px;
        flex-shrink: 0;
        background: #fff;
        border-bottom: 3px solid var(--nb-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        z-index: 10;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .logo-box {
        width: 48px;
        height: 48px;
        background: #000;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 20px;
        border: 2px solid #000;
        transform: rotate(-3deg);
      }

      .header-title {
        font-size: 24px;
        font-weight: 900;
        text-transform: uppercase;
        margin: 0;
        letter-spacing: -1px;
      }

      /* Body Layout */
      .panel-body {
        flex: 1;
        display: grid;
        grid-template-columns: 380px 1fr;
        overflow: hidden;
      }

      .panel-col {
        padding: 24px;
        overflow-y: auto;
      }

      .col-control {
        background: #f1f5f9;
        border-right: 3px solid var(--nb-border);
      }

      .col-visual {
        background: var(--nb-bg);
      }

      /* Cards */
      .card-box {
        background: #fff;
        border: 3px solid var(--nb-border);
        box-shadow: var(--nb-shadow);
        margin-bottom: 32px;
        transition: transform 0.1s;
      }

      .card-box:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0 #000;
      }

      .card-title {
        background: #000;
        color: #fff;
        padding: 12px 16px;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        margin: 0;
        border-bottom: 3px solid var(--nb-border);
      }

      .card-content {
        padding: 20px;
      }

      /* Controls */
      .control-row {
        margin-bottom: 20px;
      }

      .control-row label {
        display: block;
        font-weight: 900;
        font-size: 12px;
        margin-bottom: 8px;
        text-transform: uppercase;
      }

      .input-group {
        display: flex;
        gap: 0;
        margin-bottom: 8px;
      }

      input[nz-input],
      textarea[nz-input],
      nz-input-number {
        border: 2px solid var(--nb-border) !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        font-family: 'Space Mono', monospace;
        font-size: 14px;
        background: #fff;
      }

      input[nz-input]:focus,
      textarea[nz-input]:focus {
        background: #fff0f5;
      }

      .btn-mini {
        background: var(--nb-accent);
        border: 2px solid var(--nb-border);
        border-left: none;
        font-weight: 900;
        padding: 0 16px;
        cursor: pointer;
        transition: all 0.1s;
      }

      .btn-mini:hover {
        background: #10b981;
      }

      .btn-mini:active {
        background: #000;
        color: #fff;
      }

      .btn-action {
        background: #fff;
        border: 2px solid var(--nb-border);
        box-shadow: 2px 2px 0 #000;
        padding: 10px 24px;
        font-weight: 900;
        cursor: pointer;
        transition: all 0.1s;
        text-transform: uppercase;
      }

      .btn-action.primary {
        background: var(--nb-primary);
        color: #fff;
      }

      .btn-action:hover {
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0 #000;
      }

      .btn-action:active {
        transform: translate(2px, 2px);
        box-shadow: 0 0 0 #000;
      }

      .btn-action.full-width {
        width: 100%;
        margin: 12px 0;
        background: var(--nb-secondary);
      }

      .value-tag {
        display: inline-block;
        background: #e2e8f0;
        border: 2px solid #000;
        padding: 4px 8px;
        font-family: 'Space Mono', monospace;
        font-size: 12px;
        font-weight: 700;
      }

      .code-box {
        background: #000;
        color: #0f0;
        padding: 12px;
        font-family: 'Space Mono', monospace;
        font-size: 11px;
        border: 2px solid #000;
        white-space: pre-wrap;
        word-break: break-all;
      }

      /* Pipes */
      .pipe-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .pipe-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px;
        background: #f8fafc;
        border: 2px solid #000;
      }

      .pipe-item code {
        font-family: 'Space Mono', monospace;
        background: #e2e8f0;
        padding: 4px 8px;
        font-weight: 700;
      }

      .arrow {
        font-weight: 900;
      }

      .result {
        font-weight: 900;
        color: var(--nb-primary);
        font-size: 16px;
        background: #ede9fe;
        padding: 2px 6px;
        border: 1px solid var(--nb-primary);
      }

      .footer-note {
        margin-top: 40px;
        text-align: center;
        font-family: 'Space Mono', monospace;
        color: #666;
        font-size: 12px;
        opacity: 0.5;
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

  // 表达式模板变量 (绑定到模板以避免转义问题)
  labelExpression = "${a} - ${b}岁 (${c ? '合格' : '不合格'})";
  valueExpression = '${e}';
  exampleName = '${name}';
  exampleAge = '${age}';
  exampleUpper = '${name} | upper';

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
