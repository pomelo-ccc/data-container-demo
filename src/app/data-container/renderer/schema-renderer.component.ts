import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  ViewContainerRef,
  AfterViewInit,
  OnChanges,
  OnInit,
  SimpleChanges,
  ComponentRef,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  Injector,
  Type
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeSchema, WidgetSchema } from '../models/schema.interface';
import { ScopeService } from '../services/scope.service';
import { WidgetRegistryService } from '../../registry';
import { ComponentContext } from '../../context';

/**
 * Schema 渲染器组件
 *
 * 职责:
 * 1. 根据 schema.type 动态选择对应的 Widget 组件
 * 2. 处理 text 类型
 * 3. 使用 WidgetRegistryService 获取已注册的组件
 */
@Component({
  selector: 'app-schema-renderer',
  standalone: true,
  imports: [
    CommonModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container>
      <!-- Text 类型: 直接显示文本 -->
      <div *ngIf="isText()" class="text-widget" [style]="schema.style">
        <p class="text-content">{{ schema.props?.['content'] }}</p>
      </div>
      
      <!-- 动态组件容器 (始终存在以保证 ViewChild 可用) -->
      <ng-container #container></ng-container>
      
      <!-- 未知类型的 fallback (仅当不是 text 且没有对应组件时显示) -->
      <div *ngIf="!isText() && !hasComponent()" class="unknown-widget">
        <span class="unknown-icon">❓</span>
        <span class="unknown-text">未知组件类型: {{ schema.type }}</span>
        <code class="unknown-id">ID: {{ schema.id }}</code>
      </div>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .text-widget {
      padding: 12px;
      background: #fafafa;
      border-radius: 4px;
      border: 1px dashed #d9d9d9;
    }
    
    .text-content {
      margin: 0;
      color: #333;
    }
    
    .unknown-widget {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: #fffbe6;
      border: 1px dashed #faad14;
      border-radius: 8px;
      margin: 8px 0;
    }
    
    .unknown-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    
    .unknown-text {
      color: #faad14;
      font-weight: 500;
      margin-bottom: 4px;
    }
    
    .unknown-id {
      font-size: 12px;
      color: #999;
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 4px;
    }
  `]
})
export class SchemaRendererComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  /** Schema 配置 */
  @Input() schema!: RuntimeSchema | WidgetSchema;

  /** 传入的 ComponentContext (由父组件传递) */
  @Input() ctx?: ComponentContext;

  /** 注入 Scope 服务 (向后兼容) */
  protected readonly scope = inject(ScopeService);

  /** 注入 Widget 注册服务 */
  private readonly widgetRegistry = inject(WidgetRegistryService);

  /** 变更检测器 */
  private readonly cdr = inject(ChangeDetectorRef);

  /** Injector */
  private readonly injector = inject(Injector);

  /** 视图容器引用 */
  @ViewChild('container', { read: ViewContainerRef }) viewContainerRef!: ViewContainerRef;

  /** 当前组件引用 */
  private componentRef: ComponentRef<any> | null = null;

  /** 组件是否已准备好 */
  private isViewInitialized = false;

  ngOnInit(): void {
  }


  /** 是否是 text 类型 */
  isText(): boolean {
    return this.schema?.type === 'text';
  }

  /** 检查是否有对应的组件 */
  hasComponent(): boolean {
    if (!this.schema?.type) return false;
    return this.widgetRegistry.has(this.schema.type);
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    this.renderComponent();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema']) {
      this.renderComponent();
    }
  }

  ngOnDestroy(): void {
    this.destroyComponent();
  }

  /** 渲染组件 */
  private renderComponent(): void {
    if (!this.isViewInitialized || !this.viewContainerRef) {
      return;
    }

    // 销毁旧组件
    this.destroyComponent();

    if (!this.schema?.type) return;

    // text 类型在模板中处理
    if (this.schema.type === 'text') return;

    // 从注册服务获取组件类型
    const componentType = this.widgetRegistry.get(this.schema.type);
    if (!componentType) {
      console.warn(`[SchemaRenderer] Widget type not found: ${this.schema.type}`);
      return;
    }

    // 动态创建组件
    this.componentRef = this.viewContainerRef.createComponent(componentType);

    // 传入 schema
    this.componentRef.instance.schema = this.schema;

    // 检测变化
    this.componentRef.changeDetectorRef.detectChanges();
  }

  /** 销毁组件 */
  private destroyComponent(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}

/**
 * 获取支持的组件类型列表
 * 
 * @deprecated 使用 WidgetRegistryService.getRegisteredTypes() 替代
 */
export function getSupportedWidgetTypes(): string[] {
  // 这个函数保留用于向后兼容
  // 但实际上现在需要通过 DI 使用 WidgetRegistryService
  console.warn('[Deprecated] getSupportedWidgetTypes() is deprecated. Use WidgetRegistryService.getRegisteredTypes() instead.');
  return [];
}

/**
 * 注册自定义组件
 * 
 * @deprecated 使用 DI 方式注册：
 * ```typescript
 * providers: [
 *   { provide: WIDGET_REGISTRY, useValue: { type: 'custom', component: CustomComponent }, multi: true }
 * ]
 * ```
 * 或使用 WidgetRegistryService.register()
 */
export function registerWidget(type: string, component: Type<any>): void {
  // 这个函数保留用于向后兼容
  // 注意：这个函数只能在应用启动后（APP_INITIALIZER 执行后）使用
  // 推荐使用 DI 方式注册或直接使用 WidgetRegistryService
  console.warn('[Deprecated] registerWidget() is deprecated. Use WidgetRegistryService.register() or DI providers instead.');

  // 导入兼容层的 registerWidget 函数
  // 需要使用动态 import 来避免循环依赖
  import('../../registry/compat/legacy-compat').then(({ registerWidget: legacyRegister }) => {
    legacyRegister(type, component);
  }).catch(() => {
    console.error('[registerWidget] Failed to register widget. Make sure RegistryModule is initialized.');
  });
}
