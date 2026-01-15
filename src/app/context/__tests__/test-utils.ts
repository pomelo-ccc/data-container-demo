/**
 * 测试工具函数
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, Type } from '@angular/core';
import { ComponentContext, ContextHost } from '../index';

/**
 * 创建简单的测试宿主组件
 */
export function createTestHost(
  contextType = 'test',
  contextId = 'test-host'
): Type<ContextHost> {
  @Component({
    standalone: true,
    providers: [ComponentContext],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '',
  })
  class TestHostComponent extends ContextHost {
    protected override contextType = contextType;
    protected override contextId = contextId;
  }

  return TestHostComponent;
}

/**
 * 快速创建测试 fixture
 */
export function createContextFixture(
  contextType = 'test',
  contextId = 'test-host'
): { fixture: ComponentFixture<ContextHost>; ctx: ComponentContext } {
  const TestHost = createTestHost(contextType, contextId);

  TestBed.configureTestingModule({
    imports: [TestHost],
  });

  const fixture = TestBed.createComponent(TestHost);
  fixture.detectChanges();

  return {
    fixture,
    ctx: fixture.componentInstance.ctx,
  };
}

/**
 * 性能测量工具
 */
export function measurePerformance(
  fn: () => void,
  iterations = 1000
): { duration: number; avgPerIteration: number } {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const duration = performance.now() - start;

  return {
    duration,
    avgPerIteration: duration / iterations,
  };
}

/**
 * 异步性能测量
 */
export async function measureAsyncPerformance(
  fn: () => Promise<void>,
  iterations = 100
): Promise<{ duration: number; avgPerIteration: number }> {
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    await fn();
  }

  const duration = performance.now() - start;

  return {
    duration,
    avgPerIteration: duration / iterations,
  };
}

/**
 * 内存使用测量（仅在支持的环境中）
 */
export function measureMemory(): number | null {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return null;
}

/**
 * 等待 Angular 变更检测完成
 */
export function flushChanges(fixture: ComponentFixture<any>): void {
  fixture.detectChanges();
  TestBed.flushEffects();
}

/**
 * 创建大量测试数据
 */
export function generateTestData(count: number): Record<string, any>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 1000,
    nested: {
      a: i * 2,
      b: `nested-${i}`,
    },
  }));
}

/**
 * 断言表达式结果
 */
export function expectExpression(
  ctx: ComponentContext,
  expression: string,
  expected: any
): void {
  const result = ctx.evalExpression(expression);
  expect(result).toEqual(expected);
}

/**
 * 断言表达式类型
 */
export function expectExpressionType(
  ctx: ComponentContext,
  expression: string,
  expectedType: string
): void {
  const result = ctx.evalExpression(expression);
  expect(typeof result).toBe(expectedType);
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建 spy 函数并计数调用次数
 */
export function createCallCounter(): {
  fn: () => void;
  count: () => number;
  reset: () => void;
} {
  let callCount = 0;

  return {
    fn: () => {
      callCount++;
    },
    count: () => callCount,
    reset: () => {
      callCount = 0;
    },
  };
}
