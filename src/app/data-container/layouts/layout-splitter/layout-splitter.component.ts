import { Component, Input, inject, ChangeDetectionStrategy, signal, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RuntimeSchema, SplitterLayoutProps } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { SchemaRendererComponent } from '../../renderer/schema-renderer.component';
import { ComponentContext } from '../../../context';

/**
 * Splitter 布局组件 - 可拖拽分割式布局
 */
@Component({
  selector: 'app-layout-splitter',
  standalone: true,
  imports: [CommonModule, SchemaRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout-splitter" 
         [class.vertical]="splitterProps.direction === 'vertical'"
         [class.horizontal]="splitterProps.direction !== 'vertical'">
      
      <ng-container *ngFor="let child of children; let i = index; let last = last; trackBy: trackById">
        <div class="splitter-pane" [style.flex]="getPaneFlex(i)">
          <div class="pane-content">
             <app-schema-renderer [schema]="child" [ctx]="ctx"></app-schema-renderer>
          </div>
        </div>
        
        <div *ngIf="!last" 
             class="splitter-gutter" 
             (mousedown)="startDrag($event, i)"
             [class.dragging]="isDragging() && dragIndex() === i">
          <div class="gutter-handle"></div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .layout-splitter {
      display: flex;
      width: 100%;
      height: 100%;
      min-height: 200px;
    }
    
    .layout-splitter.horizontal {
      flex-direction: row;
    }
    
    .layout-splitter.vertical {
      flex-direction: column;
    }
    
    .splitter-pane {
      overflow: auto;
      min-width: 50px;
      min-height: 50px;
    }
    
    .pane-content {
      padding: 8px;
      height: 100%;
    }
    
    .splitter-gutter {
      flex: 0 0 8px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: col-resize;
      transition: background 0.2s;
    }
    
    .layout-splitter.vertical .splitter-gutter {
      cursor: row-resize;
    }
    
    .splitter-gutter:hover,
    .splitter-gutter.dragging {
      background: #d9d9d9;
    }
    
    .gutter-handle {
      width: 4px;
      height: 30px;
      background: #bfbfbf;
      border-radius: 2px;
    }
    
    .layout-splitter.vertical .gutter-handle {
      width: 30px;
      height: 4px;
    }
  `]
})
export class LayoutSplitterComponent implements AfterViewInit, OnDestroy, OnChanges {
  /** 子组件列表 */
  @Input() children: RuntimeSchema[] = [];

  /** 上下文 */
  @Input() ctx?: ComponentContext;

  /** 布局属性 */
  @Input() layoutProps: SplitterLayoutProps = {};

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);
  private readonly elementRef = inject(ElementRef);

  /** 是否正在拖拽 */
  isDragging = signal(false);

  /** 当前拖拽的分割线索引 */
  dragIndex = signal(-1);

  /** 分割比例 */
  splitRatios = signal<number[]>([]);

  /** 拖拽相关状态 */
  private startPos = 0;
  private startSizes: number[] = [];
  private boundMouseMove = this.onMouseMove.bind(this);
  private boundMouseUp = this.onMouseUp.bind(this);

  /** 获取 splitter 属性 */
  get splitterProps(): SplitterLayoutProps {
    return this.layoutProps;
  }

  /** TrackBy 函数 */
  trackById(index: number, child: RuntimeSchema): string {
    return child.id;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['layoutProps']) {
      const ratio = this.layoutProps.splitRatio;
      if (ratio && ratio.length > 0) {
        this.splitRatios.set([...ratio]);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.layoutProps.splitRatio?.length) {
      this.splitRatios.set([...this.layoutProps.splitRatio]);
    } else {
      const ratio = 100 / this.children.length;
      this.splitRatios.set(this.children.map(() => ratio));
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  /** 获取面板的 flex 值 */
  getPaneFlex(index: number): string {
    const ratios = this.splitRatios();
    return ratios[index] ? `${ratios[index]} 0 0%` : '1 0 0%';
  }

  /** 开始拖拽 */
  startDrag(event: MouseEvent, index: number): void {
    event.preventDefault();

    this.isDragging.set(true);
    this.dragIndex.set(index);

    const isVertical = this.splitterProps.direction === 'vertical';
    this.startPos = isVertical ? event.clientY : event.clientX;

    const container = this.elementRef.nativeElement.querySelector('.layout-splitter');
    const panes = container.querySelectorAll('.splitter-pane');
    this.startSizes = Array.from(panes).map((pane: any) =>
      isVertical ? pane.offsetHeight : pane.offsetWidth
    );

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  /** 拖拽中 */
  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging()) return;

    const isVertical = this.splitterProps.direction === 'vertical';
    const currentPos = isVertical ? event.clientY : event.clientX;
    const delta = currentPos - this.startPos;

    const index = this.dragIndex();
    const minSizes = this.layoutProps.minSizes ?? [50, 50];

    let newSize1 = this.startSizes[index] + delta;
    let newSize2 = this.startSizes[index + 1] - delta;

    const minSize1 = minSizes[index] ?? 50;
    const minSize2 = minSizes[index + 1] ?? 50;

    if (newSize1 < minSize1) {
      newSize2 += (newSize1 - minSize1);
      newSize1 = minSize1;
    }
    if (newSize2 < minSize2) {
      newSize1 += (newSize2 - minSize2);
      newSize2 = minSize2;
    }

    const totalSize = this.startSizes.reduce((a, b) => a + b, 0);
    this.splitRatios.update(ratios => {
      const newRatios = [...ratios];
      newRatios[index] = (newSize1 / totalSize) * 100;
      newRatios[index + 1] = (newSize2 / totalSize) * 100;
      return newRatios;
    });
  }

  /** 拖拽结束 */
  private onMouseUp(): void {
    this.isDragging.set(false);
    this.dragIndex.set(-1);

    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);

    this.scope.setValue('_splitRatios', this.splitRatios());
  }
}
