import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NZ_I18N, zh_CN } from 'ng-zorro-antd/i18n';
import { NZ_ICONS } from 'ng-zorro-antd/icon';
import { registerLocaleData } from '@angular/common';
import zh from '@angular/common/locales/zh';
import {
  EyeOutline,
  EyeInvisibleOutline,
  SearchOutline,
  ReloadOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SettingOutline,
  UserOutline,
  TeamOutline,
  LockOutline,
  AppstoreOutline,
  ShoppingCartOutline,
  GiftOutline,
  BarChartOutline,
  ExportOutline,
  ImportOutline,
  PrinterOutline
} from '@ant-design/icons-angular/icons';
import { IconDefinition } from '@ant-design/icons-angular';

import { routes } from './app.routes';

// Registry 模块
import { RegistryModule } from './registry';
import { DATA_CONTAINER_PROVIDERS } from './data-container/data-container.providers';

// ActionHandle 模块
import { ActionHandleModule } from './action-handle';

registerLocaleData(zh);

// 注册需要的图标
const icons: IconDefinition[] = [
  EyeOutline,
  EyeInvisibleOutline,
  SearchOutline,
  ReloadOutline,
  PlusOutline,
  EditOutline,
  DeleteOutline,
  SettingOutline,
  UserOutline,
  TeamOutline,
  LockOutline,
  AppstoreOutline,
  ShoppingCartOutline,
  GiftOutline,
  BarChartOutline,
  ExportOutline,
  ImportOutline,
  PrinterOutline
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    { provide: NZ_ICONS, useValue: icons },
    { provide: NZ_I18N, useValue: zh_CN },

    // Registry 模块初始化
    importProvidersFrom(RegistryModule.forRoot()),

    // ActionHandle 模块初始化
    importProvidersFrom(ActionHandleModule.forRoot()),

    // Data Container 模块的 Widget 注册
    ...DATA_CONTAINER_PROVIDERS
  ]
};
