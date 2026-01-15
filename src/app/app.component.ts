import { Component } from '@angular/core';
import { DynamicExpressionParentComponent } from './testing/dynamic-expression/parent.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DynamicExpressionParentComponent],
  template: `
    <div class="page">
      <app-dynamic-expression-parent></app-dynamic-expression-parent>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        padding: 60px 20px;
        background: #f5f5f7;
      }
    `,
  ],
})
export class AppComponent { }
