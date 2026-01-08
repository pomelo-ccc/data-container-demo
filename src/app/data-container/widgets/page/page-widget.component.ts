import {
  Component,
  Input,
  inject,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { WidgetSchema } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { DataSourceService } from '../../services/data-source.service';
import { ComponentContext, ContextAware } from '../../../context';
import { SchemaRendererComponent } from '../../renderer/schema-renderer.component';

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  /** 文本 */
  text: string;
  /** 链接 */
  link?: string;
}

/**
 * 页面组件属性
 */
export interface PageWidgetProps {
  /** 页面标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 面包屑 */
  breadcrumbs?: BreadcrumbItem[];
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 是否使用卡片包裹 */
  useCard?: boolean;
  /** 页面内边距 */
  padding?: number;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 错误信息 (用于显示错误提示) */
  errorMessage?: string;
  /** 栅格布局 */
  grid?: {
    gutter?: number;
    columns?: number[];
  };
}

/**
 * Page Widget 组件 - 支持嵌套的页面容器
 */
@Component({
  selector: 'app-page-widget',
  standalone: true,
  imports: [
    CommonModule,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzSpinModule,
    NzAlertModule,
    NzGridModule,
    SchemaRendererComponent
  ],
  providers: [ScopeService, ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-widget" [style.padding.px]="props.padding ?? 16">
      <!-- 页面头部 -->
      <nz-page-header *ngIf="props.title"
                      [nzTitle]="props.title"
                      [nzSubtitle]="props.subtitle"
                      [nzBackIcon]="props.showBack ? 'arrow-left' : null">
        <!-- 面包屑 -->
        <nz-breadcrumb *ngIf="props.breadcrumbs?.length" nz-page-header-breadcrumb>
          <nz-breadcrumb-item *ngFor="let crumb of props.breadcrumbs">
            <a *ngIf="crumb.link; else plainCrumb" [href]="crumb.link">{{ crumb.text }}</a>
            <ng-template #plainCrumb>{{ crumb.text }}</ng-template>
          </nz-breadcrumb-item>
        </nz-breadcrumb>
      </nz-page-header>

      <!-- 错误提示 -->
      <nz-alert *ngIf="error()"
                nzType="error"
                [nzMessage]="error()"
                nzShowIcon
                style="margin-bottom: 16px">
      </nz-alert>

      <!-- 加载状态 -->
      <nz-spin [nzSpinning]="loading() && props.showLoading !== false">
        <!-- 内容区域 -->
        <ng-container *ngIf="props.useCard; else noCard">
          <nz-card [nzBordered]="true">
            <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
          </nz-card>
        </ng-container>
        
        <ng-template #noCard>
          <ng-container *ngTemplateOutlet="contentTpl"></ng-container>
        </ng-template>
        
        <ng-template #contentTpl>
          <!-- 栅格布局 -->
          <ng-container *ngIf="props.grid?.columns?.length; else normalLayout">
            <nz-row [nzGutter]="props.grid?.gutter || 16">
              <nz-col *ngFor="let span of props.grid!.columns; let i = index" [nzSpan]="span">
                <div class="page-slot" [attr.data-slot]="i">
                  <!-- 子组件将通过 SchemaRenderer 渲染到这里 -->
                  <ng-container *ngIf="children()[i] as childSchema">
                    <app-schema-renderer [schema]="childSchema" [ctx]="ctx"></app-schema-renderer>
                  </ng-container>
                </div>
              </nz-col>
            </nz-row>
          </ng-container>
          
          <ng-template #normalLayout>
            <div class="page-content">
              <ng-container *ngFor="let childSchema of children()">
                <app-schema-renderer [schema]="childSchema" [ctx]="ctx"></app-schema-renderer>
              </ng-container>
            </div>
          </ng-template>
        </ng-template>
      </nz-spin>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .page-widget {
      background: #fff;
      border-radius: 8px;
      min-height: 100px;
    }
    
    ::ng-deep nz-page-header {
      padding: 16px 0 !important;
    }
    
    .page-content {
      min-height: 50px;
    }
    
    .page-slot {
      min-height: 50px;
    }
    
    ::ng-deep .ant-card {
      border-radius: 8px;
    }
  `]
})
export class PageWidgetComponent extends ContextAware implements OnDestroy {
  override contextType = 'page';

  /** Schema 配置 */
  @Input() schema!: WidgetSchema;

  /** 本地 Scope 服务 */
  readonly scope = inject(ScopeService);

  /** 父级 Scope */
  private readonly parentScope = inject(ScopeService, { optional: true, skipSelf: true });

  /** 数据源服务 */
  private readonly dataSourceService = inject(DataSourceService);

  /** 加载状态 */
  loading = signal(false);

  /** 错误信息 */
  error = signal<string | null>(null);

  /** 获取属性配置 */
  get props(): PageWidgetProps {
    return (this.schema?.props as PageWidgetProps) || {};
  }

  /** 子组件列表 */
  readonly children = computed(() => {
    return this.schema?.children ?? [];
  });

  override ngOnInit(): void {
    this.contextId = this.schema?.id;
    super.ngOnInit();

    // 建立父子 Scope 链接
    if (this.parentScope) {
      this.scope.setParent(this.parentScope);
    }

    // 加载数据源
    this.loadDataSource();
  }

  ngOnDestroy(): void {
    this.scope.setParent(null);
  }

  /** 加载数据源 */
  private loadDataSource(): void {
    const dataSource = this.schema?.dataSource;
    if (!dataSource) return;
    if (dataSource.autoLoad === false) return;

    this.loading.set(true);
    this.error.set(null);

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
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.props.errorMessage || '数据加载失败');
        this.loading.set(false);
      }
    });
  }

  /** 根据路径获取值 */
  private getValueByPath(obj: any, path: string): any {
    if (!path) return obj;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /** 刷新数据 */
  refresh(): void {
    this.loadDataSource();
  }
}
