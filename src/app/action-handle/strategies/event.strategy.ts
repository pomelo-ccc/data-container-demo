import { Injectable, inject } from '@angular/core';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { Observable, Subject, of } from 'rxjs';

/**
 * 虚拟 DialogRef（用于非 UI 策略）
 */
class VirtualDialogRef<R = any> implements DialogRef<void, R> {
    readonly type = 'modal' as const;
    readonly componentInstance = undefined as any;
    readonly nativeRef = null;

    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();
    private _result?: R;

    constructor(
        public readonly id: string,
        public readonly parentId?: string
    ) {
        // 立即触发 afterOpened
        setTimeout(() => {
            this.afterOpened$.next();
            this.afterOpened$.complete();
        }, 0);
    }

    close(result?: R): void {
        this._result = result;
        this.afterClosed$.next(result);
        this.afterClosed$.complete();
    }

    destroy(): void {
        this.close();
    }

    updateConfig(): void {
        // 虚拟对话框不支持更新
    }

    afterClosed(): Observable<R | undefined> {
        return this.afterClosed$.asObservable();
    }

    afterOpened(): Observable<void> {
        return this.afterOpened$.asObservable();
    }
}

/**
 * 事件策略
 * 
 * 执行内部脚本或事件处理函数
 * 
 * @example
 * ```typescript
 * // RenderParam 中配置
 * {
 *   type: 'event',
 *   data: {
 *     script: 'console.log("执行脚本")',
 *     // 或者
 *     handler: (context) => { ... }
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class EventStrategy implements IActionStrategy {
    readonly strategyType = 'event';

    private idCounter = 0;

    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const dialogId = `event-${++this.idCounter}-${Date.now()}`;
        const dialogRef = new VirtualDialogRef<R>(dialogId, context.parentId);

        const data = context.param.data;

        try {
            if (data?.['handler'] && typeof data['handler'] === 'function') {
                // 执行处理函数
                const result = data['handler'](context);

                // 如果返回 Promise，等待完成
                if (result instanceof Promise) {
                    result
                        .then(r => dialogRef.close(r as R))
                        .catch(err => {
                            console.error('[EventStrategy] Handler error:', err);
                            dialogRef.close();
                        });
                } else {
                    dialogRef.close(result as R);
                }
            } else if (data?.['script'] && typeof data['script'] === 'string') {
                // 执行脚本字符串
                // 注意：eval 有安全风险，生产环境需谨慎使用
                const result = new Function('context', data['script'])(context);
                dialogRef.close(result as R);
            } else {
                console.warn('[EventStrategy] No handler or script provided');
                dialogRef.close();
            }
        } catch (error) {
            console.error('[EventStrategy] Execution error:', error);
            dialogRef.close();
        }

        // 调用回调
        context.param.onOpen?.();
        dialogRef.afterClosed().subscribe(() => {
            context.param.onClose?.();
        });

        return dialogRef as unknown as DialogRef<T, R>;
    }
}
