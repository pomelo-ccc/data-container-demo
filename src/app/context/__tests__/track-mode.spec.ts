/**
 * 追踪模式准确性测试
 */
import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ComponentContext, ContextHost } from '../index';

// 父组件
@Component({
  selector: 'track-parent',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
})
class TrackParentComponent extends ContextHost {
  protected override contextType = 'parent';
  protected override contextId = 'track-parent';
}

// 子组件 - Auto 模式
@Component({
  selector: 'track-child-auto',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TrackChildAutoComponent extends ContextHost {
  protected override contextType = 'child';
  protected override contextId = 'child-auto';
  updateCount = 0;

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setTrackConfig({ mode: 'auto' });
  }
}

// 子组件 - None 模式
@Component({
  selector: 'track-child-none',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TrackChildNoneComponent extends ContextHost {
  protected override contextType = 'child';
  protected override contextId = 'child-none';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setTrackConfig({ mode: 'none' });
  }
}

// 子组件 - Explicit 模式
@Component({
  selector: 'track-child-explicit',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class TrackChildExplicitComponent extends ContextHost {
  protected override contextType = 'child';
  protected override contextId = 'child-explicit';

  override ngOnInit(): void {
    super.ngOnInit();
    this.ctx.setTrackConfig({
      mode: 'explicit',
      trackExpression: '${trackedVar}',
    });
  }
}

// Auto 模式测试容器
@Component({
  standalone: true,
  imports: [TrackParentComponent, TrackChildAutoComponent],
  template: `
    <track-parent>
      <track-child-auto></track-child-auto>
    </track-parent>
  `,
})
class AutoModeContainer {
  @ViewChild(TrackParentComponent) parent!: TrackParentComponent;
  @ViewChild(TrackChildAutoComponent) child!: TrackChildAutoComponent;
}

// None 模式测试容器
@Component({
  standalone: true,
  imports: [TrackParentComponent, TrackChildNoneComponent],
  template: `
    <track-parent>
      <track-child-none></track-child-none>
    </track-parent>
  `,
})
class NoneModeContainer {
  @ViewChild(TrackParentComponent) parent!: TrackParentComponent;
  @ViewChild(TrackChildNoneComponent) child!: TrackChildNoneComponent;
}

// Explicit 模式测试容器
@Component({
  standalone: true,
  imports: [TrackParentComponent, TrackChildExplicitComponent],
  template: `
    <track-parent>
      <track-child-explicit></track-child-explicit>
    </track-parent>
  `,
})
class ExplicitModeContainer {
  @ViewChild(TrackParentComponent) parent!: TrackParentComponent;
  @ViewChild(TrackChildExplicitComponent) child!: TrackChildExplicitComponent;
}

describe('追踪模式准确性', () => {
  describe('Auto模式 - 自动追踪父数据变化', () => {
    let container: AutoModeContainer;
    let parentCtx: ComponentContext;
    let childCtx: ComponentContext;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [AutoModeContainer],
      });
      const fixture = TestBed.createComponent(AutoModeContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
      parentCtx = container.parent.ctx;
      childCtx = container.child.ctx;
    });

    it('默认模式为auto', () => {
      const config = childCtx.getTrackConfig();
      expect(config.mode).toBe('auto');
    });

    it('自动追踪父数据变化', () => {
      parentCtx.setData('value', 'initial');
      expect(childCtx.evalExpression('${value}')).toBe('initial');

      parentCtx.setData('value', 'updated');
      expect(childCtx.evalExpression('${value}')).toBe('updated');
    });

    it('追踪所有父变量', () => {
      parentCtx.setAllData({ a: 1, b: 2, c: 3 });
      expect(childCtx.evalExpression('${a}')).toBe(1);
      expect(childCtx.evalExpression('${b}')).toBe(2);
      expect(childCtx.evalExpression('${c}')).toBe(3);

      parentCtx.setData('a', 10);
      parentCtx.setData('b', 20);
      expect(childCtx.evalExpression('${a}')).toBe(10);
      expect(childCtx.evalExpression('${b}')).toBe(20);
    });

    it('Signal响应父数据变化', () => {
      parentCtx.setData('count', 0);
      const signal = childCtx.createExpressionSignal<number>('${count}');

      expect(signal()).toBe(0);
      parentCtx.setData('count', 5);
      expect(signal()).toBe(5);
    });
  });

  describe('None模式 - 不追踪父数据变化', () => {
    let container: NoneModeContainer;
    let parentCtx: ComponentContext;
    let childCtx: ComponentContext;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [NoneModeContainer],
      });
      const fixture = TestBed.createComponent(NoneModeContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
      parentCtx = container.parent.ctx;
      childCtx = container.child.ctx;
    });

    it('模式配置为none', () => {
      const config = childCtx.getTrackConfig();
      expect(config.mode).toBe('none');
    });

    it('本地数据正常读写', () => {
      childCtx.setData('localValue', 'local');
      expect(childCtx.evalExpression('${localValue}')).toBe('local');

      childCtx.setData('localValue', 'updated');
      expect(childCtx.evalExpression('${localValue}')).toBe('updated');
    });

    it('仍可访问父数据', () => {
      parentCtx.setData('value', 'initial');
      expect(childCtx.evalExpression('${value}')).toBe('initial');
    });
  });

  describe('Explicit模式 - 只追踪指定变量', () => {
    let container: ExplicitModeContainer;
    let parentCtx: ComponentContext;
    let childCtx: ComponentContext;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [ExplicitModeContainer],
      });
      const fixture = TestBed.createComponent(ExplicitModeContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
      parentCtx = container.parent.ctx;
      childCtx = container.child.ctx;
    });

    it('模式配置为explicit', () => {
      const config = childCtx.getTrackConfig();
      expect(config.mode).toBe('explicit');
      expect(config.trackExpression).toBe('${trackedVar}');
    });

    it('追踪指定变量', () => {
      parentCtx.setData('trackedVar', 'tracked');
      expect(childCtx.evalExpression('${trackedVar}')).toBe('tracked');

      parentCtx.setData('trackedVar', 'updated');
      expect(childCtx.evalExpression('${trackedVar}')).toBe('updated');
    });

    it('未指定变量不响应式追踪', () => {
      parentCtx.setAllData({
        trackedVar: 'tracked',
        untrackedVar: 'untracked',
      });
      const trackedValue = childCtx.evalExpression('${trackedVar}');
      expect(trackedValue).toBe('tracked');
    });

    it('运行时修改追踪表达式', () => {
      parentCtx.setAllData({ a: 1, b: 2 });

      childCtx.setTrackConfig({
        mode: 'explicit',
        trackExpression: '${a},${b}',
      });

      expect(childCtx.evalExpression('${a}')).toBe(1);
      expect(childCtx.evalExpression('${b}')).toBe(2);
    });
  });

  describe('模式切换', () => {
    let container: AutoModeContainer;
    let parentCtx: ComponentContext;
    let childCtx: ComponentContext;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [AutoModeContainer],
      });
      const fixture = TestBed.createComponent(AutoModeContainer);
      fixture.detectChanges();
      container = fixture.componentInstance;
      parentCtx = container.parent.ctx;
      childCtx = container.child.ctx;
    });

    it('从auto切换到none', () => {
      parentCtx.setData('value', 'initial');
      expect(childCtx.evalExpression('${value}')).toBe('initial');

      childCtx.setTrackConfig({ mode: 'none' });
      expect(childCtx.getTrackConfig().mode).toBe('none');
    });

    it('从none切换回auto', () => {
      childCtx.setTrackConfig({ mode: 'none' });
      parentCtx.setData('value', 'v1');

      childCtx.setTrackConfig({ mode: 'auto' });
      parentCtx.setData('value', 'v2');
      expect(childCtx.evalExpression('${value}')).toBe('v2');
    });
  });
});
