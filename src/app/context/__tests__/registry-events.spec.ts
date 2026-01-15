/**
 * 组件注册表和事件通信测试
 */
import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { ComponentContext, ContextHost, ComponentRegistry } from '../index';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

// 发送者组件
@Component({
  selector: 'event-sender',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class EventSenderComponent extends ContextHost {
  protected override contextType = 'sender';
  protected override contextId = 'sender-1';
}

// 接收者组件
@Component({
  selector: 'event-receiver',
  standalone: true,
  providers: [ComponentContext],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
class EventReceiverComponent extends ContextHost {
  protected override contextType = 'receiver';
  protected override contextId = 'receiver-1';

  receivedEvents: any[] = [];
  private subscription?: Subscription;

  override ngOnInit(): void {
    super.ngOnInit();
    const registry = TestBed.inject(ComponentRegistry);
    this.subscription = registry.onFrom$(this.ctx.id()).subscribe((event) => {
      this.receivedEvents.push(event);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

// 测试容器
@Component({
  standalone: true,
  imports: [EventSenderComponent, EventReceiverComponent],
  template: `
    <event-sender></event-sender>
    <event-receiver></event-receiver>
  `,
})
class EventTestContainer {
  @ViewChild(EventSenderComponent) sender!: EventSenderComponent;
  @ViewChild(EventReceiverComponent) receiver!: EventReceiverComponent;
}

describe('注册表和事件通信', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EventTestContainer],
    });
    registry = TestBed.inject(ComponentRegistry);
  });

  describe('组件注册', () => {
    it('注册正确ID', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      expect(registry.has('sender-1')).toBe(true);
      expect(registry.has('receiver-1')).toBe(true);
    });

    it('按ID获取组件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      const sender = registry.get('sender-1');
      expect(sender).toBeDefined();
      expect(sender?.type()).toBe('sender');
    });

    it('按类型获取组件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      const senders = registry.getByType('sender');
      expect(senders.length).toBe(1);
      expect(senders[0].id()).toBe('sender-1');
    });

    it('获取所有组件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(2);
    });

    it('获取所有ID', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      const ids = registry.getAllIds();
      expect(ids).toContain('sender-1');
      expect(ids).toContain('receiver-1');
    });

    it('获取正确数量', () => {
      const initialSize = registry.size;
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      expect(registry.size).toBe(initialSize + 2);
    });

    it('销毁时注销', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      expect(registry.has('sender-1')).toBe(true);

      fixture.destroy();

      expect(registry.has('sender-1')).toBe(false);
      expect(registry.has('receiver-1')).toBe(false);
    });
  });

  describe('事件通信', () => {
    it('发送事件到指定组件', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      registry
        .onFrom$('receiver-1', 'test-event')
        .pipe(take(1))
        .subscribe((event) => {
          expect(event.event).toBe('test-event');
          expect(event.data).toEqual({ message: 'hello' });
          done();
        });

      registry.emit('receiver-1', 'test-event', { message: 'hello' });
    });

    it('广播事件到所有组件', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      registry.events$.pipe(take(1)).subscribe((event) => {
        expect(event.event).toBe('broadcast-event');
        done();
      });

      registry.broadcast('broadcast-event', { global: true });
    });

    it('按事件名过滤', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      registry
        .on$('specific-event')
        .pipe(take(1))
        .subscribe((event) => {
          expect(event.event).toBe('specific-event');
          done();
        });

      registry.emit('receiver-1', 'other-event', {});
      registry.emit('receiver-1', 'specific-event', {});
    });

    it('事件包含时间戳', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      const before = Date.now();

      registry.events$.pipe(take(1)).subscribe((event) => {
        expect(event.timestamp).toBeGreaterThanOrEqual(before);
        expect(event.timestamp).toBeLessThanOrEqual(Date.now());
        done();
      });

      registry.emit('receiver-1', 'timed-event', {});
    });

    it('通过ctx发送事件', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();
      const container = fixture.componentInstance;

      registry
        .onFrom$('receiver-1', 'ctx-event')
        .pipe(take(1))
        .subscribe((event) => {
          expect(event.data).toBe('from-sender');
          done();
        });

      container.sender.ctx.emit('receiver-1', 'ctx-event', 'from-sender');
    });
  });

  describe('跨组件查询', () => {
    it('通过ctx查询组件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();
      const container = fixture.componentInstance;

      const receiver = container.sender.ctx.getComponent('receiver-1');
      expect(receiver).toBeDefined();
      expect(receiver?.type()).toBe('receiver');
    });

    it('按类型查询组件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();
      const container = fixture.componentInstance;

      const receivers = container.sender.ctx.getComponentsByType('receiver');
      expect(receivers.length).toBe(1);
    });

    it('查询不存在的组件返回undefined', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();
      const container = fixture.componentInstance;

      const notFound = container.sender.ctx.getComponent('not-exist');
      expect(notFound).toBeUndefined();
    });
  });

  describe('订阅管理', () => {
    it('多订阅者都能收到事件', (done) => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      let count = 0;
      const checkDone = () => {
        count++;
        if (count === 2) done();
      };

      registry.on$('multi-event').pipe(take(1)).subscribe(checkDone);
      registry.on$('multi-event').pipe(take(1)).subscribe(checkDone);

      registry.emit('any', 'multi-event', {});
    });

    it('取消订阅后不再收到事件', () => {
      const fixture = TestBed.createComponent(EventTestContainer);
      fixture.detectChanges();

      let received = false;
      const sub = registry.on$('unsub-test').subscribe(() => {
        received = true;
      });

      sub.unsubscribe();
      registry.emit('any', 'unsub-test', {});

      expect(received).toBe(false);
    });
  });
});
