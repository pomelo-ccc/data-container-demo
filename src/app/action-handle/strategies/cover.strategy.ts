import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { Observable, Subject } from 'rxjs';

/**
 * 虚拟 DialogRef（用于路由覆盖）
 */
class CoverDialogRef<R = any> implements DialogRef<void, R> {
    readonly type = 'modal' as const;
    readonly componentInstance = undefined as any;
    readonly nativeRef = null;

    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();

    constructor(
        public readonly id: string,
        public readonly parentId?: string,
        private readonly previousUrl?: string,
        private readonly router?: Router
    ) { }

    close(result?: R): void {
        // 如果有之前的 URL，可以导航回去
        if (this.previousUrl && this.router) {
            this.router.navigateByUrl(this.previousUrl);
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

    notifyOpened(): void {
        this.afterOpened$.next();
        this.afterOpened$.complete();
    }
}

/**
 * 覆盖策略
 * 
 * 通过路由导航覆盖当前页面（同页跳转）
 * 
 * @example
 * ```typescript
 * {
 *   type: 'cover',
 *   data: {
 *     url: '/detail/123',
 *     // 或使用路由命令
 *     commands: ['detail', '123'],
 *     queryParams: { tab: 'info' },
 *     // 是否保存返回路径
 *     saveBackUrl: true
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CoverStrategy implements IActionStrategy {
    readonly strategyType = 'cover';

    private readonly router = inject(Router);
    private idCounter = 0;

    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const dialogId = `cover-${++this.idCounter}-${Date.now()}`;
        const data = context.param.data;

        // 保存当前 URL 以便返回
        const previousUrl = data?.['saveBackUrl'] !== false ? this.router.url : undefined;
        const dialogRef = new CoverDialogRef<R>(dialogId, context.parentId, previousUrl, this.router);

        // 执行导航
        let navigationPromise: Promise<boolean>;

        if (data?.['url']) {
            // 使用 URL 字符串导航
            navigationPromise = this.router.navigateByUrl(data['url']);
        } else if (data?.['commands'] && Array.isArray(data['commands'])) {
            // 使用路由命令导航
            navigationPromise = this.router.navigate(data['commands'], {
                queryParams: data['queryParams'],
                fragment: data['fragment'],
                state: data['state']
            });
        } else {
            console.error('[CoverStrategy] URL or commands is required');
            dialogRef.close();
            return dialogRef as unknown as DialogRef<T, R>;
        }

        navigationPromise
            .then(success => {
                if (success) {
                    dialogRef.notifyOpened();
                    context.param.onOpen?.();
                } else {
                    console.warn('[CoverStrategy] Navigation cancelled');
                    dialogRef.close();
                }
            })
            .catch(error => {
                console.error('[CoverStrategy] Navigation error:', error);
                dialogRef.close();
            });

        return dialogRef as unknown as DialogRef<T, R>;
    }
}
