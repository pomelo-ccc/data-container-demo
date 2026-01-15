import { Component, Input, inject, ChangeDetectionStrategy, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { WidgetSchema } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { ComponentContext, ContextHost } from '../../../context';

/**
 * 表格列配置
 */
export interface TableColumn {
  /** 列标题 */
  title: string;
  /** 数据字段 (支持 field 或 dataIndex 别名) */
  field?: string;
  /** 数据字段别名 (antd 风格) */
  dataIndex?: string;
  /** 列宽 */
  width?: string;
  /** 是否可排序 */
  sortable?: boolean;
  /** 渲染类型 */
  renderType?: 'text' | 'tag' | 'action';
  /** Tag 颜色映射 */
  tagColors?: Record<string, string>;
  /** 操作按钮配置 */
  actions?: { label: string; action: string; type?: string }[];
}

/**
 * 表格组件属性
 */
export interface TableWidgetProps {
  /** 列配置 */
  columns: TableColumn[];
  /** 数据源字段 (从 Scope 中读取) */
  dataField?: string;
  /** 数据绑定表达式 (支持 ${key} 语法) */
  data?: string;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 是否显示分页 */
  showPagination?: boolean;
  /** 每页条数 */
  pageSize?: number;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 行选择模式 */
  selectionMode?: 'none' | 'single' | 'multiple';
}

/**
 * 表格 Widget 组件
 */
@Component({
  selector: 'app-table-widget',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="table-widget">
      <nz-table
        #basicTable
        [nzData]="tableData()"
        [nzBordered]="props.bordered !== false"
        [nzShowPagination]="props.showPagination !== false"
        [nzPageSize]="props.pageSize || 10"
        nzSize="middle">
        <thead>
          <tr>
            <th *ngIf="props.showIndex" nzWidth="60px">序号</th>
            <th *ngFor="let col of props.columns" [nzWidth]="col.width || null">
              {{ col.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let data of basicTable.data; let i = index">
            <td *ngIf="props.showIndex">{{ i + 1 }}</td>
            <td *ngFor="let col of props.columns">
              <ng-container [ngSwitch]="col.renderType">
                <!-- Tag 渲染 -->
                <ng-container *ngSwitchCase="'tag'">
                  <nz-tag [nzColor]="getTagColor(col, getFieldValue(data, col))">
                    {{ getFieldValue(data, col) }}
                  </nz-tag>
                </ng-container>
                
                <!-- 操作按钮 -->
                <ng-container *ngSwitchCase="'action'">
                  <ng-container *ngFor="let action of col.actions; let last = last">
                    <a (click)="handleAction(action.action, data)">{{ action.label }}</a>
                    <nz-divider *ngIf="!last" nzType="vertical"></nz-divider>
                  </ng-container>
                </ng-container>
                
                <!-- 默认文本 -->
                <ng-container *ngSwitchDefault>
                  {{ getFieldValue(data, col) }}
                </ng-container>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </nz-table>
    </div>
  `,
  styles: [`
    .table-widget {
      width: 100%;
    }
    
    ::ng-deep .ant-table {
      border-radius: 8px;
    }
    
    a {
      color: #1890ff;
      cursor: pointer;
    }
    
    a:hover {
      color: #40a9ff;
    }
  `]
})
export class TableWidgetComponent extends ContextHost implements OnDestroy {
  override contextType = 'table';

  /** Schema 配置 */
  @Input() schema!: WidgetSchema;

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** 表格数据 */
  tableData = signal<any[]>([]);

  /** 获取属性配置 */
  get props(): TableWidgetProps {
    return (this.schema?.props as TableWidgetProps) || { columns: [] };
  }

  override ngOnInit(): void {
    this.contextId = this.schema?.id;
    super.ngOnInit();
    this.loadData();

    // 注册组件 API
    if (this.schema?.id) {
      this.scope.registerComponent(this.schema.id, {
        refresh: () => this.loadData(),
        getData: () => this.tableData()
      });
    }
  }

  ngOnDestroy(): void {
    if (this.schema?.id) {
      this.scope.unregisterComponent(this.schema.id);
    }
  }

  /** 加载数据 */
  private loadData(): void {
    let data: any[] = [];

    // 检查是否有 data 属性 (表达式绑定)
    if (this.props.data) {
      const result = this.scope.evaluateExpression(this.props.data);
      data = Array.isArray(result) ? result : [];
    } else {
      // 回退到 dataField 或默认 _data
      const dataField = this.props.dataField || '_data';
      const result = this.scope.getValue(dataField, []);
      data = Array.isArray(result) ? result : [];
    }

    this.tableData.set(data);
  }

  /** 获取列字段值 (支持 field 或 dataIndex) */
  getFieldValue(data: any, col: TableColumn): any {
    const field = col.field || col.dataIndex || '';
    return data?.[field];
  }

  /** 获取 Tag 颜色 */
  getTagColor(col: TableColumn, value: any): string {
    return col.tagColors?.[value] || 'default';
  }

  /** 处理操作 */
  handleAction(action: string, rowData: any): void {
    console.log('Table action:', action, rowData);
    // 可以通过 Scope 触发事件
    this.scope.setValue('_lastAction', { action, data: rowData });
  }
}
