# NG Zorro 使用指南

本项目使用 [NG Zorro](https://ng.ant.design/) 作为 UI 组件库。以下是项目中使用 NG Zorro 的最佳实践。

## 模块导入

### 推荐做法 ✅

按需导入单独的模块，以优化打包体积：

```typescript
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
```

### 不推荐 ❌

```typescript
// 避免导入整个 ng-zorro-antd 模块
import { NgZorroAntdModule } from 'ng-zorro-antd';
```

## 图标配置

为了优化打包体积，请显式注册需要使用的图标：

```typescript
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { 
  SearchOutline, 
  PlusOutline, 
  DeleteOutline 
} from '@ant-design/icons-angular/icons';

const icons = [SearchOutline, PlusOutline, DeleteOutline];

export const appConfig = {
  providers: [
    { provide: NZ_ICONS, useValue: icons }
  ]
};
```

## 国际化配置

```typescript
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';

registerLocaleData(zh);

export const appConfig = {
  providers: [
    { provide: NZ_I18N, useValue: zh_CN }
  ]
};
```

## 组件使用规范

### 表格 (nz-table)

```html
<!-- 推荐：使用虚拟滚动处理大数据量 -->
<nz-table 
  [nzData]="data" 
  [nzVirtualItemSize]="54"
  [nzVirtualForTrackBy]="trackById"
  nzVirtualScroll>
  <!-- ... -->
</nz-table>

<!-- 分页配置 -->
<nz-table 
  [nzPageSize]="10"
  [nzShowSizeChanger]="true"
  [nzShowQuickJumper]="true">
</nz-table>
```

### 表单 (nz-form)

使用响应式表单：

```typescript
import { FormBuilder, Validators } from '@angular/forms';

export class MyComponent {
  private fb = inject(FormBuilder);
  
  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]]
  });
}
```

```html
<form nz-form [formGroup]="form">
  <nz-form-item>
    <nz-form-label nzRequired>用户名</nz-form-label>
    <nz-form-control nzErrorTip="请输入用户名">
      <input nz-input formControlName="username" />
    </nz-form-control>
  </nz-form-item>
</form>
```

### 按钮 (nz-button)

```html
<!-- 使用标准类型 -->
<button nz-button nzType="primary">主按钮</button>
<button nz-button nzType="default">默认按钮</button>
<button nz-button nzType="dashed">虚线按钮</button>
<button nz-button nzType="link">链接按钮</button>

<!-- 危险操作 -->
<button nz-button nzType="primary" nzDanger>删除</button>

<!-- 带图标 -->
<button nz-button nzType="primary">
  <span nz-icon nzType="plus"></span>
  新建
</button>
```

### 模态框 (nz-modal)

```typescript
import { NzModalService } from 'ng-zorro-antd/modal';

export class MyComponent {
  private modal = inject(NzModalService);
  
  showConfirm(): void {
    this.modal.confirm({
      nzTitle: '确认删除？',
      nzContent: '此操作无法撤销',
      nzOnOk: () => this.delete()
    });
  }
}
```

### 消息提示 (nz-message)

```typescript
import { NzMessageService } from 'ng-zorro-antd/message';

export class MyComponent {
  private message = inject(NzMessageService);
  
  showSuccess(): void {
    this.message.success('操作成功');
  }
  
  showError(): void {
    this.message.error('操作失败');
  }
}
```

## 样式定制

### 使用 CSS 变量

```scss
// 自定义主题色
:root {
  --ant-primary-color: #1890ff;
  --ant-success-color: #52c41a;
  --ant-warning-color: #faad14;
  --ant-error-color: #f5222d;
}
```

### 避免过度使用 ::ng-deep

```scss
// 避免 ❌
::ng-deep .ant-table {
  // ...
}

// 推荐 ✅ 使用组件提供的属性配置
// 或创建全局样式文件统一管理
```

## 性能优化

### 1. 使用 OnPush 变更检测

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent { }
```

### 2. 配合 Signal 使用

```typescript
export class MyComponent {
  tableData = signal<any[]>([]);
  loading = signal(false);
}
```

### 3. 表格虚拟滚动

对于大数据量的表格，务必启用虚拟滚动。

## 常见问题

### Q: 图标不显示？

确保已在 `app.config.ts` 中注册了对应的图标。

### Q: 样式不生效？

1. 检查是否正确导入了 NG Zorro 样式：
   ```scss
   @import 'ng-zorro-antd/ng-zorro-antd.min.css';
   ```

2. 检查组件的样式封装模式。

### Q: 国际化不生效？

确保在 `app.config.ts` 中正确配置了 `NZ_I18N` 和 `registerLocaleData`。
