import { Injectable, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { NzDrawerService, NzDrawerRef, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam, DialogPosition } from '../interfaces/render-param.interface';
import { DialogRef, DialogConfig } from '../interfaces/dialog-ref.interface';
import { DialogCoordinatorService } from '../coordinator/dialog-coordinator.service';

/**
 * 包装后的 Drawer DialogRef
 */
class DrawerDialogRef<T, R> implements DialogRef<T, R> {
    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();

    constructor(
        public readonly id: string,
        public readonly type: 'drawer' = 'drawer',
        public readonly parentId: string | undefined,
        public readonly componentInstance: T,
        public readonly nativeRef: NzDrawerRef<T, R>
    ) {
        // 监听原生事件
        this.nativeRef.afterOpen.subscribe(() => {
            this.afterOpened$.next();
            this.afterOpened$.complete();
        });

        this.nativeRef.afterClose.subscribe((result: R | undefined) => {
            this.afterClosed$.next(result);
            this.afterClosed$.complete();
        });
    }

    close(result?: R): void {
        this.nativeRef.close(result);
    }

    destroy(): void {
        this.nativeRef.close();
    }

    updateConfig(config: Partial<DialogConfig>): void {
        // NzDrawer 不支持动态更新大部分配置
        // 这里只记录日志
        console.debug('[DrawerDialogRef] updateConfig not fully supported:', config);
    }

    afterClosed(): Observable<R | undefined> {
        return this.afterClosed$.asObservable();
    }

    afterOpened(): Observable<void> {
        return this.afterOpened$.asObservable();
    }
}

/**
 * 基础 Drawer 策略
 * 
 * 负责调用 NG-ZORRO 的 NzDrawerService 打开抽屉
 */
@Injectable({ providedIn: 'root' })
export class DrawerStrategy implements IActionStrategy {
    readonly strategyType = 'drawer';

    private readonly drawerService = inject(NzDrawerService);
    private readonly coordinator = inject(DialogCoordinatorService);

    /**
     * 执行打开操作
     */
    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const param = context.param;
        const dialogId = this.coordinator.generateId();

        // 创建 Drawer
        const drawerRef = this.drawerService.create({
            nzContent: param.content as any,
            nzTitle: param.title,
            nzWidth: this.resolveSize(param.width, param.position),
            nzHeight: this.resolveSize(param.height, param.position),
            nzPlacement: this.resolvePosition(param.position),
            nzMask: param.backdrop !== false,
            nzMaskClosable: param.backdrop !== 'static',
            nzClosable: param.closable !== false,
            nzKeyboard: param.keyboard !== false,
            nzContentParams: param.data,
            nzWrapClassName: param.className,
            nzZIndex: param.zIndex
        });

        // 获取组件实例
        const componentInstance = drawerRef.getContentComponent() as T;

        // 创建 DialogRef
        const dialogRef = new DrawerDialogRef<T, R>(
            dialogId,
            'drawer',
            context.parentId,
            componentInstance,
            drawerRef as any
        );

        // 注册到协调器
        this.coordinator.register(dialogRef);

        // 关闭时注销
        dialogRef.afterClosed().subscribe(() => {
            // 关闭子对话框
            this.coordinator.closeChildren(dialogId);
            // 注销自身
            this.coordinator.unregister(dialogId);
            // 调用回调
            param.onClose?.();
        });

        // 打开后回调
        dialogRef.afterOpened().subscribe(() => {
            param.onOpen?.();
        });

        return dialogRef;
    }

    /**
     * 解析位置
     */
    private resolvePosition(position?: DialogPosition): NzDrawerPlacement {
        const mapping: Record<DialogPosition, NzDrawerPlacement> = {
            'left': 'left',
            'right': 'right',
            'top': 'top',
            'bottom': 'bottom'
        };
        return mapping[position || 'right'];
    }

    /**
     * 解析尺寸
     */
    private resolveSize(
        size?: string | number,
        position?: DialogPosition
    ): string | number | undefined {
        if (size) return size;

        // 默认尺寸
        if (position === 'top' || position === 'bottom') {
            return '256px';
        }
        return '400px';
    }
}

