import { Injectable } from '@angular/core';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { Observable, Subject } from 'rxjs';

/**
 * 虚拟 DialogRef（用于外部链接）
 */
class ExternalDialogRef<R = any> implements DialogRef<void, R> {
    readonly type = 'modal' as const;
    readonly componentInstance = undefined as any;
    readonly nativeRef = null;

    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();

    constructor(
        public readonly id: string,
        public readonly parentId?: string
    ) { }

    close(result?: R): void {
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

    notifyOpened(): void {
        this.afterOpened$.next();
        this.afterOpened$.complete();
    }
}

/**
 * 外部策略
 * 
 * 调用外部脚本或第三方服务
 * 
 * @example
 * ```typescript
 * {
 *   type: 'external',
 *   data: {
 *     url: 'https://api.example.com/action',
 *     method: 'POST',
 *     body: { ... }
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class ExternalStrategy implements IActionStrategy {
    readonly strategyType = 'external';

    private idCounter = 0;

    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const dialogId = `external-${++this.idCounter}-${Date.now()}`;
        const dialogRef = new ExternalDialogRef<R>(dialogId, context.parentId);

        const data = context.param.data;

        if (!data?.['url']) {
            console.error('[ExternalStrategy] URL is required');
            dialogRef.close();
            return dialogRef as unknown as DialogRef<T, R>;
        }

        const url = data['url'];
        const method = data['method'] || 'GET';
        const body = data['body'];
        const headers = data['headers'] || {};

        // 发起请求
        const fetchOptions: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body && method !== 'GET') {
            fetchOptions.body = JSON.stringify(body);
        }

        fetch(url, fetchOptions)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(result => {
                dialogRef.notifyOpened();
                dialogRef.close(result as R);
                context.param.onClose?.(result);
            })
            .catch(error => {
                console.error('[ExternalStrategy] Request error:', error);
                dialogRef.notifyOpened();
                dialogRef.close();
                context.param.onClose?.();
            });

        context.param.onOpen?.();

        return dialogRef as unknown as DialogRef<T, R>;
    }
}
