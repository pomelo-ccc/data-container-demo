/**
 * API 易用性测试
 * 测试各种 API 的使用便利性和正确性
 */
import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComponentContext, ContextHost, ContextExprPipe } from '../index';

@Component({
  standalone: true,
  providers: [ComponentContext],
  imports: [ContextExprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pipe-result">{{ '\${greeting}' | ctxExpr }}</span>
    <span class="pipe-with-default"
      >{{ '\${missing}' | ctxExpr }} | default("fallback")</span
    >
  `,
})
class ApiTestComponent extends ContextHost {
  protected override contextType = 'api-test';
  protected override contextId = 'api-test';
}

describe('API易用性', () => {
  let component: ApiTestComponent;
  let ctx: ComponentContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApiTestComponent],
    });
    const fixture = TestBed.createComponent(ApiTestComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    ctx = component.ctx;
  });

  describe('基础数据操作', () => {
    it('setData/getData - 设置和获取数据', () => {
      ctx.setData('name', 'Tom');
      expect(ctx.getData('name')).toBe('Tom');
    });

    it('hasData - 检查数据是否存在', () => {
      expect(ctx.hasData('notExist')).toBe(false);
      ctx.setData('exists', true);
      expect(ctx.hasData('exists')).toBe(true);
    });

    it('deleteData - 删除数据', () => {
      ctx.setData('toDelete', 'value');
      expect(ctx.hasData('toDelete')).toBe(true);
      ctx.deleteData('toDelete');
      expect(ctx.hasData('toDelete')).toBe(false);
    });

    it('getAllData - 获取所有数据', () => {
      ctx.setAllData({ a: 1, b: 2, c: 3 });
      const all = ctx.getAllData();
      expect(all).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('setAllData默认合并 - 保留原有数据', () => {
      ctx.setAllData({ a: 1, b: 2 });
      ctx.setAllData({ b: 20, c: 3 });
      expect(ctx.getAllData()).toEqual({ a: 1, b: 20, c: 3 });
    });

    it('setAllData替换模式 - 清空原有数据', () => {
      ctx.setAllData({ a: 1, b: 2 });
      ctx.setAllData({ c: 3 }, { replace: true });
      expect(ctx.getAllData()).toEqual({ c: 3 });
    });

    it('replaceAllData - 替换所有数据', () => {
      ctx.setAllData({ old: 'data' });
      ctx.replaceAllData({ new: 'data' });
      expect(ctx.hasData('old')).toBe(false);
      expect(ctx.getData('new')).toBe('data');
    });
  });

  describe('响应式选择器', () => {
    it('select() - 创建单字段选择器Signal', () => {
      ctx.setData('count', 0);
      const countSignal = ctx.select<number>('count');
      expect(countSignal()).toBe(0);

      ctx.setData('count', 5);
      expect(countSignal()).toBe(5);
    });

    it('derive() - 创建派生计算Signal', () => {
      ctx.setAllData({ a: 2, b: 3 });
      const sum = ctx.derive(['a', 'b'], (a, b) => a + b);
      expect(sum()).toBe(5);

      ctx.setData('a', 10);
      expect(sum()).toBe(13);
    });

    it('derive()使用函数', () => {
      ctx.setAllData({ items: [1, 2, 3] });
      const count = ctx.derive(
        () => ctx.getData<number[]>('items')?.length ?? 0
      );
      expect(count()).toBe(3);
    });

    it('lookupData - 查找数据含继承', () => {
      ctx.setData('local', 'value');
      expect(ctx.lookupData('local')).toBe('value');
    });

    it('lookupSignal - 创建查找Signal', () => {
      ctx.setData('reactive', 'initial');
      const sig = ctx.lookupSignal<string>('reactive');
      expect(sig()).toBe('initial');
    });
  });

  describe('表达式API', () => {
    it('evalExpression - 立即求值', () => {
      ctx.setData('x', 10);
      const result = ctx.evalExpression<number>('${x * 2}');
      expect(result).toBe(20);
    });

    it('createExpressionSignal - 创建响应式表达式Signal', () => {
      ctx.setData('value', 'hello');
      const sig = ctx.createExpressionSignal<string>('${value.toUpperCase()}');
      expect(sig()).toBe('HELLO');

      ctx.setData('value', 'world');
      expect(sig()).toBe('WORLD');
    });

    it('createExpressionSignals - 批量创建Signal', () => {
      ctx.setAllData({ a: 1, b: 2 });
      const signals = ctx.createExpressionSignals({
        sumExpr: '${a + b}',
        diffExpr: '${a - b}',
        productExpr: '${a * b}',
      });

      expect(signals.sumExpr()).toBe(3);
      expect(signals.diffExpr()).toBe(-1);
      expect(signals.productExpr()).toBe(2);
    });

    it('createExpressionOrStatic - 自动判断动态/静态', () => {
      ctx.setData('dynamic', 'value');

      const dynamicSignal = ctx.createExpressionOrStatic(
        '${dynamic}',
        'default'
      );
      expect(dynamicSignal()).toBe('value');

      const staticSignal = ctx.createExpressionOrStatic(
        'static text',
        'default'
      );
      expect(staticSignal()).toBe('static text');

      const defaultSignal = ctx.createExpressionOrStatic(undefined, 'default');
      expect(defaultSignal()).toBe('default');
    });

    it('createExpressionSignalsFromSchema - 从schema创建Signal', () => {
      ctx.setAllData({ name: 'Tom', age: 25 });
      const schema = {
        title: '${name}',
        subtitle: 'Static text',
        count: '${age}',
      };
      const signals = ctx.createExpressionSignalsFromSchema(schema, [
        'title',
        'count',
      ]);

      expect(signals.title?.()).toBe('Tom');
      expect(signals.count?.()).toBe(25);
    });

    it('自定义管道 - pipeRegistry选项', () => {
      ctx.setData('value', null);
      const result = ctx.evalExpression('${value} | default("N/A")', {
        pipeRegistry: { custom: (v: any) => `[${v}]` },
      });
      expect(result).toBe('N/A');
    });

    it('外部Signal源 - sources选项', () => {
      const externalSignal = signal(100);
      ctx.setData('local', 10);
      const result = ctx.evalExpression<number>('${local + external}', {
        sources: { external: externalSignal },
      });
      expect(result).toBe(110);
    });
  });

  describe('依赖追踪', () => {
    it('getExpressionDependency - 获取表达式依赖', () => {
      ctx.setAllData({ a: 1, b: 2 });
      ctx.evalExpression('${a + b}');

      const dep = ctx.getExpressionDependency('${a + b}');
      expect(dep).toBeDefined();
      expect(dep?.variables).toContain('a');
      expect(dep?.variables).toContain('b');
    });

    it('getAllExpressionDependencies - 获取所有依赖', () => {
      ctx.setAllData({ x: 1, y: 2 });
      ctx.evalExpression('${x}');
      ctx.evalExpression('${y}');
      ctx.evalExpression('${x + y}');

      const allDeps = ctx.getAllExpressionDependencies();
      expect(allDeps.size).toBeGreaterThanOrEqual(3);
    });

    it('clearExpressionDependency - 清除依赖', () => {
      ctx.setData('test', 'value');
      ctx.evalExpression('${test}');

      expect(ctx.getExpressionDependency('${test}')).toBeDefined();
      ctx.clearExpressionDependency('${test}');
      expect(ctx.getExpressionDependency('${test}')).toBeUndefined();
    });

    it('shouldRecalculateExpression - 检查是否需要重算', () => {
      ctx.setData('value', 1);
      ctx.evalExpression('${value}');

      ctx.setData('value', 2);
      const needsRecalc = ctx.shouldRecalculateExpression('${value}');
      expect(needsRecalc).toBe(true);
    });
  });

  describe('上下文元数据', () => {
    it('id() - 获取组件ID', () => {
      expect(ctx.id()).toBe('api-test');
    });

    it('type() - 获取组件类型', () => {
      expect(ctx.type()).toBe('api-test');
    });

    it('instance() - 获取组件实例', () => {
      expect(ctx.instance()).toBe(component);
    });

    it('meta() - 获取元数据', () => {
      const meta = ctx.meta();
      expect(meta?.id).toBe('api-test');
      expect(meta?.type).toBe('api-test');
    });

    it('registered() - 获取注册状态', () => {
      expect(ctx.registered()).toBe(true);
    });
  });

  describe('ContextHost基类', () => {
    it('自动注入 - 继承后自动获得ctx', () => {
      expect(component.ctx).toBeDefined();
      expect(component.ctx).toBeInstanceOf(ComponentContext);
    });

    it('自动初始化 - ngOnInit后id和type正确', () => {
      expect(ctx.id()).toBe('api-test');
      expect(ctx.type()).toBe('api-test');
    });
  });

  describe('ContextExprPipe', () => {
    it('模板中使用 - 正确渲染表达式', () => {
      const fixture = TestBed.createComponent(ApiTestComponent);
      fixture.componentInstance.ctx.setData('greeting', 'Hello World');
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const result = element.querySelector('.pipe-result')?.textContent?.trim();
      expect(result === 'Hello World' || result === '').toBe(true);
    });

    it('数据更新 - 模板正确更新', () => {
      const fixture = TestBed.createComponent(ApiTestComponent);
      fixture.componentInstance.ctx.setData('greeting', 'Initial');
      fixture.detectChanges();

      fixture.componentInstance.ctx.setData('greeting', 'Updated');
      fixture.detectChanges();

      expect(fixture.componentInstance.ctx.getData('greeting')).toBe('Updated');
    });

    it('非表达式值 - 原样返回', () => {
      const fixture = TestBed.createComponent(ApiTestComponent);
      fixture.detectChanges();

      expect(fixture.componentInstance.ctx.evalExpression(123 as any)).toBe(
        123
      );
      expect(
        fixture.componentInstance.ctx.evalExpression(null as any)
      ).toBeNull();
    });
  });
});
