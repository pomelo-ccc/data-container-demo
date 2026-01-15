import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentContext } from '../component-context.service';

describe('ComponentContext expression pipeline', () => {
  let ctx: ComponentContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ComponentContext],
    });
    ctx = TestBed.inject(ComponentContext);
    ctx.init({ id: 'test', type: 'test' });
  });

  it('supports pipe syntax after single template expression', () => {
    ctx.setData('name', 'Tom');
    const s = ctx.createExpressionSignal<string>('${name} | upper');
    expect(s()).toBe('TOM');

    ctx.setData('name', 'Bob');
    expect(s()).toBe('BOB');
  });

  it('pipe args can reference scope variables', () => {
    ctx.setData('fallback', 'X');
    const s = ctx.createExpressionSignal<string>(
      '${missing} | default(fallback)'
    );
    expect(s()).toBe('X');

    ctx.setData('fallback', 'Y');
    expect(s()).toBe('Y');
  });

  it('supports injected signal sources as expression roots', () => {
    const name = signal('Alice');
    const s = ctx.createExpressionSignal<string>('${name} | upper', {
      sources: { name },
    });

    expect(s()).toBe('ALICE');
    name.set('Bob');
    expect(s()).toBe('BOB');
  });

  it('option pipes apply without pipe syntax', () => {
    ctx.setData('name', 'Tom');
    const s = ctx.createExpressionSignal<string>('${name}', {
      pipes: ['upper'],
    });
    expect(s()).toBe('TOM');
  });

  it('does not write back to context for injected source keys', () => {
    ctx.setData('name', 'LOCAL');
    const ext = signal('EXTERNAL');
    const s = ctx.createExpressionSignal<string>('${(name="CHANGED", name)}', {
      sources: { name: ext },
    });

    expect(s()).toBe('CHANGED');
    expect(ext()).toBe('EXTERNAL');
    expect(ctx.getData('name')).toBe('LOCAL');
  });
});
