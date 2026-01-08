import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ContainerComponent } from './data-container/container/container.component';
import { ModelService } from './data-container/services/model.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzDividerModule,
    NzTagModule,
    ContainerComponent
  ],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>📦 数据容器组件演示</h1>
        <p>基于 Angular 16.2 + ng-zorro-antd 的 Schema 驱动容器系统</p>
        <div class="component-tags">
          <nz-tag nzColor="blue">Container</nz-tag>
          <nz-tag nzColor="green">Table</nz-tag>
          <nz-tag nzColor="orange">Form</nz-tag>
          <nz-tag nzColor="purple">Button</nz-tag>
          <nz-tag nzColor="cyan">List</nz-tag>
        </div>
      </header>

      <nz-divider></nz-divider>

      <!-- 容器渲染区域 -->
      <section class="demo-container">
        <nz-card nzTitle="完整功能演示 - 通过 name 加载模型">
          <app-container [modelName]="'demo-full'"></app-container>
        </nz-card>
      </section>

      <!-- 使用说明 -->
      <section class="usage-info">
        <nz-card nzTitle="📖 使用说明">
          <div class="info-content">
            <h4>通过 Name 查询模型</h4>
            <pre class="code-block">&lt;app-container [modelName]="'demo-full'"&gt;&lt;/app-container&gt;</pre>
            
            <h4>或使用 renderData</h4>
            <pre class="code-block">&lt;app-container [renderData]="&#123; name: 'demo-full', data: &#123; userId: 1 &#125; &#125;"&gt;&lt;/app-container&gt;</pre>
          </div>
        </nz-card>
      </section>
    </div>
  `,
  styles: [`
    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .app-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .app-header h1 {
      font-size: 28px;
      color: #1890ff;
      margin-bottom: 8px;
    }

    .app-header p {
      color: #666;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .component-tags {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .demo-container {
      margin-bottom: 24px;
    }

    .usage-info {
      margin-bottom: 24px;
    }

    .info-content h4 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    .info-content h4:first-child {
      margin-top: 0;
    }

    .code-block {
      background: #282c34;
      color: #abb2bf;
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      margin: 8px 0;
    }

    ::ng-deep .ant-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    ::ng-deep .ant-card-head {
      background: #fafafa;
      border-radius: 8px 8px 0 0;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'data-container-demo';

  private readonly modelService = inject(ModelService);

  ngOnInit(): void {
    // 确认模型已注册
    console.log('Available models:', this.modelService.getRegisteredModelNames());
  }
}
