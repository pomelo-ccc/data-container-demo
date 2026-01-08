import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScopeService } from '../services/scope.service';

describe('ScopeService', () => {
    let service: ScopeService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ScopeService]
        });
        service = TestBed.inject(ScopeService);
    });

    describe('基本数据操作', () => {
        it('应该能够创建服务实例', () => {
            expect(service).toBeTruthy();
        });

        it('应该能够设置和获取单个值', () => {
            service.setValue('name', '张三');
            expect(service.getValue('name')).toBe('张三');
        });

        it('应该能够获取不存在的值时返回默认值', () => {
            expect(service.getValue('nonexistent', 'default')).toBe('default');
        });

        it('应该能够批量更新数据', () => {
            service.updateData({ a: 1, b: 2, c: 3 });
            expect(service.getValue('a')).toBe(1);
            expect(service.getValue('b')).toBe(2);
            expect(service.getValue('c')).toBe(3);
        });

        it('应该能够重置数据', () => {
            service.updateData({ a: 1, b: 2 });
            service.resetData();
            expect(service.getLocalData()).toEqual({});
        });
    });

    describe('父子 Scope 链接', () => {
        let parentScope: ScopeService;
        let childScope: ScopeService;

        beforeEach(() => {
            parentScope = new ScopeService();
            childScope = new ScopeService();
        });

        it('应该能够建立父子关系', () => {
            childScope.setParent(parentScope);
            expect(childScope.getParent()).toBe(parentScope);
        });

        it('子 Scope 应该能够读取父 Scope 的数据', () => {
            parentScope.setValue('parentValue', '来自父级');
            childScope.setParent(parentScope);

            expect(childScope.getValue('parentValue')).toBe('来自父级');
        });

        it('子 Scope 的数据应该覆盖父 Scope 的同名数据', () => {
            parentScope.setValue('name', '父级名称');
            childScope.setParent(parentScope);
            childScope.setValue('name', '子级名称');

            expect(childScope.getValue('name')).toBe('子级名称');
        });

        it('应该支持向上冒泡写入', () => {
            childScope.setParent(parentScope);
            childScope.setValue('bubbleValue', '冒泡值', true);

            expect(parentScope.getValue('bubbleValue')).toBe('冒泡值');
            expect(childScope.getLocalData()['bubbleValue']).toBeUndefined();
        });

        it('data() Signal 应该合并父子数据', () => {
            parentScope.updateData({ a: 1, b: 2 });
            childScope.setParent(parentScope);
            childScope.updateData({ b: 20, c: 3 });

            const mergedData = childScope.data();
            expect(mergedData).toEqual({ a: 1, b: 20, c: 3 });
        });
    });

    describe('表达式评估', () => {
        it('应该能够评估简单的布尔表达式', () => {
            service.setValue('isActive', true);
            expect(service.evaluateExpression('${isActive} === true')).toBe(true);
        });

        it('应该能够评估数值比较表达式', () => {
            service.setValue('count', 10);
            expect(service.evaluateExpression('${count} > 5')).toBe(true);
            expect(service.evaluateExpression('${count} < 5')).toBe(false);
        });

        it('应该能够处理不存在的变量', () => {
            expect(service.evaluateExpression('${nonexistent} === null')).toBe(true);
        });

        it('空表达式应该返回 true', () => {
            expect(service.evaluateExpression('')).toBe(true);
        });

        it('无效表达式应该返回 true (容错处理)', () => {
            expect(service.evaluateExpression('invalid expression !!!')).toBe(true);
        });
    });
});
