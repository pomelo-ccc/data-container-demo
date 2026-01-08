import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy, signal, OnDestroy, DestroyRef, effect, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { WidgetSchema } from '../../models/schema.interface';
import { ScopeService } from '../../services/scope.service';
import { ComponentContext, ContextAware } from '../../../context';

/**
 * 表单项配置
 */
export interface FormField {
  /** 字段名 */
  name: string;
  /** 标签 */
  label: string;
  /** 类型 */
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'switch';
  /** 占位符 */
  placeholder?: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 选项 (select 类型) */
  options?: { label: string; value: any }[];
  /** 栅格占比 (1-24) */
  span?: number;
  /** 禁用表达式 (例如: "${age > 18}") */
  disabledOn?: string;
}

/**
 * 表单组件属性
 */
export interface FormWidgetProps {
  /** 表单字段 */
  fields: FormField[];
  /** 布局方式 */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** 标签宽度 */
  labelSpan?: number;
  /** 控件宽度 */
  wrapperSpan?: number;
  /** 是否显示提交按钮 */
  showSubmit?: boolean;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 提交按钮文本 */
  submitText?: string;

  // ===== 数据源配置 =====

  /**
   * 是否使用 Context 数据作为数据源
   * - true: 从父级 Context 读取初始值，变更时写回 Context
   * - false: 仅使用自身数据 (默认值 + 自己请求的数据)
   * @default false
   */
  useContextData?: boolean;

  /**
   * 数据写入模式 (仅当 useContextData=true 时生效)
   * - 'owner': 写入到数据原始所在的 Context 层 (使用 setDataAt)
   * - 'parent': 写入到直接父级 Context
   * - 'root': 写入到根 Context
   * - 'local': 仅写入本地 Form Context
   * @default 'owner'
   */
  dataWriteMode?: 'owner' | 'parent' | 'root' | 'local';

  /**
   * 是否只读模式
   * - true: 表单所有字段只读，不可编辑
   * - false: 正常可编辑模式
   * @default false
   */
  readonly?: boolean;
}

/**
 * 表单 Widget 组件
 */
@Component({
  selector: 'app-form-widget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzButtonModule,
    NzGridModule
  ],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form nz-form 
          [formGroup]="formGroup" 
          [nzLayout]="props.layout || 'horizontal'"
          (ngSubmit)="onSubmit()">
      <nz-row [nzGutter]="16">
        <nz-col *ngFor="let field of props.fields" [nzSpan]="field.span || 24">
          <nz-form-item>
            <nz-form-label 
              [nzSpan]="props.labelSpan || 6" 
              [nzRequired]="field.required || false">
              {{ field.label }}
            </nz-form-label>
            <nz-form-control [nzSpan]="props.wrapperSpan || 18">
              <ng-container [ngSwitch]="field.type">
                <!-- 文本输入 -->
                <input *ngSwitchCase="'text'" 
                       nz-input 
                       [formControlName]="field.name"
                       [placeholder]="field.placeholder || ''"
                       [readonly]="props.readonly" />
                
                <!-- 多行文本 -->
                <textarea *ngSwitchCase="'textarea'" 
                          nz-input 
                          [formControlName]="field.name"
                          [placeholder]="field.placeholder || ''"
                          [nzAutosize]="{ minRows: 3, maxRows: 6 }"
                          [readonly]="props.readonly">
                </textarea>
                
                <!-- 数字输入 -->
                <nz-input-number *ngSwitchCase="'number'"
                                 [formControlName]="field.name"
                                 [nzPlaceHolder]="field.placeholder || ''"
                                 [nzDisabled]="props.readonly"
                                 style="width: 100%">
                </nz-input-number>
                
                <!-- 下拉选择 -->
                <nz-select *ngSwitchCase="'select'"
                           [formControlName]="field.name"
                           [nzPlaceHolder]="field.placeholder || '请选择'"
                           [nzDisabled]="props.readonly"
                           style="width: 100%">
                  <nz-option *ngFor="let opt of field.options"
                             [nzValue]="opt.value"
                             [nzLabel]="opt.label">
                  </nz-option>
                </nz-select>
                
                <!-- 日期选择 -->
                <nz-date-picker *ngSwitchCase="'date'"
                                [formControlName]="field.name"
                                [nzPlaceHolder]="field.placeholder || '选择日期'"
                                [nzDisabled]="props.readonly"
                                style="width: 100%">
                </nz-date-picker>
                
                <!-- 开关 -->
                <nz-switch *ngSwitchCase="'switch'"
                           [formControlName]="field.name"
                           [nzDisabled]="props.readonly">
                </nz-switch>
              </ng-container>
            </nz-form-control>
          </nz-form-item>
        </nz-col>
      </nz-row>
      
      <!-- 按钮区域 -->
      <nz-form-item *ngIf="props.showSubmit !== false || props.showReset">
        <nz-form-control [nzOffset]="props.labelSpan || 6" [nzSpan]="props.wrapperSpan || 18">
          <button *ngIf="props.showSubmit !== false" 
                  nz-button 
                  nzType="primary" 
                  type="submit">
            {{ props.submitText || '提交' }}
          </button>
          <button *ngIf="props.showReset" 
                  nz-button 
                  type="button" 
                  (click)="onReset()"
                  style="margin-left: 8px">
            重置
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class FormWidgetComponent extends ContextAware implements OnDestroy {
  override contextType = 'form';

  /** Schema 配置 */
  @Input() schema!: WidgetSchema;

  /** 表单提交事件 */
  @Output() formSubmit = new EventEmitter<any>();

  /** 注入服务 */
  protected readonly scope = inject(ScopeService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** 表单组 */
  formGroup!: FormGroup;

  /** 保存初始值用于重置 */
  private initialValues: Record<string, any> = {};

  /** 获取属性配置 */
  get props(): FormWidgetProps {
    return (this.schema?.props as FormWidgetProps) || { fields: [] };
  }

  override ngOnInit(): void {
    this.contextId = this.schema?.id;
    super.ngOnInit();
    this.buildForm();
    this.setupContextSync();
    this.setupDisabledEffect();

    // 注册组件 API
    if (this.schema?.id) {
      this.scope.registerComponent(this.schema.id, {
        reset: () => this.onReset(),
        submit: () => this.onSubmit(),
        setValue: (val: any) => this.formGroup.patchValue(val),
        getValue: () => this.formGroup.value,
        disable: () => this.formGroup.disable(),
        enable: () => this.formGroup.enable()
      });
    }
  }

  ngOnDestroy(): void {
    if (this.schema?.id) {
      this.scope.unregisterComponent(this.schema.id);
    }
  }

  /**
   * 设置禁用状态监听
   */
  private setupDisabledEffect(): void {
    const allFields = this.props.fields.filter(f => !!f.disabledOn);
    if (allFields.length === 0) return;

    // 区分动态表达式 (带 ${}) 和静态/一次性配置
    const dynamicFields = allFields.filter(f => f.disabledOn!.trim().startsWith('${'));
    const staticFields = allFields.filter(f => !f.disabledOn!.trim().startsWith('${'));

    // 1. 对于静态配置，只执行一次初始化
    if (staticFields.length > 0) {
      const data = this.ctx.data();
      for (const field of staticFields) {
        this.updateFieldDisabledState(field, data);
      }
    }

    // 2. 对于动态表达式，开启 effect 监听
    if (dynamicFields.length > 0) {
      runInInjectionContext(this.injector, () => {
        effect(() => {
          const data = this.ctx.data();
          for (const field of dynamicFields) {
            this.updateFieldDisabledState(field, data);
          }
        }, { allowSignalWrites: true });
      });
    }
  }

  /** 更新单个字段的禁用状态 */
  private updateFieldDisabledState(field: FormField, data: any): void {
    const control = this.formGroup.get(field.name);
    if (!control) return;

    // 全局只读时，始终禁用
    if (this.props.readonly) {
      if (control.enabled) control.disable({ emitEvent: false });
      return;
    }

    const shouldDisable = this.evaluateExpression(field.disabledOn!, data);

    if (shouldDisable) {
      if (control.enabled) control.disable({ emitEvent: false });
    } else {
      if (control.disabled) control.enable({ emitEvent: false });
    }
  }

  /** 简单的表达式评估 */
  private evaluateExpression(expression: string, data: any): boolean {
    if (!expression) return false;

    let code = expression.trim();
    if (code.startsWith('${') && code.endsWith('}')) {
      code = code.slice(2, -1);
    }

    try {
      // 使用 Proxy 防止未定义变量报错
      const safeData = new Proxy(data || {}, {
        has: () => true,
        get: (target, prop) => {
          if (typeof prop === 'string') {
            // 优先从数据中获取，否则尝试从 lookupData 获取 (模拟作用域链)
            // 但这里是在 effect 中，为了简单和响应性，暂时只取 data() 中的值
            // 因为 data() 已经是 computed 包含了 merge logic
            return target[prop];
          }
          return undefined;
        }
      });

      return new Function('data', `with(data) { return ${code}; }`)(safeData);
    } catch (e) {
      console.warn('[FormWidget] DisabledOn usage error:', expression, e);
      return false;
    }
  }

  /** 构建表单 */
  private buildForm(): void {
    const controls: Record<string, any> = {};
    const useContextData = this.props.useContextData ?? false;

    for (const field of this.props.fields) {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }

      let initialValue: any;

      if (useContextData) {
        // 模式1: 从 Context 链中查找数据 (向上查找)
        initialValue = this.ctx.lookupData(field.name) ?? field.defaultValue ?? null;
      } else {
        // 模式2: 仅使用本地数据 (Scope 中的当前层数据或默认值)
        initialValue = this.ctx.getData(field.name) ?? field.defaultValue ?? null;
      }

      controls[field.name] = [initialValue, validators];
      // 保存初始值用于重置
      this.initialValues[field.name] = initialValue;
    }

    this.formGroup = this.fb.group(controls);

    // 监听表单变化，根据配置决定数据写入位置 (仅非只读时)
    if (!this.props.readonly) {
      this.formGroup.valueChanges.subscribe(values => {
        this.syncFormValuesToContext(values);
      });
    }
  }

  /**
   * 设置 Context 数据变化监听
   * 当 useContextData=true 时，自动同步最新数据到表单
   */
  private setupContextSync(): void {
    const useContextData = this.props.useContextData ?? false;

    if (useContextData) {
      // 使用 runInInjectionContext 包装 effect (因为 effect 必须在注入上下文中)
      runInInjectionContext(this.injector, () => {
        effect(() => {
          // 读取 Context data signal (建立依赖)
          const scopeData = this.ctx.data();

          // 更新表单值 (只在表单已构建后)
          if (this.formGroup) {
            const newValues: Record<string, any> = {};
            let hasChange = false;

            for (const field of this.props.fields) {
              const newValue = scopeData[field.name];
              const currentValue = this.formGroup.get(field.name)?.value;

              if (newValue !== undefined && newValue !== currentValue) {
                newValues[field.name] = newValue;
                hasChange = true;
              }
            }

            if (hasChange) {
              // 使用 patchValue 更新表单，避免触发 valueChanges 循环
              this.formGroup.patchValue(newValues, { emitEvent: false });
            }
          }
        }, { allowSignalWrites: true });
      });
    }
  }

  /**
   * 同步表单值到 Context
   * 根据 dataWriteMode 决定写入位置
   */
  private syncFormValuesToContext(values: Record<string, any>): void {
    const useContextData = this.props.useContextData ?? false;
    const writeMode = this.props.dataWriteMode ?? 'owner';

    for (const [key, value] of Object.entries(values)) {
      if (useContextData) {
        // 使用 Context 数据模式：根据 writeMode 决定写入位置
        switch (writeMode) {
          case 'owner':
            // 写入到数据原始所在的 Context 层
            this.ctx.setDataAt(key, value);
            break;
          case 'parent':
            // 写入到直接父级
            this.ctx.parent?.setData(key, value);
            break;
          case 'root':
            // 写入到根
            this.ctx.setRootData(key, value);
            break;
          case 'local':
          default:
            // 仅写入本地
            this.ctx.setData(key, value);
            break;
        }
      } else {
        // 不使用 Context 数据模式：仅写入本地 Form Context
        this.ctx.setData(key, value);
      }

      // 同时同步到 ScopeService (保持兼容)
      this.scope.setValue(key, value);
    }
  }

  /** 提交表单 */
  onSubmit(): void {
    if (this.formGroup.valid) {
      const values = this.formGroup.value;
      this.formSubmit.emit(values);
      console.log('Form submit:', values);
    } else {
      // 标记所有字段为已触碰以显示验证错误
      Object.values(this.formGroup.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  /** 重置表单为初始值 */
  onReset(): void {
    // 重置为初始值，而非清空
    this.formGroup.patchValue(this.initialValues);
    // 同步初始值到 Context
    this.syncFormValuesToContext(this.initialValues);
  }
}

