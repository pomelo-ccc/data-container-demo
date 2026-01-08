import { Injectable, inject, Type } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { NzModalService, NzModalRef } from 'ng-zorro-antd/modal';
import { IActionStrategy, ActionContext } from '../interfaces/strategy.interface';
import { RenderParam } from '../interfaces/render-param.interface';
import { DialogRef, DialogConfig } from '../interfaces/dialog-ref.interface';
import { DialogCoordinatorService } from '../coordinator/dialog-coordinator.service';

/**
 * 包装后的 Modal DialogRef
 */
class ModalDialogRef<T, R> implements DialogRef<T, R> {
    private readonly afterClosed$ = new Subject<R | undefined>();
    private readonly afterOpened$ = new Subject<void>();

    constructor(
        public readonly id: string,
        public readonly type: 'modal' = 'modal',
        public readonly parentId: string | undefined,
        public readonly componentInstance: T,
        public readonly nativeRef: NzModalRef
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
        this.nativeRef.destroy();
    }

    updateConfig(config: Partial<DialogConfig>): void {
        if (config.title) {
            this.nativeRef.updateConfig({ nzTitle: config.title });
        }
        if (config.width) {
            this.nativeRef.updateConfig({ nzWidth: config.width });
        }
        if (config.className) {
            this.nativeRef.updateConfig({ nzClassName: config.className });
        }
        if (config.closable !== undefined) {
            this.nativeRef.updateConfig({ nzClosable: config.closable });
        }
    }

    afterClosed(): Observable<R | undefined> {
        return this.afterClosed$.asObservable();
    }

    afterOpened(): Observable<void> {
        return this.afterOpened$.asObservable();
    }
}

/**
 * 基础 Modal 策略
 * 
 * 负责调用 NG-ZORRO 的 NzModalService 打开弹窗
 */
@Injectable({ providedIn: 'root' })
export class ModalStrategy implements IActionStrategy {
    readonly strategyType = 'modal';

    private readonly modalService = inject(NzModalService);
    private readonly coordinator = inject(DialogCoordinatorService);

    /**
     * 执行打开操作
     */
    execute<T, R>(context: ActionContext<T>): DialogRef<T, R> {
        const param = context.param;
        const dialogId = this.coordinator.generateId();

        // 创建 Modal
        const modalRef = this.modalService.create({
            nzContent: param.content as any,
            nzTitle: param.title,
            nzWidth: param.width || '520px',
            nzClassName: param.className,
            nzZIndex: param.zIndex,
            nzMask: param.backdrop !== false,
            nzMaskClosable: param.backdrop !== 'static',
            nzClosable: param.closable !== false,
            nzKeyboard: param.keyboard !== false,
            nzData: param.data as any,
            nzFooter: this.resolveFooter(param.footer),
            nzCentered: true
        });

        // 获取组件实例
        const componentInstance = modalRef.getContentComponent() as T;

        // 创建 DialogRef
        const dialogRef = new ModalDialogRef<T, R>(
            dialogId,
            'modal',
            context.parentId,
            componentInstance,
            modalRef as any
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
     * 解析 Footer 配置
     */
    private resolveFooter(footer?: 'default' | 'none' | Type<any>): any {
        if (footer === 'none') {
            return null;
        }
        if (footer && typeof footer !== 'string') {
            return footer; // 自定义组件
        }
        return undefined; // 使用默认 footer
    }
}
