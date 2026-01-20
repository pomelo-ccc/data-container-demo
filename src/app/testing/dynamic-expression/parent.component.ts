import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ComponentContext, ContextHost } from '../../context';
import { NestedChildComponent, ListItemConfig } from './nested-test.component';
import { ExtraScopeTestComponent } from './extra-scope-test.component';

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
 * 父组件 - 嵌套属性测试
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
    NestedChildComponent,
    ExtraScopeTestComponent,
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <!-- 左侧：父组件数据控制 -->
      <aside class="sidebar">
        <div class="section">
          <h3 class="section-title">父组件数据</h3>

          <div class="data-group">
            <div class="group-label">user.name</div>
            <div class="field-row">
              <input nz-input [(ngModel)]="inputUserName" />
              <button nz-button nzType="primary" (click)="updateUserName()">
                设置
              </button>
            </div>
            <span class="current">{{ getUserData()?.name }}</span>
          </div>

          <div class="data-group">
            <div class="group-label">user.dog.name</div>
            <div class="field-row">
              <input nz-input [(ngModel)]="inputDogName" />
              <button nz-button nzType="primary" (click)="updateDogName()">
                设置
              </button>
            </div>
            <span class="current">{{ getUserData()?.dog?.name }}</span>
          </div>

          <div class="data-group">
            <div class="group-label">user.dog.age</div>
            <div class="field-row">
              <nz-input-number
                [(ngModel)]="inputDogAge"
                [nzMin]="0"
                [nzMax]="30"
              ></nz-input-number>
              <button nz-button nzType="primary" (click)="updateDogAge()">
                设置
              </button>
            </div>
            <span class="current">{{ getUserData()?.dog?.age }}</span>
          </div>

          <div class="data-group">
            <div class="group-label">user.dog.breed</div>
            <div class="field-row">
              <input nz-input [(ngModel)]="inputDogBreed" />
              <button nz-button nzType="primary" (click)="updateDogBreed()">
                设置
              </button>
            </div>
            <span class="current">{{ getUserData()?.dog?.breed }}</span>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">当前数据</h3>
          <pre class="data-preview">{{ ctx.getAllData() | json }}</pre>
        </div>

        <div class="section">
          <h3 class="section-title">父组件表达式</h3>
          <table class="expr-table">
            <tr>
              <td>user.name</td>
              <td class="val">{{ sigUserName() }}</td>
            </tr>
            <tr>
              <td>user.dog.name</td>
              <td class="val">{{ sigDogName() }}</td>
            </tr>
            <tr>
              <td>user.dog.age</td>
              <td class="val">{{ sigDogAge() }}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <button
            nz-button
            nzType="dashed"
            class="full-btn"
            (click)="printRegistry()"
          >
            打印 Registry
          </button>
        </div>
      </aside>

      <!-- 右侧：子组件管理 -->
      <main class="main">
        <!-- Extra Scope 测试区域 -->
        <app-extra-scope-test></app-extra-scope-test>
        
        <div class="divider" style="margin: 40px 0; border-top: 1px dashed #e8e8e8;"></div>

        <div class="toolbar">
          <h2 class="main-title">嵌套组件测试</h2>
          <div class="toolbar-actions">
            <button nz-button nzType="primary" (click)="addChild()">
              + 添加子组件
            </button>
            <button
              nz-button
              nzType="default"
              (click)="removeLastChild()"
              [disabled]="childCount() === 0"
            >
              - 移除最后一个
            </button>
            <button
              nz-button
              nzType="default"
              (click)="removeAllChildren()"
              [disabled]="childCount() === 0"
            >
              清空全部
            </button>
          </div>
        </div>

        <div class="info-bar">
          <span
            >当前子组件数量: <strong>{{ childCount() }}</strong></span
          >
          <span
            >父组件 ID: <code>{{ ctx.id() }}</code></span
          >
        </div>

        <div class="children-container">
          <app-nested-child
            *ngFor="let child of children(); trackBy: trackChild"
            [index]="child.index"
            [list]="listConfig"
          ></app-nested-child>

          <div class="empty-state" *ngIf="childCount() === 0">
            <p>暂无子组件</p>
            <p class="hint">
              点击"添加子组件"创建新的子组件，观察表达式依赖行为
            </p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        background: #f5f5f5;
      }

      .page {
        display: grid;
        grid-template-columns: 320px 1fr;
        height: 100%;
      }

      .sidebar {
        background: #fff;
        border-right: 1px solid #e8e8e8;
        padding: 20px;
        overflow-y: auto;
      }

      .section {
        margin-bottom: 24px;
      }

      .section-title {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        margin: 0 0 12px 0;
        text-transform: uppercase;
      }

      .data-group {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f5f5f5;
      }

      .group-label {
        font-size: 12px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
        font-family: monospace;
      }

      .field-row {
        display: flex;
        gap: 8px;
        margin-bottom: 4px;
      }

      .field-row input,
      .field-row nz-input-number {
        flex: 1;
      }

      .current {
        font-size: 12px;
        color: #1890ff;
        font-family: monospace;
      }

      .data-preview {
        background: #fafafa;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        padding: 12px;
        font-size: 11px;
        font-family: monospace;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-all;
        max-height: 200px;
        overflow-y: auto;
      }

      .expr-table {
        width: 100%;
        font-size: 12px;
      }

      .expr-table td {
        padding: 6px 0;
        border-bottom: 1px solid #f5f5f5;
      }

      .expr-table .val {
        text-align: right;
        font-family: monospace;
        color: #1890ff;
        font-weight: 500;
      }

      .full-btn {
        width: 100%;
      }

      .main {
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .main-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .toolbar-actions {
        display: flex;
        gap: 8px;
      }

      .info-bar {
        display: flex;
        gap: 24px;
        padding: 10px 14px;
        background: #e6f7ff;
        border: 1px solid #91d5ff;
        border-radius: 4px;
        margin-bottom: 16px;
        font-size: 13px;
      }

      .info-bar code {
        font-family: monospace;
        background: #fff;
        padding: 1px 6px;
        border-radius: 3px;
        font-size: 11px;
      }

      .children-container {
        flex: 1;
        min-height: 200px;
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #999;
      }

      .empty-state p {
        margin: 0 0 8px 0;
      }

      .empty-state .hint {
        font-size: 12px;
        color: #bbb;
      }

      .test-hints {
        margin-top: 24px;
        padding: 16px;
        background: #fffbe6;
        border: 1px solid #ffe58f;
        border-radius: 4px;
      }

      .test-hints h4 {
        margin: 0 0 12px 0;
        font-size: 13px;
        color: #d48806;
      }

      .test-hints ul {
        margin: 0;
        padding-left: 20px;
        font-size: 12px;
        color: #666;
      }

      .test-hints li {
        margin-bottom: 6px;
      }
    `,
  ],
})
export class DynamicExpressionParentComponent extends ContextHost {
  protected override contextType = 'parent';
  protected override contextId = 'nested-parent';

  inputUserName = '张三';
  inputDogName = '旺财';
  inputDogAge = 3;
  inputDogBreed = '金毛';

  readonly children = signal<Array<{ id: string; index: number }>>([]);
  readonly childCount = signal(0);
  private childCounter = 0;

  sigUserName = this.ctx.createExpressionSignal<string>('${user.name}');
  sigDogName = this.ctx.createExpressionSignal<string>('${user.dog.name}');
  sigDogAge = this.ctx.createExpressionSignal<number>('${user.dog.age}');

  // 列表配置：包含动态表达式（signal 类型）
  readonly listConfig = signal<ListItemConfig[]>([
    {
      id: 'item1',
      labelExpression: '${user.name}的操作项',
      visibleExpression: '${user.dog.age > 0}',
      disabledExpression: '${user.dog.age < 2}',
    },
    {
      id: 'item2',
      labelExpression: '${user.dog.name}的按钮',
      visibleExpression: '${user.dog.breed === "金毛"}',
    },
    {
      id: 'item3',
      label: '静态标签项',
      disabledExpression: '${user.age > 50}',
    },
    {
      id: 'item4',
      labelExpression: '狗龄: ${user.dog.age}岁',
      visibleExpression: '${user.dog.age >= 3}',
    },
  ]);

  override ngOnInit(): void {
    super.ngOnInit();

    this.ctx.setData('user', {
      name: '张三',
      age: 30,
      dog: {
        name: '旺财',
        age: 3,
        breed: '金毛',
        color: '金色',
      },
    });

    console.log('[Parent] 初始化完成, ID:', this.ctx.id());
  }

  getUserData(): UserData | undefined {
    return this.ctx.getData('user') as UserData | undefined;
  }

  trackChild(_index: number, child: { id: string; index: number }): string {
    return child.id;
  }

  updateUserName(): void {
    const user = this.getUserData();
    if (user) {
      this.ctx.setData('user', { ...user, name: this.inputUserName });
      console.log('[Parent] 修改 user.name =', this.inputUserName);
    }
  }

  updateDogName(): void {
    const user = this.getUserData();
    if (user) {
      this.ctx.setData('user', {
        ...user,
        dog: { ...user.dog, name: this.inputDogName },
      });
      console.log('[Parent] 修改 dog.name =', this.inputDogName);
    }
  }

  updateDogAge(): void {
    const user = this.getUserData();
    if (user) {
      this.ctx.setData('user', {
        ...user,
        dog: { ...user.dog, age: this.inputDogAge },
      });
      console.log('[Parent] 修改 dog.age =', this.inputDogAge);
    }
  }

  updateDogBreed(): void {
    const user = this.getUserData();
    if (user) {
      this.ctx.setData('user', {
        ...user,
        dog: { ...user.dog, breed: this.inputDogBreed },
      });
      console.log('[Parent] 修改 dog.breed =', this.inputDogBreed);
    }
  }

  addChild(): void {
    this.childCounter++;
    const newChild = {
      id: `child-${this.childCounter}`,
      index: this.childCounter,
    };
    this.children.update((list) => [...list, newChild]);
    this.childCount.set(this.children().length);
    console.log('[Parent] 添加子组件 #' + this.childCounter);
  }

  removeLastChild(): void {
    const list = this.children();
    if (list.length > 0) {
      const removed = list[list.length - 1];
      this.children.update((l) => l.slice(0, -1));
      this.childCount.set(this.children().length);
      console.log('[Parent] 移除子组件 #' + removed.index);
    }
  }

  removeAllChildren(): void {
    console.log('[Parent] 清空所有子组件');
    this.children.set([]);
    this.childCount.set(0);
  }

  printRegistry(): void {
    const registry = (this.ctx as any).registry;
    if (registry) {
      console.log('===== Registry 状态 =====');
      console.log('组件数量:', registry.size);
      console.log('所有ID:', registry.getAllIds());
      registry.getAll().forEach((ctx: any) => {
        console.log(`  - ${ctx.id()} (${ctx.type()})`);
      });
    }
  }
}
