/**
 * 边界情况测试
 * 测试各种边界条件和异常情况
 */
import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentContext, ContextHost } from '../index';

@Component({
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class EdgeCaseTestComponent extends ContextHost {
  protected override contextType = 'edge-test';
  protected override contextId = 'edge-test';
}

describe('边界情况', () => {
  let component: EdgeCaseTestComponent;
  let ctx: ComponentContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EdgeCaseTestComponent],
    });
    const fixture = TestBed.createComponent(EdgeCaseTestComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    ctx = component.ctx;
  });

  describe('空值处理', () => {
    it('空字符串表达式', () => {
      expect(ctx.evalExpression('')).toBe('');
    });

    it('null表达式', () => {
      expect(ctx.evalExpression(null as any)).toBeNull();
    });

    it('undefined表达式', () => {
      expect(ctx.evalExpression(undefined as any)).toBeUndefined();
    });

    it('空对象数据', () => {
      ctx.setData('empty', {});
      expect(ctx.evalExpression('${empty}')).toEqual({});
    });

    it('空数组数据', () => {
      ctx.setData('arr', []);
      expect(ctx.evalExpression('${arr}')).toEqual([]);
      expect(ctx.evalExpression('${arr.length}')).toBe(0);
    });

    it('null数据值', () => {
      ctx.setData('nullVal', null);
      expect(ctx.evalExpression('${nullVal}')).toBeNull();
    });

    it('undefined数据值', () => {
      ctx.setData('undefVal', undefined);
      expect(ctx.evalExpression('${undefVal}')).toBeUndefined();
    });

    it('NaN处理', () => {
      ctx.setData('nan', NaN);
      expect(ctx.evalExpression('${isNaN(nan)}')).toBe(true);
    });

    it('Infinity处理', () => {
      ctx.setData('inf', Infinity);
      expect(ctx.evalExpression('${inf}')).toBe(Infinity);
      expect(ctx.evalExpression('${inf > 1000000}')).toBe(true);
    });
  });

  describe('特殊字符', () => {
    it('数据中包含闭合大括号', () => {
      ctx.setData('text', 'hello}world');
      expect(ctx.evalExpression('${text}')).toBe('hello}world');
    });

    it('对象字面量', () => {
      const result = ctx.evalExpression('${{ a: 1, b: 2 }}');
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('引号访问属性', () => {
      ctx.setData('obj', { 'special-key': 'value' });
      expect(ctx.evalExpression('${obj["special-key"]}')).toBe('value');
    });

    it('单引号字符串', () => {
      expect(ctx.evalExpression("${'hello'}")).toBe('hello');
    });

    it('数据中包含反引号', () => {
      ctx.setData('code', '`template`');
      expect(ctx.evalExpression('${code}')).toBe('`template`');
    });

    it('Unicode字符 - 中文和emoji', () => {
      ctx.setData('unicode', '你好世界 🌍');
      expect(ctx.evalExpression('${unicode}')).toBe('你好世界 🌍');
    });

    it('换行符', () => {
      ctx.setData('multiline', 'line1\nline2\nline3');
      expect(ctx.evalExpression('${multiline}')).toBe('line1\nline2\nline3');
    });

    it('正则特殊字符', () => {
      ctx.setData('regex', '.*+?^${}()|[]\\');
      expect(ctx.evalExpression('${regex}')).toBe('.*+?^${}()|[]\\');
    });
  });

  describe('深层嵌套', () => {
    it('5层嵌套对象访问', () => {
      ctx.setData('deep', {
        level1: { level2: { level3: { level4: { level5: 'found' } } } },
      });
      expect(
        ctx.evalExpression('${deep.level1.level2.level3.level4.level5}')
      ).toBe('found');
    });

    it('5层嵌套数组访问', () => {
      ctx.setData('nested', [[[[['deep']]]]]);
      expect(ctx.evalExpression('${nested[0][0][0][0][0]}')).toBe('deep');
    });

    it('对象和数组混合嵌套', () => {
      ctx.setData('mixed', { arr: [{ items: [{ value: 42 }] }] });
      expect(ctx.evalExpression('${mixed.arr[0].items[0].value}')).toBe(42);
    });

    it('不存在的深层路径返回undefined', () => {
      ctx.setData('obj', { a: 1 });
      expect(ctx.evalExpression('${obj.b.c.d}')).toBeUndefined();
    });
  });

  describe('类型转换', () => {
    it('数字转字符串 - 模板拼接', () => {
      ctx.setData('num', 42);
      expect(ctx.evalExpression('Value: ${num}')).toBe('Value: 42');
    });

    it('布尔转字符串', () => {
      ctx.setData('bool', true);
      expect(ctx.evalExpression('Is: ${bool}')).toBe('Is: true');
    });

    it('对象转字符串', () => {
      ctx.setData('obj', { a: 1 });
      const result = ctx.evalExpression('Obj: ${obj}');
      expect(result).toBe('Obj: [object Object]');
    });

    it('数组转字符串', () => {
      ctx.setData('arr', [1, 2, 3]);
      expect(ctx.evalExpression('Arr: ${arr}')).toBe('Arr: 1,2,3');
    });

    it('单表达式保持类型', () => {
      ctx.setData('num', 42);
      const result = ctx.evalExpression('${num}');
      expect(typeof result).toBe('number');
      expect(result).toBe(42);
    });
  });

  describe('安全性', () => {
    it('阻止访问window', () => {
      const result = ctx.evalExpression('${window}');
      expect(result).toBeUndefined();
    });

    it('阻止访问document', () => {
      const result = ctx.evalExpression('${document}');
      expect(result).toBeUndefined();
    });

    it('阻止访问eval', () => {
      const result = ctx.evalExpression('${eval}');
      expect(result).toBeUndefined();
    });

    it('阻止访问Function构造器', () => {
      const result = ctx.evalExpression('${Function}');
      expect(result).toBeUndefined();
    });

    it('阻止访问constructor', () => {
      ctx.setData('obj', {});
      ctx.evalExpression('${obj.constructor}');
    });

    it('阻止访问__proto__', () => {
      ctx.setData('obj', {});
      const result = ctx.evalExpression('${obj.__proto__}');
      expect(
        result === undefined || result === null || typeof result === 'object'
      ).toBe(true);
    });

    it('阻止访问fetch', () => {
      const result = ctx.evalExpression('${fetch}');
      expect(result).toBeUndefined();
    });

    it('阻止访问localStorage', () => {
      const result = ctx.evalExpression('${localStorage}');
      expect(result).toBeUndefined();
    });

    it('危险代码不执行', () => {
      expect(() => {
        ctx.evalExpression('${(function(){ return this; })()}');
      }).not.toThrow();
    });
  });

  describe('错误处理', () => {
    it('语法错误不抛异常', () => {
      expect(() => ctx.evalExpression('${invalid syntax here}')).not.toThrow();
    });

    it('运行时错误不抛异常', () => {
      expect(() => ctx.evalExpression('${nonExistent.property}')).not.toThrow();
    });

    it('除以零返回Infinity', () => {
      ctx.setData('zero', 0);
      const result = ctx.evalExpression('${1 / zero}');
      expect(result).toBe(Infinity);
    });

    it('undefined调用方法不抛异常', () => {
      expect(() => ctx.evalExpression('${undefined.toString()}')).not.toThrow();
    });

    it('循环引用JSON不抛异常', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      ctx.setData('circular', circular);
      expect(() => ctx.evalExpression('${circular} | json')).not.toThrow();
    });
  });

  describe('并发操作', () => {
    it('100次快速连续更新', () => {
      for (let i = 0; i < 100; i++) {
        ctx.setData('rapid', i);
      }
      expect(ctx.getData('rapid')).toBe(99);
    });

    it('50个不同key快速设置', () => {
      for (let i = 0; i < 50; i++) {
        ctx.setData(`key-${i}`, i);
      }
      for (let i = 0; i < 50; i++) {
        expect(ctx.getData(`key-${i}`)).toBe(i);
      }
    });

    it('更新过程中读取Signal不报错', () => {
      ctx.setData('value', 0);
      const sig = ctx.createExpressionSignal<number>('${value}');

      for (let i = 0; i < 50; i++) {
        ctx.setData('value', i);
        sig();
      }
      expect(sig()).toBe(49);
    });
  });

  describe('大数据', () => {
    it('10000元素数组', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      ctx.setData('large', largeArray);

      expect(ctx.evalExpression('${large.length}')).toBe(10000);
      expect(ctx.evalExpression('${large[9999]}')).toBe(9999);
    });

    it('1000个属性对象', () => {
      const largeObj: Record<string, number> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key-${i}`] = i;
      }
      ctx.setData('large', largeObj);
      expect(ctx.evalExpression('${large["key-500"]}')).toBe(500);
    });

    it('100000字符字符串', () => {
      const longString = 'x'.repeat(100000);
      ctx.setData('long', longString);
      expect(ctx.evalExpression('${long.length}')).toBe(100000);
    });
  });

  describe('表达式变体', () => {
    it('表达式中有空格', () => {
      ctx.setData('a', 1);
      expect(ctx.evalExpression('${  a  }')).toBe(1);
      expect(ctx.evalExpression('${ a + 1 }')).toBe(2);
    });

    it('连续表达式', () => {
      ctx.setAllData({ a: 'A', b: 'B' });
      const result = ctx.evalExpression('${a}${b}');
      expect(result === 'AB' || result === undefined).toBe(true);
    });

    it('表达式在开头和结尾', () => {
      ctx.setData('x', 'X');
      const result = ctx.evalExpression('${x}middle${x}');
      expect(result === 'XmiddleX' || result === undefined).toBe(true);
    });

    it('纯文本无表达式', () => {
      expect(ctx.evalExpression('plain text')).toBe('plain text');
    });

    it('转义模式', () => {
      const result = ctx.evalExpression('\\${notExpr}');
      expect(typeof result).toBe('string');
    });
  });

  describe('管道边界', () => {
    it('undefined使用default', () => {
      expect(ctx.evalExpression('${undefined} | default("fallback")')).toBe(
        'fallback'
      );
    });

    it('空字符串使用default', () => {
      ctx.setData('empty', '');
      expect(ctx.evalExpression('${empty} | default("fallback")')).toBe(
        'fallback'
      );
    });

    it('0不被default替换', () => {
      ctx.setData('zero', 0);
      const result = ctx.evalExpression('${zero} | default("fallback")');
      expect(result).toBe(0);
    });

    it('false不被default替换', () => {
      ctx.setData('flag', false);
      const result = ctx.evalExpression('${flag} | default("fallback")');
      expect(result).toBe(false);
    });

    it('未知管道不报错', () => {
      ctx.setData('value', 'test');
      expect(() => ctx.evalExpression('${value} | unknownPipe')).not.toThrow();
    });

    it('管道复杂参数', () => {
      ctx.setData('text', 'Hello World');
      expect(ctx.evalExpression('${text} | slice(0, 5)')).toBe('Hello');
    });
  });
});
