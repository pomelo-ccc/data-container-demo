import { Injectable, inject } from '@angular/core';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { Observable, Subject } from 'rxjs';

/**
 * 虚拟 DialogRef（用于新窗口）
 */
class WindowDialogRef<R = any> implements DialogRef<Window | null, R> {
    readonly type = 'modal' as const;
    readonly nativeRef: Window | null = null;

    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();
    private windowHandle: Window | null = null;
    private checkInterval?: number;

    constructor(
        public readonly id: string,
        public readonly parentId?: string
    ) { }

    get componentInstance(): Window | null {
        return this.windowHandle;
    }

    setWindow(win: Window | null): void {
        this.windowHandle = win;

        if (win) {
            // 通知已打开
            this.afterOpened$.next();
            this.afterOpened$.complete();

            // 监听窗口关闭
            this.checkInterval = window.setInterval(() => {
                if (win.closed) {
                    this.close();
                }
            }, 500);
        }
    }

    close(result?: R): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        if (this.windowHandle && !this.windowHandle.closed) {
            this.windowHandle.close();
        }

        this.afterClosed$.next(result);
        this.afterClosed$.complete();
    }

    destroy(): void {
        this.close();
    }

    updateConfig(): void { }

    afterClosed(): Observable<R | undefined> {
        return this.afterClosed$.asObservable();
    }

    afterOpened(): Observable<void> {
        return this.afterOpened$.asObservable();
    }
}

/**
 * 新窗口/新标签页策略
 * 
 * 在新窗口或新标签页中打开 URL
 * 
 * @example
 * ```typescript
 * {
 *   type: 'openBlank',
 *   data: {
 *     url: '/detail/123',
 *     // 或外部链接
 *     url: 'https://example.com',
 *     target: '_blank',  // 默认
 *     features: 'width=800,height=600'  // 可选
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class OpenBlankStrategy implements IActionStrategy {
    readonly strategyType = 'openBlank';

    private idCounter = 0;

    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const dialogId = `window-${++this.idCounter}-${Date.now()}`;
        const dialogRef = new WindowDialogRef<R>(dialogId, context.parentId);

        const data = context.param.data;
        const url = data?.['url'] || '';
        const target = data?.['target'] || '_blank';
        const features = data?.['features'] || '';

        if (!url) {
            console.error('[OpenBlankStrategy] URL is required');
            dialogRef.close();
            return dialogRef as unknown as DialogRef<T, R>;
        }

        // 打开新窗口
        const windowHandle = window.open(url, target, features);
        dialogRef.setWindow(windowHandle);

        if (!windowHandle) {
            console.warn('[OpenBlankStrategy] Window was blocked by popup blocker');
        }

        // 回调
        context.param.onOpen?.();
        dialogRef.afterClosed().subscribe(() => {
            context.param.onClose?.();
        });

        return dialogRef as unknown as DialogRef<T, R>;
    }
}
