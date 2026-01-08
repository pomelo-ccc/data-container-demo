import { inject, Directive, Input, OnInit } from '@angular/core';
import { ComponentContext } from './component-context.service';

/**
 * 组件基类
 *
 * 继承此类即可自动获得 Context 功能，无需额外代码
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [ComponentContext]
 * })
 * export class MyComponent extends ContextAware {
 *   override contextType = 'form';  // 设置类型
 *
 *   doSomething() {
 *     // 访问父级
 *     const parent = this.ctx.getParent();
 *
 *     // 跨组件访问
 *     const table = this.ctx.getComponent('table-1');
 *   }
 * }
 * ```
 */
@Directive()
export abstract class ContextAware implements OnInit {
    /** 组件上下文 */
    protected readonly ctx = inject(ComponentContext);

    /** 组件类型（子类可覆盖） */
    protected contextType = 'component';

    /** 组件ID（子类可覆盖，默认自动生成） */
    protected contextId?: string;

    ngOnInit(): void {
        this.initContext();
    }

    /**
     * 初始化上下文（子类可覆盖以自定义）
     */
    protected initContext(): void {
        this.ctx.init({
            id: this.contextId ?? this.ctx.id(),
            type: this.contextType,
            instance: this
        });
    }
}
