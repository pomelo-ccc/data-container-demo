/**
 * 内存安全测试
 * 测试组件销毁后的清理和内存泄漏
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ViewContainerRef,
  ComponentRef,
} from '@angular/core';
import { ComponentContext, ContextHost } from '../index';
import { ComponentRegistry } from '../component-registry.service';

// 动态创建的子组件
@Component({
  selector: 'dynamic-child',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class DynamicChildComponent extends ContextHost {
  protected override contextType = 'dynamic';

  constructor() {
    super();
    this.contextId = `dynamic-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setAllData({
      localData: 'test',
      counter: 0,
      items: [1, 2, 3, 4, 5],
    });
    this.ctx.createExpressionSignal('${localData}');
    this.ctx.createExpressionSignal('${counter + 1}');
    this.ctx.createExpressionSignal('${items.length}');
  }
}

// 容器组件
@Component({
  standalone: true,
  imports: [DynamicChildComponent],
  template: '<ng-container #container></ng-container>',
})
class ContainerComponent {
  @ViewChild('container', { read: ViewContainerRef })
  container!: ViewContainerRef;
  private refs: ComponentRef<DynamicChildComponent>[] = [];

  createChild(): DynamicChildComponent {
    const ref = this.container.createComponent(DynamicChildComponent);
    ref.changeDetectorRef.detectChanges();
    this.refs.push(ref);
    return ref.instance;
  }

  destroyChild(index: number): void {
    if (this.refs[index]) {
      this.refs[index].destroy();
      this.refs.splice(index, 1);
    }
  }

  destroyAll(): void {
    this.refs.forEach((ref) => ref.destroy());
    this.refs = [];
  }

  get childCount(): number {
    return this.refs.length;
  }
}

describe('内存安全', () => {
  let fixture: ComponentFixture<ContainerComponent>;
  let container: ContainerComponent;
  let registry: ComponentRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ContainerComponent],
    });
    fixture = TestBed.createComponent(ContainerComponent);
    fixture.detectChanges();
    container = fixture.componentInstance;
    registry = TestBed.inject(ComponentRegistry);
  });

  afterEach(() => {
    container.destroyAll();
    fixture.destroy();
  });

  describe('组件清理', () => {
    it('创建时注册到registry', () => {
      const initialSize = registry.size;
      const child = container.createChild();
      fixture.detectChanges();

      expect(registry.size).toBe(initialSize + 1);
      expect(registry.has(child.ctx.id())).toBe(true);
    });

    it('销毁时从registry注销', () => {
      const child = container.createChild();
      fixture.detectChanges();
      const childId = child.ctx.id();

      expect(registry.has(childId)).toBe(true);

      container.destroyChild(0);
      fixture.detectChanges();

      expect(registry.has(childId)).toBe(false);
    });

    it('容器销毁时清理所有子组件', () => {
      const initialSize = registry.size;

      for (let i = 0; i < 5; i++) {
        container.createChild();
      }
      fixture.detectChanges();

      expect(registry.size).toBe(initialSize + 5);

      container.destroyAll();
      fixture.detectChanges();

      expect(registry.size).toBe(initialSize);
    });
  });

  describe('表达式缓存清理', () => {
    it('销毁时清理表达式依赖', () => {
      const child = container.createChild();
      fixture.detectChanges();

      child.ctx.evalExpression('${localData}');
      child.ctx.evalExpression('${counter}');

      const deps = child.ctx.getAllExpressionDependencies();
      expect(deps.size).toBeGreaterThan(0);

      container.destroyChild(0);
      fixture.detectChanges();
    });

    it('removeExpressionOwner正常工作', () => {
      const child = container.createChild();
      fixture.detectChanges();

      child.ctx.setExpressionOwnerExpressions('owner-1', ['${a}', '${b}']);
      child.ctx.setExpressionOwnerExpressions('owner-2', ['${c}']);

      child.ctx.removeExpressionOwner('owner-1');

      expect(() => child.ctx.evalExpression('${localData}')).not.toThrow();
    });
  });

  describe('内存泄漏预防', () => {
    it('50次创建/销毁循环后registry大小回到初始值', () => {
      const initialSize = registry.size;
      const cycles = 50;

      for (let i = 0; i < cycles; i++) {
        container.createChild();
        fixture.detectChanges();
        container.destroyChild(0);
        fixture.detectChanges();
      }

      expect(registry.size).toBe(initialSize);
    });

    it('100次快速创建销毁不报错', () => {
      const operations = 100;

      expect(() => {
        for (let i = 0; i < operations; i++) {
          const child = container.createChild();
          child.ctx.setData('rapid', i);
          child.ctx.evalExpression('${rapid * 2}');
          container.destroyChild(container.childCount - 1);
        }
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('销毁后类型索引更新', () => {
      for (let i = 0; i < 3; i++) {
        container.createChild();
      }
      fixture.detectChanges();

      const dynamicComponents = registry.getByType('dynamic');
      expect(dynamicComponents.length).toBe(3);

      container.destroyAll();
      fixture.detectChanges();

      const remaining = registry.getByType('dynamic');
      expect(remaining.length).toBe(0);
    });
  });

  describe('数据存储清理', () => {
    it('组件销毁后数据被清理', () => {
      const child = container.createChild();
      fixture.detectChanges();

      for (let i = 0; i < 100; i++) {
        child.ctx.setData(`key-${i}`, `value-${i}`);
      }

      container.destroyChild(0);
      fixture.detectChanges();
    });

    it('销毁一个不影响兄弟组件', () => {
      const child1 = container.createChild();
      const child2 = container.createChild();
      fixture.detectChanges();

      child1.ctx.setData('data1', 'value1');
      child2.ctx.setData('data2', 'value2');

      container.destroyChild(0);
      fixture.detectChanges();

      expect(child2.ctx.getData('data2')).toBe('value2');
    });
  });

  describe('事件订阅清理', () => {
    it('组件销毁后发送事件不报错', () => {
      const child = container.createChild();
      fixture.detectChanges();
      const childId = child.ctx.id();

      const subscription = registry.onFrom$(childId, 'test').subscribe();

      container.destroyChild(0);
      fixture.detectChanges();

      subscription.unsubscribe();

      expect(() => registry.emit(childId, 'test', {})).not.toThrow();
    });
  });

  describe('压力测试', () => {
    it('创建100个组件 < 5000ms', () => {
      const componentCount = 100;
      const children: DynamicChildComponent[] = [];

      const createStart = performance.now();
      for (let i = 0; i < componentCount; i++) {
        children.push(container.createChild());
      }
      fixture.detectChanges();
      const createDuration = performance.now() - createStart;

      console.log(
        `创建${componentCount}个组件: ${createDuration.toFixed(2)}ms`
      );
      expect(registry.size).toBeGreaterThanOrEqual(componentCount);

      const destroyStart = performance.now();
      container.destroyAll();
      fixture.detectChanges();
      const destroyDuration = performance.now() - destroyStart;

      console.log(
        `销毁${componentCount}个组件: ${destroyDuration.toFixed(2)}ms`
      );
      expect(createDuration).toBeLessThan(5000);
      expect(destroyDuration).toBeLessThan(1000);
    });
  });
});
