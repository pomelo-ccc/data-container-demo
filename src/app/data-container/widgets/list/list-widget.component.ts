import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { WidgetSchema } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { ComponentContext, ContextHost } from '../../../context';

/**
 * 列表项字段映射
 */
export interface ListItemMapping {
  /** 标题字段 */
  title: string;
  /** 描述字段 */
  description?: string;
  /** 头像字段 */
  avatar?: string;
  /** 额外内容字段 */
  extra?: string;
  /** 标签字段 */
  tag?: string;
  /** 标签颜色映射 */
  tagColors?: Record<string, string>;
}

/**
 * 列表组件属性
 */
export interface ListWidgetProps {
  /** 数据源字段 */
  dataField?: string;
  /** 字段映射 */
  itemMapping: ListItemMapping;
  /** 是否显示边框 */
  bordered?: boolean;
  /** 列表大小 */
  size?: 'default' | 'small' | 'large';
  /** 是否显示分割线 */
  split?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 列表头部 */
  header?: string;
  /** 列表尾部 */
  footer?: string;
  /** 是否显示加载骨架 */
  showSkeleton?: boolean;
}

/**
 * 列表 Widget 组件
 */
@Component({
  selector: 'app-list-widget',
  standalone: true,
  imports: [
    CommonModule,
    NzListModule,
    NzAvatarModule,
    NzIconModule,
    NzSkeletonModule,
    NzEmptyModule,
    NzTagModule
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nz-list
      [nzBordered]="props.bordered !== false"
      [nzSize]="props.size || 'default'"
      [nzSplit]="props.split !== false"
      [nzHeader]="props.header"
      [nzFooter]="props.footer">
      
      <!-- 加载骨架 -->
      <ng-container *ngIf="loading() && props.showSkeleton">
        <nz-list-item *ngFor="let _ of [1,2,3]">
          <nz-skeleton [nzActive]="true" [nzAvatar]="true" [nzParagraph]="{ rows: 1 }"></nz-skeleton>
        </nz-list-item>
      </ng-container>
      
      <!-- 空状态 -->
      <ng-container *ngIf="!loading() && listData().length === 0">
        <nz-list-item>
          <nz-empty nzNotFoundContent="暂无数据"></nz-empty>
        </nz-list-item>
      </ng-container>
      
      <!-- 列表内容 -->
      <ng-container *ngIf="!loading()">
        <nz-list-item *ngFor="let item of listData(); let i = index"
                      [class.clickable]="props.clickable"
                      (click)="onItemClick(item, i)">
          <nz-list-item-meta
            [nzAvatar]="avatarTpl"
            [nzTitle]="titleTpl"
            [nzDescription]="getFieldValue(item, mapping.description)">
          </nz-list-item-meta>
          
          <!-- 额外内容 -->
          <ul nz-list-item-actions *ngIf="mapping.extra || mapping.tag">
            <nz-list-item-action *ngIf="mapping.tag && getFieldValue(item, mapping.tag)">
              <nz-tag [nzColor]="getTagColor(item)">
                {{ getFieldValue(item, mapping.tag) }}
              </nz-tag>
            </nz-list-item-action>
            <nz-list-item-action *ngIf="mapping.extra">
              {{ getFieldValue(item, mapping.extra) }}
            </nz-list-item-action>
          </ul>
          
          <ng-template #avatarTpl>
            <nz-avatar *ngIf="mapping.avatar" 
                       [nzSrc]="getFieldValue(item, mapping.avatar)"
                       [nzText]="getAvatarText(item)"
                       nzIcon="user">
            </nz-avatar>
          </ng-template>
          
          <ng-template #titleTpl>
            <a *ngIf="props.clickable; else plainTitle">
              {{ getFieldValue(item, mapping.title) }}
            </a>
            <ng-template #plainTitle>
              {{ getFieldValue(item, mapping.title) }}
            </ng-template>
          </ng-template>
        </nz-list-item>
      </ng-container>
    </nz-list>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
    
    .clickable {
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .clickable:hover {
      background-color: #fafafa;
    }
    
    nz-empty {
      padding: 24px 0;
    }
  `]
})
export class ListWidgetComponent extends ContextHost {
  override contextType = 'list';

  /** Schema 配置 */
  @Input() schema!: WidgetSchema;

  /** 列表项点击事件 */
  @Output() itemClick = new EventEmitter<{ item: any; index: number }>();

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** 列表数据 */
  listData = signal<any[]>([]);

  /** 加载状态 */
  loading = signal(false);

  /** 获取属性配置 */
  get props(): ListWidgetProps {
    return (this.schema?.props as ListWidgetProps) || { itemMapping: { title: 'title' } };
  }

  /** 获取字段映射 */
  get mapping(): ListItemMapping {
    return this.props.itemMapping || { title: 'title' };
  }

  override ngOnInit(): void {
    this.contextId = this.schema?.id;
    super.ngOnInit();
    this.loadData();
  }

  /** 加载数据 */
  private loadData(): void {
    const dataField = this.props.dataField || '_data';
    const data = this.scope.getValue(dataField, []);
    this.listData.set(Array.isArray(data) ? data : []);
  }

  /** 获取字段值 */
  getFieldValue(item: any, field?: string): any {
    if (!field) return '';
    return field.split('.').reduce((obj, key) => obj?.[key], item) ?? '';
  }

  /** 获取头像文本 */
  getAvatarText(item: any): string {
    const title = this.getFieldValue(item, this.mapping.title);
    return typeof title === 'string' ? title.charAt(0).toUpperCase() : '';
  }

  /** 获取 Tag 颜色 */
  getTagColor(item: any): string {
    const value = this.getFieldValue(item, this.mapping.tag);
    return this.mapping.tagColors?.[value] || 'blue';
  }

  /** 列表项点击 */
  onItemClick(item: any, index: number): void {
    if (!this.props.clickable) return;

    console.log('List item clicked:', item);
    this.itemClick.emit({ item, index });
    this.scope.setValue('_selectedItem', item);
  }
}
