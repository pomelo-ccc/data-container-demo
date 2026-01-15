import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { WidgetSchema } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { ComponentContext, ContextHost, ComponentRegistry } from '../../../context';

/**
 * 按钮项配置
 */
export interface ButtonItem {
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 图标 */
  icon?: string;
  /** 动作标识 */
  action: string;
  /** 是否危险按钮 */
  danger?: boolean;
  /** 禁用表达式 */
  disabledOn?: string;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 按钮组件属性
 */
export interface ButtonWidgetProps {
  /** 按钮配置 (单个或多个) */
  buttons?: ButtonItem[];
  /** 单按钮简写 */
  text?: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  icon?: string;
  action?: string;
  /** 动作类型: script | submit | button */
  actionType?: string;
  /** 脚本内容 (当 actionType=script 时有效) */
  script?: string | Function;
  danger?: boolean;
  /** 按钮组模式 */
  mode?: 'single' | 'group' | 'dropdown';
  /** 下拉菜单触发方式 */
  dropdownTrigger?: 'click' | 'hover';
  /** 按钮大小 */
  size?: 'large' | 'default' | 'small';
  /** 是否块级 */
  block?: boolean;
}

/**
 * 按钮 Widget 组件
 */
@Component({
  selector: 'app-button-widget',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzDropDownModule,
    NzMenuModule
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [ngSwitch]="props.mode || 'single'">
      <!-- 单按钮模式 -->
      <ng-container *ngSwitchCase="'single'">
        <button nz-button
                [nzType]="props.type || 'default'"
                [nzSize]="props.size || 'default'"
                [nzDanger]="props.danger || false"
                [nzBlock]="props.block || false"
                [disabled]="isDisabled"
                (click)="handleClick($event, props.action || 'click')">
          <span *ngIf="props.icon" nz-icon [nzType]="props.icon"></span>
          {{ props.text }}
        </button>
      </ng-container>

      <!-- 按钮组模式 -->
      <ng-container *ngSwitchCase="'group'">
        <nz-button-group [nzSize]="props.size || 'default'">
          <button *ngFor="let btn of props.buttons"
                  nz-button
                  [nzType]="btn.type || 'default'"
                  [nzDanger]="btn.danger || false"
                  [disabled]="isButtonDisabled(btn)"
                  (click)="handleClick($event, btn.action)">
            <span *ngIf="btn.icon" nz-icon [nzType]="btn.icon"></span>
            {{ btn.text }}
          </button>
        </nz-button-group>
      </ng-container>

      <!-- 下拉菜单模式 -->
      <ng-container *ngSwitchCase="'dropdown'">
        <button nz-button 
                nz-dropdown 
                [nzDropdownMenu]="menuRef"
                [nzTrigger]="props.dropdownTrigger || 'hover'"
                [nzType]="props.type || 'default'"
                [nzSize]="props.size || 'default'">
          {{ props.text || '操作' }}
          <span nz-icon nzType="down"></span>
        </button>
        <nz-dropdown-menu #menuRef="nzDropdownMenu">
          <ul nz-menu>
            <li *ngFor="let btn of props.buttons" 
                nz-menu-item 
                [nzDanger]="btn.danger || false"
                [nzDisabled]="isButtonDisabled(btn)"
                (click)="handleClick($event, btn.action)">
              <span *ngIf="btn.icon" nz-icon [nzType]="btn.icon"></span>
              <span>{{ btn.text }}</span>
            </li>
          </ul>
        </nz-dropdown-menu>
      </ng-container>
    </ng-container>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
    
    :host-context(.block-button) {
      display: block;
      width: 100%;
    }
    
    nz-button-group button {
      margin-right: 0;
    }
    
    [nz-menu-item] span[nz-icon] {
      margin-right: 8px;
    }
  `]
})
export class ButtonWidgetComponent extends ContextHost implements OnDestroy {
  /** 注入 Registry 用于测试 */
  private readonly registry = inject(ComponentRegistry);

  ngOnDestroy(): void {
    const contextId = this.ctx.id();
    const contextType = this.ctx.type();

    // 测试1: 检查 registry 中是否还存在该 context
    const stillInRegistry = this.registry.has(contextId);
    console.log(`[Destroy Test] Context "${contextId}" still in registry:`, stillInRegistry);

    // 测试2: 尝试通过 registry.get() 获取
    const ctxFromRegistry = this.registry.get(contextId);
    console.log(`[Destroy Test] registry.get("${contextId}"):`, ctxFromRegistry);

    // 测试3: 检查 typeIndex 中是否还有该类型的 context
    const contextsOfType = this.registry.getByType(contextType);
    const stillInTypeIndex = contextsOfType.some(ctx => ctx.id() === contextId);
    console.log(`[Destroy Test] Context in typeIndex for "${contextType}":`, stillInTypeIndex);

    // 测试4: 检查所有已注册的 IDs
    const allIds = this.registry.getAllIds();
    console.log(`[Destroy Test] All registered IDs:`, allIds);

    // 测试5: 检查 context 本身的 registered 状态
    console.log(`[Destroy Test] ctx.registered():`, this.ctx.registered());

    console.log('ngOnDestroy complete');
  }


  override contextType = 'button';

  /** Schema 配置 */
  @Input() schema!: WidgetSchema;

  /** 按钮点击事件 */
  @Output() buttonClick = new EventEmitter<{ action: string; data: any }>();

  /** 注入 Scope 服务 */
  protected readonly scope = inject(ScopeService);

  /** 获取属性配置 */
  get props(): ButtonWidgetProps {
    return (this.schema?.props as ButtonWidgetProps) || {};
  }

  override ngOnInit(): void {
    this.contextId = this.schema?.id;
    super.ngOnInit();
    console.log('ngOnInit', this.ctx);
  }

  /** 是否禁用 (单按钮) */
  get isDisabled(): boolean {
    const disabledOn = this.schema?.disabledOn;
    if (!disabledOn) return false;
    return this.scope.evaluateExpression(disabledOn);
  }

  /** 判断按钮是否禁用 */
  isButtonDisabled(btn: ButtonItem): boolean {
    if (!btn.disabledOn) return false;
    return this.scope.evaluateExpression(btn.disabledOn);
  }

  /** 处理点击 */
  handleClick(event: MouseEvent, action: string): void {
    const data = this.scope.data();
    console.log('Button clicked:', action, data);
    this.buttonClick.emit({ action, data });

    const script = this.props.script;

    if (typeof script === 'function') {
      try {
        script(this.scope, this.ctx, event);
      } catch (e) {
        console.error('Script execution error:', e);
        alert('执行脚本出错: ' + (e as Error).message);
      }
    } else if (typeof script === 'string' && script.trim()) {
      try {
        // 创建一个可以访问 scope 的函数
        const scopeService = this.scope;
        const fn = new Function('scope', 'event', script);
        fn(scopeService, event);
      } catch (e) {
        console.error('Script execution error:', e);
        alert('执行脚本出错: ' + (e as Error).message);
      }
    }

    // 更新 Scope 中的最后操作
    this.scope.setValue('_lastButtonAction', action);
  }
}
