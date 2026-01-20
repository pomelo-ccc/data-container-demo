import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  Signal,
  OnInit,
  OnDestroy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ComponentContext } from '../../context/component-context.service';

interface UserData {
  name: string;
  age: number;
  dog: {
    name: string;
    age: number;
    breed: string;
    color: string;
  };
}

/**
 * 列表项配置
 */
export interface ListItemConfig {
  id: string;
  label?: string;
  labelExpression?: string;
  visibleExpression?: string;
  disabledExpression?: string;
}

/**
 * 派生后的列表项（带计算结果）
 */
interface DerivedListItem {
  id: string;
  config: ListItemConfig;
  label: Signal<string>;
  visible: Signal<boolean>;
  disabled: Signal<boolean>;
}

/**
 * 表达式执行计数器（用于调试）
 */
const expressionCounter = new Map<string, number>();

function trackExpressionExecution(expression: string): void {
  const count = (expressionCounter.get(expression) ?? 0) + 1;
  expressionCounter.set(expression, count);
}

@Component({
  selector: 'app-nested-child',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzInputModule,
    NzButtonModule,
    NzInputNumberModule,
    NzTagModule,
    NzDividerModule,
    NzIconModule
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="child-card">
      <!-- Header Area -->
      <div class="card-header">
        <div class="header-main">
          <div class="title-group">
            <span class="component-title">Child #{{ index }}</span>
            <nz-tag [nzColor]="'blue'">{{ ctx.id() }}</nz-tag>
          </div>
          <button nz-button nzType="link" nzSize="small" (click)="printExpressionCounts()">
            <span nz-icon nzType="bug"></span> Debug Counts
          </button>
        </div>
      </div>

      <div class="card-content">
        <!-- Left Column: Monitor & Controls -->
        <div class="column left-col">
          
          <!-- Monitor Section -->
          <div class="panel monitor-panel">
            <div class="panel-header">
              <span class="panel-title">Expression Monitor</span>
            </div>
            <div class="monitor-grid">
              <div class="monitor-item">
                <label>Name</label>
                <div class="value">{{ sigUserName() }}</div>
              </div>
              <div class="monitor-item">
                <label>Dog Name</label>
                <div class="value">{{ sigDogName() }}</div>
              </div>
              <div class="monitor-item">
                <label>Dog Age</label>
                <div class="value number">{{ sigDogAge() }}</div>
              </div>
              <div class="monitor-item">
                <label>Dog Breed</label>
                <div class="value">{{ sigDogBreed() }}</div>
              </div>
              <div class="monitor-item full-width">
                <label>Composite</label>
                <div class="value highlight">{{ sigCombined() }}</div>
              </div>
              <div class="monitor-item full-width">
                <label>Local Value</label>
                <div class="value code">{{ sigLocalValue() }}</div>
              </div>
            </div>
          </div>

          <!-- Controls Section -->
          <div class="panel control-panel">
            <div class="panel-header">
              <span class="panel-title">Data Controls</span>
              <nz-tag *ngIf="hasLocalUser()" nzColor="green">Local Override Active</nz-tag>
            </div>
            
            <div class="control-form">
              <div class="form-group">
                <label>User Name</label>
                <div class="input-group">
                  <input nz-input [(ngModel)]="editUserName" placeholder="Edit name..." />
                  <button nz-button nzType="default" (click)="updateUserName()">Set</button>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Dog Name</label>
                  <div class="input-group">
                    <input nz-input [(ngModel)]="editDogName" placeholder="Name..." />
                    <button nz-button nzType="default" (click)="updateDogName()">Set</button>
                  </div>
                </div>
                <div class="form-group">
                  <label>Dog Age</label>
                  <div class="input-group">
                    <nz-input-number [(ngModel)]="editDogAge" [nzMin]="0" [nzMax]="30" style="width: 100%"></nz-input-number>
                    <button nz-button nzType="default" (click)="updateDogAge()">Set</button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Local Data</label>
                <div class="input-group">
                  <input nz-input [(ngModel)]="localInput" placeholder="Local value..." />
                  <button nz-button nzType="default" (click)="setLocalData()">Set</button>
                </div>
              </div>

              <div class="action-footer" *ngIf="hasLocalUser()">
                <button nz-button nzDanger nzBlock (click)="removeLocalUser()">
                  Remove Local Override (Revert to Parent)
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: derived List -->
        <div class="column right-col">
          <div class="panel list-panel">
             <div class="panel-header">
              <span class="panel-title">Dynamic Derived List</span>
              <nz-tag>{{ derivedList().length }} Items</nz-tag>
            </div>
            
            <div class="list-container" *ngIf="derivedList().length > 0; else emptyState">
              <ng-container *ngFor="let item of derivedList(); trackBy: trackItem">
                <div class="list-card" *ngIf="item.visible()" [class.disabled]="item.disabled()">
                  <div class="list-card-content">
                    <div class="list-card-header">
                      <span class="item-label">{{ item.label() }}</span>
                      <nz-tag *ngIf="item.disabled()" nzColor="default">Disabled</nz-tag>
                    </div>
                    <div class="list-card-meta">
                      <code>{{ item.config.labelExpression || item.config.label }}</code>
                    </div>
                  </div>
                  <div class="list-card-action">
                    <button 
                      nz-button 
                      nzType="primary" 
                      [disabled]="item.disabled()"
                      (click)="onItemClick(item)"
                    >
                      Action
                    </button>
                  </div>
                </div>
              </ng-container>
            </div>
            <ng-template #emptyState>
              <div class="empty-state">No items available</div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    
    .child-card {
      background: #fff;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      overflow: hidden;
      margin-bottom: 24px;
      transition: all 0.3s;
    }
    .child-card:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      border-color: #e6e6e6;
    }

    /* Header */
    .card-header {
      padding: 12px 20px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .component-title {
      font-weight: 600;
      font-size: 14px;
      color: #1f1f1f;
    }

    /* Content Layout */
    .card-content {
      padding: 20px;
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      background: #fff;
    }
    
    /* Panel Styles */
    .panel {
      margin-bottom: 24px;
    }
    .panel:last-child { margin-bottom: 0; }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .panel-title {
      font-size: 12px;
      font-weight: 600;
      color: #8c8c8c;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Monitor Grid */
    .monitor-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f9f9f9;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #f0f0f0;
    }
    .monitor-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .monitor-item.full-width {
      grid-column: span 2;
    }
    .monitor-item label {
      font-size: 11px;
      color: #999;
    }
    .monitor-item .value {
      font-size: 13px;
      font-weight: 500;
      color: #262626;
      word-break: break-all;
    }
    .monitor-item .value.highlight { color: #1890ff; }
    .monitor-item .value.code { color: #52c41a; font-family: monospace; font-size: 12px; }

    /* Control Form */
    .control-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      color: #595959;
      margin-bottom: 4px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .input-group {
      display: flex;
      gap: 0;
    }
    .input-group input, .input-group nz-input-number {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
    .input-group button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-left: none;
      background: #f5f5f5;
      color: #595959;
    }
    .input-group button:hover {
      color: #1890ff;
      background: #e6f7ff;
    }
    .action-footer {
      margin-top: 8px;
    }

    /* List Action Styles */
    .list-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .list-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fff;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .list-card:hover {
      border-color: #91d5ff;
      background: #e6f7ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .list-card.disabled {
      background: #f5f5f5;
      border-color: #d9d9d9;
      opacity: 0.7;
    }
    .list-card.disabled:hover {
      transform: none;
      box-shadow: none;
      background: #f5f5f5;
      border-color: #d9d9d9;
    }

    .list-card-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .list-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .item-label {
      font-size: 14px;
      font-weight: 500;
      color: #1f1f1f;
    }
    .list-card-meta code {
      font-size: 11px;
      color: #8c8c8c;
      background: rgba(0,0,0,0.04);
      padding: 2px 4px;
      border-radius: 2px;
    }
    
    .empty-state {
      padding: 32px;
      text-align: center;
      color: #bfbfbf;
      background: #fafafa;
      border-radius: 6px;
      border: 1px dashed #d9d9d9;
    }
  `]
})
export class NestedChildComponent implements OnInit, OnDestroy {
  @Input() index = 0;

  // 直接接收 Signal 类型的输入
  @Input() list!: Signal<ListItemConfig[]>;

  readonly ctx = inject(ComponentContext);

  sigUserName!: Signal<string>;
  sigDogName!: Signal<string>;
  sigDogAge!: Signal<number>;
  sigDogBreed!: Signal<string>;
  sigCombined!: Signal<string>;
  sigLocalValue!: Signal<string>;

  // 派生列表：使用 computed 基于 list input 派生
  readonly derivedList = computed(() => {
    const items = this.list();
    console.log('[Child #' + this.index + '] derivedList computed 执行, items:', items.length);
    return items.map(item => this.createDerivedItem(item));
  });

  editUserName = '';
  editDogName = '';
  editDogAge = 0;
  localInput = '';

  ngOnInit(): void {
    this.ctx.init({ id: 'child-' + this.index + '-' + Date.now(), type: 'nested-child', instance: this });

    // 创建带追踪的表达式 Signal
    this.sigUserName = this.createTrackedExpressionSignal('${user.name}');
    this.sigDogName = this.createTrackedExpressionSignal('${user.dog.name}');
    this.sigDogAge = this.createTrackedExpressionSignal('${user.dog.age}');
    this.sigDogBreed = this.createTrackedExpressionSignal('${user.dog.breed}');
    this.sigCombined = this.createTrackedExpressionSignal('${user.name}的${user.dog.name}');
    this.sigLocalValue = this.createTrackedExpressionSignal('${localValue}');

    this.ctx.setData('localValue', '子组件' + this.index + '的本地数据');

    console.log('[Child #' + this.index + '] 创建, ID: ' + this.ctx.id());
  }

  ngOnDestroy(): void {
    console.log('[Child #' + this.index + '] 销毁, ID: ' + this.ctx.id());
  }

  /**
   * 创建带执行追踪的表达式 Signal
   */
  private createTrackedExpressionSignal<T>(expression: string): Signal<T> {
    const baseSignal = this.ctx.createExpressionSignal<T>(expression);
    return computed(() => {
      trackExpressionExecution(expression);
      return baseSignal();
    });
  }

  /**
   * 创建单个派生列表项
   */
  private createDerivedItem(item: ListItemConfig): DerivedListItem {
    return {
      id: item.id,
      config: item,
      label: this.deriveLabel(item),
      visible: this.deriveVisible(item),
      disabled: this.deriveDisabled(item),
    };
  }

  /**
   * 派生 label：优先使用 labelExpression，否则使用 label 静态值
   */
  private deriveLabel(item: ListItemConfig): Signal<string> {
    if (item.labelExpression) {
      return this.createTrackedExpressionSignal<string>(item.labelExpression);
    }
    return computed(() => item.label ?? item.id);
  }

  /**
   * 派生 visible：如果有 visibleExpression 则计算，否则默认 true
   */
  private deriveVisible(item: ListItemConfig): Signal<boolean> {
    if (item.visibleExpression) {
      return this.createTrackedExpressionSignal<boolean>(item.visibleExpression);
    }
    return computed(() => true);
  }

  /**
   * 派生 disabled：如果有 disabledExpression 则计算，否则默认 false
   */
  private deriveDisabled(item: ListItemConfig): Signal<boolean> {
    if (item.disabledExpression) {
      return this.createTrackedExpressionSignal<boolean>(item.disabledExpression);
    }
    return computed(() => false);
  }

  trackItem(_index: number, item: DerivedListItem): string {
    return item.id;
  }

  onItemClick(item: DerivedListItem): void {
    console.log('[Child #' + this.index + '] 点击项:', item.id, 'label:', item.label());
  }

  /**
   * 打印表达式执行计数
   */
  printExpressionCounts(): void {
    console.log('===== 表达式执行计数 =====');
    const sorted = [...expressionCounter.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([expr, count]) => {
      console.log(`  ${expr}: ${count}次`);
    });
    console.log('=========================');
  }

  updateUserName(): void {
    // 获取当前继承的 user 数据，然后在当前层设置新值
    const user = this.ctx.lookupData<UserData>('user');
    if (user) {
      this.ctx.setData('user', { ...user, name: this.editUserName });
      console.log('[Child #' + this.index + '] 修改 user.name = "' + this.editUserName + '" (当前层)');
    }
  }

  updateDogName(): void {
    const user = this.ctx.lookupData<UserData>('user');
    if (user) {
      this.ctx.setData('user', { ...user, dog: { ...user.dog, name: this.editDogName } });
      console.log('[Child #' + this.index + '] 修改 dog.name = "' + this.editDogName + '" (当前层)');
    }
  }

  updateDogAge(): void {
    const user = this.ctx.lookupData<UserData>('user');
    if (user) {
      this.ctx.setData('user', { ...user, dog: { ...user.dog, age: this.editDogAge } });
      console.log('[Child #' + this.index + '] 修改 dog.age = ' + this.editDogAge + ' (当前层)');
    }
  }

  setLocalData(): void {
    this.ctx.setData('localValue', this.localInput);
    console.log('[Child #' + this.index + '] 设置本地数据 = "' + this.localInput + '"');
  }

  /**
   * 检查当前层是否有本地的 user 数据（而非继承自父级）
   */
  hasLocalUser(): boolean {
    return this.ctx.hasData('user');
  }

  /**
   * 移除当前层的 user 数据，移除后会回退到继承父级的 user
   */
  removeLocalUser(): void {
    if (this.ctx.hasData('user')) {
      this.ctx.deleteData('user');
      console.log('[Child #' + this.index + '] 移除本层 user，现在继承父级');
    }
  }
}
