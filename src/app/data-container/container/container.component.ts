import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  WidgetModel,
  RuntimeSchema,
  LayoutType,
  ValidationResult,
  SplitterLayoutProps,
  TabsLayoutProps,
  CollapseLayoutProps
} from '../models/schema.interface';
import { ScopeService } from '../services/scope.service';
import { ModelService } from '../services/model.service';
import { DataSourceService } from '../services/data-source.service';
import { SchemaRendererComponent } from '../renderer/schema-renderer.component';
import { ComponentContext, ContextHost } from '../../context';
import { LayoutRendererComponent } from '../layouts/layout-renderer.component';

/**
 * 容器组件 - 数据容器的核心组件
 * 统一处理所有布局类型，避免循环依赖
 */
@Component({
  selector: 'app-container',
  standalone: true,
  imports: [
    CommonModule,
    LayoutRendererComponent,
    SchemaRendererComponent
  ],
  providers: [ScopeService, ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 加载状态 -->
    <div class="container-loading" *ngIf="isLoading()">
      <span class="loading-text">加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div class="container-error" *ngIf="error()">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ error() }}</span>
    </div>

    <!-- 主内容 -->
    <div class="container-wrapper" 
         *ngIf="!isLoading() && !error() && runtimeSchema()?._visible !== false" 
         [ngStyle]="runtimeSchema()?.style">
      
      <!-- 布局渲染器 (处理 Tabs, Collapse, Splitter 等布局) -->
      <app-layout-renderer
        [layout]="currentLayout()"
        [children]="visibleChildren()"
        [layoutProps]="runtimeSchema()?.layoutProps"
        [ctx]="ctx">
      </app-layout-renderer>
      
      <!-- 叶子节点内容渲染 (Text) -->
      <div class="container-content" *ngIf="!hasChildren() && runtimeSchema()?.type === 'text'">
        <p class="text-content">{{ runtimeSchema()?.props?.['content'] }}</p>
      </div>
      
      <!-- 使用 Schema Renderer 渲染非容器类型 (如 Button, Form 等在顶层使用时) -->
      <app-schema-renderer 
        *ngIf="!hasChildren() && runtimeSchema()?.type !== 'text' && runtimeSchema()?.type !== 'container'"
        [schema]="runtimeSchema()!"
        [ctx]="ctx">
      </app-schema-renderer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .container-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #999;
    }
    
    .container-error {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #fff2f0;
      border: 1px solid #ffccc7;
      border-radius: 4px;
      color: #ff4d4f;
    }
    
    .error-icon {
      margin-right: 8px;
      font-size: 18px;
    }
    
    .container-wrapper {
      padding: 8px;
      border-radius: 4px;
    }
    
    .container-content {
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;
      border: 1px dashed #d9d9d9;
    }
    
    .text-content {
      margin: 0;
      color: #333;
    }
  `]
})
export class ContainerComponent extends ContextHost implements OnInit, OnDestroy {
  override contextType = 'container';
  /** 通过名称加载模型 */
  @Input() set modelName(name: string) {
    if (name && !this._initialized) {
      this._initialized = true;
      this._inputName.set(name);
      this.loadModelByName(name);
    }
  }

  /** 直接传入 schema (用于嵌套子组件) */
  @Input() set schema(value: RuntimeSchema | WidgetModel) {
    if (value && !this._initialized) {
      this._initialized = true;
      this._runtimeSchema.set(value as RuntimeSchema);
      this.checkAndFetchDataSource();
    }
  }

  /** 传入初始数据 */
  @Input() set data(value: Record<string, any>) {
    if (value) {
      this.scope.updateData(value);
    }
  }

  /** 本地 Scope 服务实例 */
  readonly scope = inject(ScopeService);

  /** 父级 Scope (可选) */
  private readonly parentScope = inject(ScopeService, { optional: true, skipSelf: true });

  /** 模型服务 */
  private readonly modelService = inject(ModelService);

  /** 数据源服务 */
  private readonly dataSourceService = inject(DataSourceService);

  /** 是否已初始化 */
  private _initialized = false;

  /** 输入的模型名称 */
  private readonly _inputName = signal<string>('');

  /** 运行时 Schema */
  private readonly _runtimeSchema = signal<RuntimeSchema | null>(null);
  readonly runtimeSchema = this._runtimeSchema.asReadonly();

  /** 验证结果 */
  private readonly _validationResult = signal<ValidationResult | null>(null);

  /** 加载状态 */
  readonly isLoading = signal(false);

  /** 错误信息 */
  readonly error = signal<string | null>(null);

  /** 当前布局类型 */
  readonly currentLayout = computed<LayoutType>(() => {
    return this.runtimeSchema()?.layout ?? 'normal';
  });

  /** 所有子组件列表 */
  readonly children = computed<RuntimeSchema[]>(() => {
    return (this.runtimeSchema()?.children as RuntimeSchema[]) ?? [];
  });

  /** 可见的子组件列表 (响应式) */
  readonly visibleChildren = computed<RuntimeSchema[]>(() => {
    const children = this.children();
    // 过滤子组件
    return children.filter(child => {
      // 1. 如果有 visibleOn 表达式，动态评估 (建立对 scope.data 的响应式依赖)
      if (child.visibleOn) {
        return this.scope.evaluateExpression(child.visibleOn);
      }
      // 2. 否则使用静态的 _visible 属性 (默认为 true)
      return child._visible !== false;
    });
  });

  /** 是否有子组件 */
  readonly hasChildren = computed<boolean>(() => {
    return this.children().length > 0;
  });

  constructor() {
    super();
  }

  /** 已注册的组件 ID */
  private _registeredId: string | null = null;

  override ngOnInit(): void {
    this.contextId = this.runtimeSchema()?.id;
    super.ngOnInit();

    if (this.parentScope) {
      this.scope.setParent(this.parentScope);
    }

    // 初始化 Schema 中的预设数据到 Context
    this.initSchemaData();
  }

  /**
   * 将 Schema 中配置的 data 加载到 Component Context
   */
  private initSchemaData(): void {
    const schemaData = this.runtimeSchema()?.data;
    if (schemaData && typeof schemaData === 'object') {
      this.ctx.setAllData(schemaData);
      this.scope.updateData(schemaData);
    }
  }

  ngOnDestroy(): void {
    this.scope.setParent(null);

    if (this._registeredId) {
      this.scope.unregisterComponent(this._registeredId);
    }
  }

  /** 获取布局属性 */
  getLayoutProp(key: string, defaultValue: any): any {
    const props = this.runtimeSchema()?.layoutProps as any;
    return props?.[key] ?? defaultValue;
  }

  /** 通过名称加载模型 */
  private loadModelByName(name: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.modelService.getModelByName(name).subscribe({
      next: (model) => {
        if (model) {
          this.processModel(model, name);
        } else {
          this.error.set(`模型不存在: ${name}`);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(`加载模型失败: ${err.message || name}`);
        this.isLoading.set(false);
      }
    });
  }

  /** 处理模型 */
  private processModel(model: WidgetModel, modelName: string): void {
    const validationResult = this.modelService.validateModel(model);
    this._validationResult.set(validationResult);

    if (!validationResult.valid) {
      console.error('Model validation failed:', validationResult.errors);
      this.error.set(`模型验证失败: ${validationResult.errors[0]?.message}`);
      return;
    }

    const runtimeSchema = this.modelService.transformToRuntimeSchema(
      model,
      modelName,
      { recursive: true }
    );

    this.modelService.updateVisibility(runtimeSchema, (expr) =>
      this.scope.evaluateExpression(expr)
    );

    this._runtimeSchema.set(runtimeSchema);

    // 注册组件 API
    if (this._registeredId) {
      this.scope.unregisterComponent(this._registeredId);
      this._registeredId = null;
    }
    if (runtimeSchema.id) {
      this._registeredId = runtimeSchema.id;
      this.scope.registerComponent(runtimeSchema.id, this.createCurrentLayoutAPI());
    }
    this.checkAndFetchDataSource();
  }

  /** 创建当前布局的 API 对象 */
  private createCurrentLayoutAPI(): any {
    return {
      /** 
       * 通用：设置布局属性 
       */
      setProperty: (key: string, value: any) => {
        const schema = this._runtimeSchema();
        if (!schema) return;

        const layout = schema.layout || 'normal';
        let validKey = false;
        let finalKey = key;

        // 布局属性类型检查与别名映射 (保持原逻辑)
        switch (layout) {
          case 'splitter': {
            const validKeys: (keyof SplitterLayoutProps)[] = ['direction', 'splitRatio', 'minSizes'];
            if (validKeys.includes(key as any)) validKey = true;
            break;
          }
          case 'tabs': {
            const validKeys: (keyof TabsLayoutProps)[] = ['defaultActiveKey', 'destroyInactive', 'tabPosition', 'type'];
            if (validKeys.includes(key as any)) validKey = true;
            // 别名支持
            if (key === 'activeKey') {
              validKey = true; // 允许运行时设置 activeKey
            }
            break;
          }
          case 'collapse': {
            const validKeys: (keyof CollapseLayoutProps)[] = ['accordion', 'bordered', 'expandIconPosition'];
            if (validKeys.includes(key as any)) validKey = true;
            break;
          }
          default:
            validKey = true;
            break;
        }

        if (!validKey) {
          console.warn(`Property '${key}' is invalid for layout '${layout}'. Operation ignored.`);
          return;
        }

        const currentProps = schema.layoutProps as any || {};
        const newProps = { ...currentProps, [finalKey]: value };

        this._runtimeSchema.update(s => s ? ({ ...s, layoutProps: newProps }) : null);
      },

      /**
       * 通用：激活子项
       */
      activateChild: (childId: string) => {
        const layout = this.currentLayout();

        if (layout === 'tabs') {
          this.createCurrentLayoutAPI().setProperty('activeKey', childId);
        } else if (layout === 'collapse') {
          // Collapse 可能需要更复杂的逻辑来同步 activePanels，
          // 这里通过更新 props 只能做到一半(如果子组件监听了props)，
          // 目前 CollapseLayoutComponent 维护自己的 activePanels 信号。
          // 真正的解决方案应该是将 State 提升或通过事件/Props 双向绑定。
          // 暂时保留空实现或尝试触发 Props 变更
          console.warn('activateChild for collapse not fully implemented in refactored version via API yet.');
        }
      },

      /**
       * 高级：切换布局类型
       */
      switchLayout: (type: LayoutType) => {
        this._runtimeSchema.update(s => s ? ({ ...s, layout: type }) : null);
      },

      /**
       * 获取当前布局类型
       */
      getLayout: (): LayoutType => {
        return this.currentLayout();
      },

      // 兼容旧 API
      setActiveKey: (key: string) => this.createCurrentLayoutAPI().activateChild(key),
      getActiveKey: () => {
        // 从 Scope 中获取当前激活的 Tab?
        // LayoutTabsComponent 更新了 scope._activeTab
        return this.scope.getValue('_activeTab');
      },
      setRatios: (ratios: number[]) => this.createCurrentLayoutAPI().setProperty('splitRatio', ratios)
    };
  }

  /** 检查并执行数据源请求 */
  private checkAndFetchDataSource(): void {
    const dataSource = this._runtimeSchema()?.dataSource;
    if (!dataSource) return;
    if (dataSource.autoLoad === false) return;

    this.dataSourceService.fetchData(dataSource, this.scope).subscribe({
      next: (data) => {
        if (data) {
          if (dataSource.dataMapping) {
            const mappedData: Record<string, any> = {};
            for (const [key, path] of Object.entries(dataSource.dataMapping)) {
              mappedData[key] = this.getValueByPath(data, path);
            }
            this.scope.updateData(mappedData);
          } else {
            this.scope.updateData({ _data: data });
          }
        }
      },
      error: (err) => {
        console.error('DataSource error:', err);
      }
    });
  }

  /** 根据路径获取对象值 */
  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
}
