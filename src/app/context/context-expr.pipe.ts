import { Pipe, PipeTransform, inject } from '@angular/core';
import type { CreateExpressionSignalOptions } from './component-context/expression';
import { ComponentContext } from './component-context.service';

@Pipe({
  name: 'ctxExpr',
  standalone: true,
  pure: false,
})
export class ContextExprPipe implements PipeTransform {
  private readonly ctx = inject(ComponentContext);

  transform<T = any>(expression: any, options?: CreateExpressionSignalOptions): T {
    if (!expression || typeof expression !== 'string') {
      return expression as T;
    }
    return this.ctx.evalExpression<T>(expression, options);
  }
}

