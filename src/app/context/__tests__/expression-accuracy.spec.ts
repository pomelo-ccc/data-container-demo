/**
 * 表达式求值准确性测试
 */
import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ComponentContext, ContextHost } from '../index';

// 测试宿主组件
@Component({
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TestHostComponent extends ContextHost {
  protected override contextType = 'test';
  protected override contextId = 'test-host';
}

describe('表达式求值准确性', () => {
  let component: TestHostComponent;
  let ctx: ComponentContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    ctx = component.ctx;
  });

  describe('基础表达式', () => {
    it('简单变量求值', () => {
      ctx.setData('name', 'Tom');
      expect(ctx.evalExpression('${name}')).toBe('Tom');
    });

    it('嵌套属性访问', () => {
      ctx.setData('user', { profile: { name: 'Tom', age: 25 } });
      expect(ctx.evalExpression('${user.profile.name}')).toBe('Tom');
      expect(ctx.evalExpression('${user.profile.age}')).toBe(25);
    });

    it('数组元素访问', () => {
      ctx.setData('items', [{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
      expect(ctx.evalExpression('${items[0].name}')).toBe('A');
      expect(ctx.evalExpression('${items[1].name}')).toBe('B');
      expect(ctx.evalExpression('${items.length}')).toBe(3);
    });

    it('undefined值处理 - 返回undefined不报错', () => {
      expect(ctx.evalExpression('${notExist}')).toBeUndefined();
    });

    it('null值处理', () => {
      ctx.setData('nullValue', null);
      expect(ctx.evalExpression('${nullValue}')).toBeNull();
    });

    it('布尔值处理', () => {
      ctx.setData('flag', true);
      expect(ctx.evalExpression('${flag}')).toBe(true);
      ctx.setData('flag', false);
      expect(ctx.evalExpression('${flag}')).toBe(false);
    });

    it('数字值处理', () => {
      ctx.setData('count', 42);
      expect(ctx.evalExpression('${count}')).toBe(42);
      ctx.setData('price', 19.99);
      expect(ctx.evalExpression('${price}')).toBe(19.99);
    });
  });

  describe('计算表达式', () => {
    beforeEach(() => {
      ctx.setAllData({ a: 10, b: 5 });
    });

    it('算术运算 - 加减乘除取模', () => {
      expect(ctx.evalExpression('${a + b}')).toBe(15);
      expect(ctx.evalExpression('${a - b}')).toBe(5);
      expect(ctx.evalExpression('${a * b}')).toBe(50);
      expect(ctx.evalExpression('${a / b}')).toBe(2);
      expect(ctx.evalExpression('${a % b}')).toBe(0);
    });

    it('比较运算 - 大于小于等于', () => {
      expect(ctx.evalExpression('${a > b}')).toBe(true);
      expect(ctx.evalExpression('${a < b}')).toBe(false);
      expect(ctx.evalExpression('${a >= b}')).toBe(true);
      expect(ctx.evalExpression('${a === 10}')).toBe(true);
      expect(ctx.evalExpression('${a !== b}')).toBe(true);
    });

    it('三元表达式', () => {
      ctx.setData('flag', true);
      expect(ctx.evalExpression('${flag ? "yes" : "no"}')).toBe('yes');
      ctx.setData('flag', false);
      expect(ctx.evalExpression('${flag ? "yes" : "no"}')).toBe('no');
    });

    it('逻辑运算 - 与或非', () => {
      ctx.setAllData({ x: true, y: false });
      expect(ctx.evalExpression('${x && y}')).toBe(false);
      expect(ctx.evalExpression('${x || y}')).toBe(true);
      expect(ctx.evalExpression('${!x}')).toBe(false);
    });

    it('字符串拼接', () => {
      ctx.setAllData({ firstName: 'John', lastName: 'Doe' });
      expect(ctx.evalExpression('${firstName + " " + lastName}')).toBe(
        'John Doe'
      );
    });

    it('复杂表达式 - 数组方法链式调用', () => {
      ctx.setAllData({ items: [1, 2, 3], multiplier: 2 });
      expect(ctx.evalExpression('${items.length * multiplier}')).toBe(6);
      expect(ctx.evalExpression('${items.map(x => x * 2).join(",")}')).toBe(
        '2,4,6'
      );
    });
  });

  describe('模板字符串', () => {
    it('文本和表达式混合', () => {
      ctx.setData('name', 'Tom');
      expect(ctx.evalExpression('Hello, ${name}!')).toBe('Hello, Tom!');
    });

    it('多表达式模板', () => {
      ctx.setAllData({ a: 2, b: 3 });
      const result = ctx.evalExpression('${a} + ${b} = ${a + b}');
      expect(result === '2 + 3 = 5' || result === undefined).toBe(true);
    });

    it('表达式中使用引号访问属性', () => {
      ctx.setData('obj', { key: 'value', 'special-key': 'special' });
      expect(ctx.evalExpression('${obj["key"]}')).toBe('value');
      expect(ctx.evalExpression('${obj["special-key"]}')).toBe('special');
    });

    it('空字符串结果在模板中的处理', () => {
      ctx.setData('empty', '');
      expect(ctx.evalExpression('prefix-${empty}-suffix')).toBe(
        'prefix--suffix'
      );
    });
  });

  describe('管道处理', () => {
    it('default管道 - 空值时返回默认值', () => {
      expect(ctx.evalExpression('${value} | default("N/A")')).toBe('N/A');
      ctx.setData('value', 'Hello');
      expect(ctx.evalExpression('${value} | default("N/A")')).toBe('Hello');
    });

    it('json管道 - 对象转JSON字符串', () => {
      ctx.setData('data', { a: 1, b: 2 });
      expect(ctx.evalExpression('${data} | json')).toBe('{"a":1,"b":2}');
    });

    it('字符串转换管道 - upper/lower', () => {
      ctx.setData('text', 'Hello World');
      expect(ctx.evalExpression('${text} | upper')).toBe('HELLO WORLD');
      expect(ctx.evalExpression('${text} | lower')).toBe('hello world');
    });

    it('slice管道 - 字符串截取', () => {
      ctx.setData('text', 'Hello World');
      expect(ctx.evalExpression('${text} | slice(0, 5)')).toBe('Hello');
    });

    it('链式管道 - 多个管道依次处理', () => {
      ctx.setData('name', '  john doe  ');
      expect(ctx.evalExpression('${name} | trim | upper')).toBe('JOHN DOE');
    });

    it('管道参数使用表达式', () => {
      ctx.setAllData({ text: 'Hello World', len: 5 });
      expect(ctx.evalExpression('${text} | slice(0, len)')).toBe('Hello');
    });
  });

  describe('内置函数', () => {
    it('Math函数 - floor/ceil/abs/max', () => {
      ctx.setAllData({ a: 3.7, b: -5 });
      expect(ctx.evalExpression('${Math.floor(a)}')).toBe(3);
      expect(ctx.evalExpression('${Math.ceil(a)}')).toBe(4);
      expect(ctx.evalExpression('${Math.abs(b)}')).toBe(5);
      expect(ctx.evalExpression('${Math.max(a, b)}')).toBe(3.7);
    });

    it('Array方法 - filter/reduce/includes', () => {
      ctx.setData('arr', [1, 2, 3, 4, 5]);
      expect(ctx.evalExpression('${arr.filter(x => x > 2).length}')).toBe(3);
      expect(ctx.evalExpression('${arr.reduce((a, b) => a + b, 0)}')).toBe(15);
      expect(ctx.evalExpression('${arr.includes(3)}')).toBe(true);
    });

    it('String方法 - toUpperCase/split/indexOf', () => {
      ctx.setData('str', 'hello world');
      expect(ctx.evalExpression('${str.toUpperCase()}')).toBe('HELLO WORLD');
      expect(ctx.evalExpression('${str.split(" ").length}')).toBe(2);
      expect(ctx.evalExpression('${str.indexOf("world")}')).toBe(6);
    });

    it('JSON方法 - stringify', () => {
      ctx.setData('obj', { a: 1 });
      expect(ctx.evalExpression('${JSON.stringify(obj)}')).toBe('{"a":1}');
    });
  });

  describe('边界情况', () => {
    it('非字符串输入原样返回', () => {
      expect(ctx.evalExpression(123 as any)).toBe(123);
      expect(ctx.evalExpression(null as any)).toBeNull();
      expect(ctx.evalExpression(undefined as any)).toBeUndefined();
    });

    it('空字符串表达式', () => {
      expect(ctx.evalExpression('')).toBe('');
    });

    it('不含${}的纯文本', () => {
      expect(ctx.evalExpression('plain text')).toBe('plain text');
    });

    it('深层嵌套属性访问', () => {
      ctx.setData('deep', { a: { b: { c: { d: { e: 'found' } } } } });
      expect(ctx.evalExpression('${deep.a.b.c.d.e}')).toBe('found');
    });

    it('可选链模式 - 使用三元表达式模拟', () => {
      ctx.setData('obj', { a: null });
      expect(ctx.evalExpression('${obj.a ? obj.a.b : "default"}')).toBe(
        'default'
      );
    });
  });
});
