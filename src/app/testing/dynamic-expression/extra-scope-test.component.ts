import {
  Component,
  inject,
  ChangeDetectionStrategy,
  Signal,
  OnInit,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ComponentContext, ContextHost } from '../../context';

@Component({
  selector: 'app-extra-scope-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzTagModule,
    NzDividerModule,
    NzIconModule,
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="test-card">
      <div class="card-header">
        <div class="header-main">
          <div class="title-group">
            <span class="component-title">Extra Scope Priority Test</span>
            <nz-tag [nzColor]="'purple'">{{ ctx.id() }}</nz-tag>
          </div>
        </div>
      </div>

      <div class="card-content">
        <!-- 3-Column Layout -->
        <div class="column">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">1. Context Data (Base)</span>
            </div>
            <div class="data-form">
              <div class="form-group">
                <label>user.name</label>
                <input nz-input [(ngModel)]="ctxName" (ngModelChange)="updateContext()" />
              </div>
              <div class="form-group">
                <label>user.role</label>
                <input nz-input [(ngModel)]="ctxRole" (ngModelChange)="updateContext()" />
              </div>
              <div class="form-group highlight-group">
                <label>$label (Global)</label>
                <input nz-input [(ngModel)]="ctxLabel" (ngModelChange)="updateContext()" placeholder="Context Label" />
              </div>
            </div>
             <div class="data-preview">
                Target: <code>{{ target1 }}</code>
            </div>
          </div>
        </div>

        <div class="column">
          <div class="panel">
            <div class="panel-header">
              <span class="panel-title">2. Extra Scope A (Signal)</span>
              <nz-tag nzColor="orange">High Priority</nz-tag>
            </div>
            <div class="data-form">
               <div class="form-group">
                <label>user.name (Overrides Base)</label>
                <input nz-input [(ngModel)]="scopeAName" (ngModelChange)="updateScopeA()" />
              </div>
              <div class="form-group">
                <label>status</label>
                <input nz-input [(ngModel)]="scopeAStatus" (ngModelChange)="updateScopeA()" />
              </div>
              <div class="form-group highlight-group">
                <label>$label (Override)</label>
                <input nz-input [(ngModel)]="scopeALabel" (ngModelChange)="updateScopeA()" placeholder="Leave empty to use Context" />
                <div class="hint" *ngIf="!scopeALabel">Using Context Value</div>
              </div>
            </div>
            <div class="data-preview">
                Target: <code>{{ target2 }}</code>
            </div>
          </div>
        </div>

        <div class="column">
           <div class="panel result-panel">
            <div class="panel-header">
              <span class="panel-title">3. Result (Mixed)</span>
            </div>
            <div class="monitor-grid">
               <div class="monitor-item full-width">
                <label>Expression 1</label>
                <code class="expr-code">{{ expr1Preview }}</code>
                <div class="value highlight">{{ sigExpr1() }}</div>
                <div class="source-hint">
                    Should be: <span class="badge orange">Scope A</span>
                </div>
              </div>

              <div class="monitor-item full-width">
                <label>Expression 2</label>
                <code class="expr-code">{{ expr2Preview }}</code>
                <div class="value highlight">{{ sigExpr2() }}</div>
                <div class="source-hint">
                    Should be: <span class="badge blue">Context</span>
                </div>
              </div>

               <div class="monitor-item full-width">
                <label>Expression 3 (Composite)</label>
                <code class="expr-code">{{ expr3Preview }}</code>
                <div class="value highlight">{{ sigExpr3() }}</div>
              </div>

              <div class="monitor-item full-width">
                <label>Expression 4 (Label Override)</label>
                <code class="expr-code">{{ expr4Preview }}</code>
                <div class="value highlight large">{{ sigExpr4() }}</div>
                <div class="source-hint">
                  Source: 
                  <span class="badge" [class.orange]="!!scopeALabel" [class.blue]="!scopeALabel">
                    {{ scopeALabel ? 'Scope A' : 'Context' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; }
    .test-card {
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      max-width: 1000px;
      margin: 0 auto;
    }
    .card-header {
      padding: 16px 24px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
    }
    .component-title { font-weight: 600; font-size: 16px; margin-right: 12px; }
    
    .card-content {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      padding: 24px;
    }

    .panel { border: 1px solid #f0f0f0; border-radius: 6px; padding: 16px; height: 100%; }
    .result-panel { background: #f9f9f9; border-color: #d9d9d9; }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      gap: 8px;
    }
    .panel-title {
      font-size: 13px;
      font-weight: 600;
      color: #595959;
      text-transform: uppercase;
    }

    .data-form .form-group { margin-bottom: 12px; }
    .data-form label { display: block; font-size: 12px; color: #8c8c8c; margin-bottom: 4px; }
    
    .highlight-group {
      background: #f0f5ff;
      padding: 8px;
      border-radius: 4px;
      border: 1px dashed #adc6ff;
    }

    .hint { font-size: 10px; color: #999; margin-top: 4px; font-style: italic; }

    .data-preview {
        margin-top: 16px;
        font-size: 11px;
        color: #bfbfbf;
        text-align: center;
    }

    .monitor-item { margin-bottom: 20px; }
    .expr-code { 
        display: block; 
        background: #e6f7ff; 
        color: #096dd9; 
        padding: 6px 10px; 
        border-radius: 4px; 
        font-size: 11px;
        margin-bottom: 8px;
        font-family: monospace;
        border: 1px solid #bae7ff;
    }
    .value {
        font-size: 16px;
        font-weight: 500;
        color: #262626;
        padding: 10px 12px;
        background: #fff;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        min-height: 42px;
        display: flex;
        align-items: center;
    }
    /* 模仿截图中的蓝色边框样式 */
    .value.highlight { 
        color: #1890ff; 
        border-color: #91d5ff; 
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
        font-weight: 600;
    }
    .value.large { font-size: 18px; }
    
    .source-hint { font-size: 11px; color: #8c8c8c; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
    .badge { padding: 2px 6px; border-radius: 3px; color: #fff; font-size: 10px; font-weight: 600; }
    .badge.orange { background: #fa8c16; }
    .badge.blue { background: #1890ff; }
  `]
})
export class ExtraScopeTestComponent extends ContextHost implements OnInit {
  protected override contextType = 'extra-scope-test';
  protected override contextId = 'test-root';

  // 1. Context Data Local State
  ctxName = 'ParentUser';
  ctxRole = 'Admin';
  ctxLabel = 'Global Label';

  // 2. Extra Scope A (Signal)
  scopeAName = 'RowUser';
  scopeAStatus = 'Active';
  scopeALabel = ''; // Empty means undefined in our logic

  // Define signal with type
  readonly extraScopeA = signal<Record<string, any>>({
    user: { name: 'RowUser' },
    status: 'Active'
  });

  target1 = '{ user: { name, role }, $label }';
  target2 = '{ user: { name }, status, $label? }';
  expr1Preview = '${user.name}';
  expr2Preview = '${user.role}';
  expr3Preview = '${user.name} is ${user.role} (${status})';
  expr4Preview = '${label}';

  // Signals
  sigExpr1!: Signal<string>;
  sigExpr2!: Signal<string>;
  sigExpr3!: Signal<string>;
  sigExpr4!: Signal<string>;

  override ngOnInit(): void {
    super.ngOnInit();

    // 初始化 Context Data
    this.updateContext();

    // 创建测试信号
    // 使用 extraScopes 参数
    this.sigExpr1 = this.ctx.createExpressionSignal<string>('${user.name}', {
      extraScopes: [this.extraScopeA]
    });

    this.sigExpr2 = this.ctx.createExpressionSignal<string>('${user.role}', {
      extraScopes: [this.extraScopeA]
    });

    this.sigExpr3 = this.ctx.createExpressionSignal<string>('${user.name} is ${user.role} (${status})', {
      extraScopes: [this.extraScopeA]
    });

    this.sigExpr4 = this.ctx.createExpressionSignal<string>('${label}');
  }

  updateContext() {
    this.ctx.setData('user', {
      name: this.ctxName,
      role: this.ctxRole
    });

  }

  updateScopeA() {
    const newData: Record<string, any> = {
      user: { name: this.scopeAName },
      status: this.scopeAStatus
    };

    // 只有当 localLabel 有值时才设置到 extraScope 中
    if (this.scopeALabel && this.scopeALabel.trim() !== '') {
      newData['$label'] = this.scopeALabel;
    }
    // 如果没有值，不设置该 key，这样 Object.assign 合并时就不会覆盖 Context 中的值
    // （或者 Context 的值就会透传过来，前提是 scopeData 包含了 Context）

    // 注意：createExpressionSignal 的逻辑是：final = { ...base } + extra。
    // 如果 extra 里没这个 key，final 里就保留 base 的值。

    this.extraScopeA.set(newData);
  }
}
