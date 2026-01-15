import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentContext } from './component-context.service';
import { ContextHost } from './context-host.base';
import { ContextExprPipe } from './context-expr.pipe';

@Component({
  standalone: true,
  imports: [ContextExprPipe],
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ '\${name}' | ctxExpr }}`,
})
class HostComponent extends ContextHost {
  protected override contextType = 'test';
  protected override contextId = 'test';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setData('name', 'Tom');
  }
}

describe('ContextExprPipe', () => {
  it('renders expression using injected ComponentContext', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(
      'Tom'
    );

    fixture.componentInstance.ctx.setData('name', 'Bob');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe(
      'Bob'
    );
  });
});

