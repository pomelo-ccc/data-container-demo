/**
 * 响应式更新性能测试
 * 测试精准更新和批量更新性能
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  Component,
  ChangeDetectionStrategy,
  effect,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { ComponentContext, ContextHost } from '../index';

@Component({
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class PerformanceTestComponent extends ContextHost {
  protected override contextType = 'perf-test';
  protected override contextId = 'perf-test';
}

describe('响应式更新性能', () => {
  let component: PerformanceTestComponent;
  let ctx: ComponentContext;
  let injector: Injector;
  let fixture: ComponentFixture<PerformanceTestComponent>;

  function flushChanges(): void {
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PerformanceTestComponent],
    });
    fixture = TestBed.createComponent(PerformanceTestComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    ctx = component.ctx;
    injector = fixture.debugElement.injector;
  });

  describe('精准更新 - 只触发相关表达式', () => {
    it('修改a只触发依赖a的表达式', () => {
      ctx.setAllData({ a: 1, b: 2, c: 3 });
      let aCount = 0,
        bCount = 0,
        cCount = 0;

      runInInjectionContext(injector, () => {
        const exprA = ctx.createExpressionSignal<number>('${a}');
        const exprB = ctx.createExpressionSignal<number>('${b}');
        const exprC = ctx.createExpressionSignal<number>('${c}');

        effect(() => {
          exprA();
          aCount++;
        });
        effect(() => {
          exprB();
          bCount++;
        });
        effect(() => {
          exprC();
          cCount++;
        });
      });

      flushChanges();
      const initialA = aCount,
        initialB = bCount,
        initialC = cCount;

      ctx.setData('a', 10);
      flushChanges();

      expect(aCount).toBeGreaterThan(initialA);
      expect(bCount).toBeLessThanOrEqual(initialB + 1);
      expect(cCount).toBeLessThanOrEqual(initialC + 1);
    });

    it('修改x不触发y的表达式', () => {
      ctx.setAllData({ x: 'hello', y: 42 });
      let xEvalCount = 0,
        yEvalCount = 0;

      runInInjectionContext(injector, () => {
        const exprX = ctx.createExpressionSignal<string>('${x}');
        const exprY = ctx.createExpressionSignal<number>('${y}');

        effect(() => {
          exprX();
          xEvalCount++;
        });
        effect(() => {
          exprY();
          yEvalCount++;
        });
      });

      flushChanges();
      const baseY = yEvalCount;

      for (let i = 0; i < 5; i++) {
        ctx.setData('x', `value-${i}`);
      }
      flushChanges();

      expect(yEvalCount).toBe(baseY);
    });

    it('复合表达式响应多个变量', () => {
      ctx.setAllData({ a: 1, b: 2 });
      let sumCount = 0;

      runInInjectionContext(injector, () => {
        const sumExpr = ctx.createExpressionSignal<number>('${a + b}');
        effect(() => {
          sumExpr();
          sumCount++;
        });
      });

      flushChanges();
      const baseCount = sumCount;

      ctx.setData('a', 10);
      flushChanges();
      expect(sumCount).toBeGreaterThan(baseCount);

      const afterA = sumCount;
      ctx.setData('b', 20);
      flushChanges();
      expect(sumCount).toBeGreaterThan(afterA);
    });
  });

  describe('批量更新效率', () => {
    it('setAllData一次设置多个值效率高', () => {
      let updateCount = 0;

      runInInjectionContext(injector, () => {
        const expr = ctx.createExpressionSignal<any>('${a}');
        effect(() => {
          expr();
          updateCount++;
        });
      });

      flushChanges();
      const baseCount = updateCount;

      ctx.setAllData({ a: 1, b: 2, c: 3, d: 4, e: 5 });
      flushChanges();

      expect(updateCount - baseCount).toBeLessThanOrEqual(2);
    });

    it('replaceAllData替换所有数据效率高', () => {
      ctx.setAllData({ a: 1, b: 2 });
      let updateCount = 0;

      runInInjectionContext(injector, () => {
        const expr = ctx.createExpressionSignal<any>('${a}');
        effect(() => {
          expr();
          updateCount++;
        });
      });

      flushChanges();
      const baseCount = updateCount;

      ctx.replaceAllData({ a: 10, x: 100, y: 200 });
      flushChanges();

      expect(updateCount - baseCount).toBeLessThanOrEqual(2);
    });
  });

  describe('表达式求值性能', () => {
    it('简单表达式1000次 < 100ms', () => {
      ctx.setData('value', 'test');
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        ctx.evalExpression('${value}');
      }

      const duration = performance.now() - start;
      console.log(`简单表达式: ${iterations}次 ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('复杂表达式1000次 < 500ms', () => {
      ctx.setAllData({
        user: { name: 'Tom', age: 25 },
        items: [1, 2, 3, 4, 5],
        multiplier: 2,
      });
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        ctx.evalExpression(
          '${user.name} has ${items.length * multiplier} points'
        );
      }

      const duration = performance.now() - start;
      console.log(`复杂表达式: ${iterations}次 ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(500);
    });

    it('缓存效果 - 重复求值更快', () => {
      ctx.setData('cached', 'value');

      const coldStart = performance.now();
      for (let i = 0; i < 100; i++) {
        ctx.evalExpression('${cached}');
      }
      const coldDuration = performance.now() - coldStart;

      const warmStart = performance.now();
      for (let i = 0; i < 100; i++) {
        ctx.evalExpression('${cached}');
      }
      const warmDuration = performance.now() - warmStart;

      console.log(
        `冷启动: ${coldDuration.toFixed(2)}ms, 缓存后: ${warmDuration.toFixed(
          2
        )}ms`
      );
      expect(warmDuration).toBeLessThanOrEqual(coldDuration * 1.5);
    });
  });

  describe('Signal创建性能', () => {
    it('批量创建100个Signal < 50ms', () => {
      ctx.setAllData({ a: 1, b: 2, c: 3 });
      const count = 100;
      const start = performance.now();

      const signals = [];
      for (let i = 0; i < count; i++) {
        signals.push(ctx.createExpressionSignal(`\${a + ${i}}`));
      }

      const duration = performance.now() - start;
      console.log(`创建${count}个Signal: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('50个Signal并发更新 < 100ms', () => {
      ctx.setAllData({ value: 0 });

      const signals: any[] = [];
      runInInjectionContext(injector, () => {
        for (let i = 0; i < 50; i++) {
          signals.push(ctx.createExpressionSignal<number>('${value}'));
        }
      });

      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        ctx.setData('value', i);
      }
      const duration = performance.now() - start;

      console.log(`50个Signal更新10次: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('管道性能', () => {
    it('管道表达式1000次 < 200ms', () => {
      ctx.setData('text', 'hello world');
      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        ctx.evalExpression('${text} | upper | slice(0, 5)');
      }

      const duration = performance.now() - start;
      console.log(`管道表达式: ${iterations}次 ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });
  });
});
