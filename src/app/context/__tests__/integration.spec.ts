/**
 * 集成测试
 * 测试真实场景下的组件协作
 */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentContext, ContextHost, ComponentRegistry } from '../index';

// ========== 场景1: 表单联动 ==========

@Component({
  selector: 'form-container',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
})
class FormContainerComponent extends ContextHost {
  protected override contextType = 'form';
  protected override contextId = 'main-form';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData({
      formData: { name: '', email: '', age: 0 },
      isValid: false,
      isDirty: false,
    });
  }

  updateField(field: string, value: any): void {
    const formData = this.ctx.getData<any>('formData') || {};
    formData[field] = value;
    this.ctx.setData('formData', { ...formData });
    this.ctx.setData('isDirty', true);
    this.validateForm();
  }

  validateForm(): void {
    const formData = this.ctx.getData<any>('formData');
    const isValid =
      formData?.name?.length > 0 &&
      formData?.email?.includes('@') &&
      formData?.age > 0;
    this.ctx.setData('isValid', isValid);
  }
}

@Component({
  selector: 'form-field',
  standalone: true,
  providers: [ComponentContext],
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class FormFieldComponent extends ContextHost {
  protected override contextType = 'field';
  fieldName = '';

  get value(): any {
    const formData = this.ctx.evalExpression<any>('${formData}');
    return formData?.[this.fieldName];
  }
}

@Component({
  selector: 'form-submit',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class FormSubmitComponent extends ContextHost {
  protected override contextType = 'submit';
  protected override contextId = 'submit-btn';
  readonly isDisabled = this.ctx.createExpressionSignal<boolean>('${!isValid}');
}

@Component({
  standalone: true,
  imports: [FormContainerComponent, FormFieldComponent, FormSubmitComponent],
  template: `
    <form-container>
      <form-field></form-field>
      <form-submit></form-submit>
    </form-container>
  `,
})
class FormTestContainer {
  @ViewChild(FormContainerComponent) form!: FormContainerComponent;
  @ViewChild(FormFieldComponent) field!: FormFieldComponent;
  @ViewChild(FormSubmitComponent) submit!: FormSubmitComponent;
}

// ========== 场景2: 表格数据传递 ==========

@Component({
  selector: 'table-container',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
})
class TableContainerComponent extends ContextHost {
  protected override contextType = 'table';
  protected override contextId = 'data-table';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData({
      rows: [
        { id: 1, name: 'Item 1', price: 100 },
        { id: 2, name: 'Item 2', price: 200 },
        { id: 3, name: 'Item 3', price: 300 },
      ],
      selectedId: null,
      sortField: 'id',
      sortOrder: 'asc',
    });
  }

  selectRow(id: number): void {
    this.ctx.setData('selectedId', id);
  }

  getSelectedRow(): any {
    const rows = this.ctx.getData<any[]>('rows') || [];
    const selectedId = this.ctx.getData<number>('selectedId');
    return rows.find((r) => r.id === selectedId);
  }
}

@Component({
  selector: 'table-row',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TableRowComponent extends ContextHost {
  protected override contextType = 'row';
  rowData: any;
  readonly isSelected = this.ctx.createExpressionSignal<boolean>(
    '${selectedId === rowData?.id}'
  );

  override ngOnInit(): void {
    super.ngOnInit();
    if (this.rowData) {
      this.ctx.setData('rowData', this.rowData);
    }
  }
}

@Component({
  selector: 'table-summary',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TableSummaryComponent extends ContextHost {
  protected override contextType = 'summary';
  protected override contextId = 'table-summary';
  readonly totalPrice = this.ctx.createExpressionSignal<number>(
    '${rows.reduce((sum, row) => sum + row.price, 0)}'
  );
  readonly rowCount = this.ctx.createExpressionSignal<number>('${rows.length}');
}

@Component({
  standalone: true,
  imports: [TableContainerComponent, TableRowComponent, TableSummaryComponent],
  template: `
    <table-container>
      <table-row></table-row>
      <table-summary></table-summary>
    </table-container>
  `,
})
class TableTestContainer {
  @ViewChild(TableContainerComponent) table!: TableContainerComponent;
  @ViewChild(TableRowComponent) row!: TableRowComponent;
  @ViewChild(TableSummaryComponent) summary!: TableSummaryComponent;
}

// ========== 场景3: 弹窗数据共享 ==========

@Component({
  selector: 'main-page',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
})
class MainPageComponent extends ContextHost {
  protected override contextType = 'page';
  protected override contextId = 'main-page';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData({
      user: { name: 'John', role: 'admin' },
      settings: { theme: 'dark', language: 'en' },
    });
  }
}

@Component({
  selector: 'modal-dialog',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class ModalDialogComponent extends ContextHost {
  protected override contextType = 'modal';
  protected override contextId = 'edit-modal';
  readonly userName = this.ctx.createExpressionSignal<string>('${user.name}');
  readonly userRole = this.ctx.createExpressionSignal<string>('${user.role}');

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setData('modalState', 'open');
    this.ctx.setData('editedName', '');
  }

  saveChanges(): void {
    const editedName = this.ctx.getData<string>('editedName');
    this.ctx.setDataAtType('page', 'user', {
      name: editedName,
      role: this.userRole(),
    });
  }
}

@Component({
  standalone: true,
  imports: [MainPageComponent, ModalDialogComponent],
  template: `
    <main-page>
      <modal-dialog></modal-dialog>
    </main-page>
  `,
})
class ModalTestContainer {
  @ViewChild(MainPageComponent) page!: MainPageComponent;
  @ViewChild(ModalDialogComponent) modal!: ModalDialogComponent;
}

// ========== 测试用例 ==========

describe('集成测试', () => {
  describe('表单联动场景', () => {
    let container: FormTestContainer;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [FormTestContainer] });
      const fixture = TestBed.createComponent(FormTestContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
    });

    it('表单容器和字段组件共享数据', () => {
      const formCtx = container.form.ctx;
      const fieldCtx = container.field.ctx;

      formCtx.setData('formData', {
        name: 'Test',
        email: 'test@example.com',
        age: 25,
      });
      const formData = fieldCtx.evalExpression<any>('${formData}');
      expect(formData.name).toBe('Test');
    });

    it('填写数据后验证状态更新', () => {
      const form = container.form;
      expect(form.ctx.getData('isValid')).toBe(false);

      form.updateField('name', 'John');
      form.updateField('email', 'john@example.com');
      form.updateField('age', 30);

      expect(form.ctx.getData('isValid')).toBe(true);
    });

    it('表单无效时按钮禁用', () => {
      const submit = container.submit;
      expect(submit.isDisabled()).toBe(true);

      container.form.updateField('name', 'John');
      container.form.updateField('email', 'john@example.com');
      container.form.updateField('age', 30);

      expect(submit.isDisabled()).toBe(false);
    });

    it('修改字段后isDirty变化', () => {
      const form = container.form;
      expect(form.ctx.getData('isDirty')).toBe(false);
      form.updateField('name', 'Changed');
      expect(form.ctx.getData('isDirty')).toBe(true);
    });
  });

  describe('表格数据场景', () => {
    let container: TableTestContainer;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [TableTestContainer] });
      const fixture = TestBed.createComponent(TableTestContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
    });

    it('计算所有行的总价', () => {
      const summary = container.summary;
      expect(summary.totalPrice()).toBe(600); // 100 + 200 + 300
    });

    it('统计行数', () => {
      const summary = container.summary;
      expect(summary.rowCount()).toBe(3);
    });

    it('添加行后汇总更新', () => {
      const table = container.table;
      const summary = container.summary;

      const rows = table.ctx.getData<any[]>('rows') || [];
      rows.push({ id: 4, name: 'Item 4', price: 400 });
      table.ctx.setData('rows', [...rows]);

      expect(summary.rowCount()).toBe(4);
      expect(summary.totalPrice()).toBe(1000);
    });

    it('选中行后selectedId更新', () => {
      const table = container.table;
      expect(table.ctx.getData('selectedId')).toBeNull();

      table.selectRow(2);
      expect(table.ctx.getData('selectedId')).toBe(2);
      expect(table.getSelectedRow()?.name).toBe('Item 2');
    });
  });

  describe('弹窗数据场景', () => {
    let container: ModalTestContainer;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [ModalTestContainer] });
      const fixture = TestBed.createComponent(ModalTestContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
    });

    it('弹窗访问父页面数据', () => {
      const modal = container.modal;
      expect(modal.userName()).toBe('John');
      expect(modal.userRole()).toBe('admin');
    });

    it('弹窗有独立本地状态', () => {
      const modal = container.modal;
      expect(modal.ctx.getData('modalState')).toBe('open');
      expect(container.page.ctx.hasData('modalState')).toBe(false);
    });

    it('弹窗保存时更新页面数据', () => {
      const page = container.page;
      const modal = container.modal;

      modal.ctx.setData('editedName', 'Jane');
      modal.saveChanges();

      const user = page.ctx.getData<any>('user');
      expect(user.name).toBe('Jane');
    });

    it('页面数据变化弹窗响应', () => {
      const page = container.page;
      const modal = container.modal;

      page.ctx.setData('user', { name: 'Bob', role: 'user' });

      expect(modal.userName()).toBe('Bob');
      expect(modal.userRole()).toBe('user');
    });
  });

  describe('跨组件通信', () => {
    it('通过registry发送事件', (done) => {
      const registry = TestBed.inject(ComponentRegistry);

      registry.on$('test-event').subscribe((event) => {
        expect(event.data).toBe('test-data');
        done();
      });

      registry.broadcast('test-event', 'test-data', 'test-source');
    });

    it('按类型查询组件', () => {
      const fixture = TestBed.createComponent(FormTestContainer);
      fixture.detectChanges();

      const registry = TestBed.inject(ComponentRegistry);
      const forms = registry.getByType('form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('真实场景性能', () => {
    it('频繁更新效率', fakeAsync(() => {
      TestBed.configureTestingModule({ imports: [TableTestContainer] });
      const fixture = TestBed.createComponent(TableTestContainer);
      fixture.detectChanges();
      const table = fixture.componentInstance.table;

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const rows = table.ctx.getData<any[]>('rows') || [];
        rows[0].price = i;
        table.ctx.setData('rows', [...rows]);
        tick(10);
      }
      const duration = performance.now() - start;

      console.log(`100次更新: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(5000);
    }));
  });
});
