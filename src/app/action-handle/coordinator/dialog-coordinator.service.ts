import { Injectable } from '@angular/core';
import { Subject, Observable, filter } from 'rxjs';
import { DialogRef } from '../interfaces/dialog-ref.interface';
import { DialogEvent, DialogEventType, createRefreshEvent, RefreshEventData } from '../interfaces/dialog-event.interface';

/**
 * 对话框协调器服务
 * 
 * 统一管理所有打开的 Modal/Drawer，提供以下能力：
 * 1. 注册/注销对话框
 * 2. 查询对话框（按 ID、按层级）
 * 3. 父子关联管理
 * 4. 事件广播与订阅
 * 5. 统一关闭管理
 */
@Injectable({ providedIn: 'root' })
export class DialogCoordinatorService {
    /** 对话框注册表 */
    private readonly dialogMap = new Map<string, DialogRef>();

    /** 对话框栈（按打开顺序） */
    private readonly dialogStack: string[] = [];

    /** 事件总线 */
    private readonly eventBus$ = new Subject<DialogEvent>();

    /** ID 计数器 */
    private idCounter = 0;

    /**
     * 生成唯一 ID
     */
    generateId(): string {
        return `dialog-${++this.idCounter}-${Date.now()}`;
    }

    /**
     * 注册对话框
     * @param dialogRef 对话框引用
     */
    register(dialogRef: DialogRef): void {
        this.dialogMap.set(dialogRef.id, dialogRef);
        this.dialogStack.push(dialogRef.id);

        console.debug('[DialogCoordinator] Registered:', dialogRef.id, {
            type: dialogRef.type,
            parentId: dialogRef.parentId
        });
    }

    /**
     * 注销对话框
     * @param id 对话框 ID
     */
    unregister(id: string): void {
        this.dialogMap.delete(id);
        const index = this.dialogStack.indexOf(id);
        if (index !== -1) {
            this.dialogStack.splice(index, 1);
        }

        console.debug('[DialogCoordinator] Unregistered:', id);
    }

    /**
     * 根据 ID 获取对话框
     * @param id 对话框 ID
     */
    getById(id: string): DialogRef | undefined {
        return this.dialogMap.get(id);
    }

    /**
     * 获取当前最顶层对话框
     */
    getTopDialog(): DialogRef | undefined {
        if (this.dialogStack.length === 0) {
            return undefined;
        }
        const topId = this.dialogStack[this.dialogStack.length - 1];
        return this.dialogMap.get(topId);
    }

    /**
     * 获取所有对话框
     */
    getAllDialogs(): DialogRef[] {
        return Array.from(this.dialogMap.values());
    }

    /**
     * 获取对话框数量
     */
    getDialogCount(): number {
        return this.dialogMap.size;
    }

    /**
     * 检查是否有对话框打开
     */
    hasOpenDialogs(): boolean {
        return this.dialogMap.size > 0;
    }

    /**
     * 获取子对话框列表
     * @param parentId 父对话框 ID
     */
    getChildren(parentId: string): DialogRef[] {
        return Array.from(this.dialogMap.values())
            .filter(dialog => dialog.parentId === parentId);
    }

    /**
     * 关闭指定对话框
     * @param id 对话框 ID
     * @param result 关闭结果
     */
    close(id: string, result?: any): void {
        const dialog = this.dialogMap.get(id);
        if (dialog) {
            dialog.close(result);
        }
    }

    /**
     * 关闭所有子对话框
     * @param parentId 父对话框 ID
     */
    closeChildren(parentId: string): void {
        const children = this.getChildren(parentId);
        children.forEach(child => {
            // 递归关闭子对话框的子对话框
            this.closeChildren(child.id);
            child.close();
        });
    }

    /**
     * 关闭所有对话框
     */
    closeAll(): void {
        // 从栈顶开始关闭
        const ids = [...this.dialogStack].reverse();
        ids.forEach(id => {
            const dialog = this.dialogMap.get(id);
            dialog?.close();
        });
    }

    /**
     * 发送事件
     * @param event 对话框事件
     */
    emit(event: DialogEvent): void {
        this.eventBus$.next(event);
    }

    /**
     * 通知刷新
     * @param targetId 目标对话框 ID（'*' 表示广播）
     * @param data 刷新数据
     * @param sourceId 来源对话框 ID
     */
    notifyRefresh(targetId: string, data: RefreshEventData, sourceId?: string): void {
        this.emit(createRefreshEvent(targetId, data, sourceId));
    }

    /**
     * 广播刷新事件
     * @param data 刷新数据
     * @param sourceId 来源对话框 ID
     */
    broadcastRefresh(data: RefreshEventData, sourceId?: string): void {
        this.notifyRefresh('*', data, sourceId);
    }

    /**
     * 监听目标对话框的事件
     * @param targetId 目标对话框 ID
     */
    on(targetId: string): Observable<DialogEvent> {
        return this.eventBus$.pipe(
            filter(event => event.targetId === '*' || event.targetId === targetId)
        );
    }

    /**
     * 监听特定类型的事件
     * @param targetId 目标对话框 ID
     * @param eventType 事件类型
     */
    onType<T = unknown>(targetId: string, eventType: DialogEventType): Observable<DialogEvent<T>> {
        return this.eventBus$.pipe(
            filter(event =>
                (event.targetId === '*' || event.targetId === targetId) &&
                event.type === eventType
            )
        ) as Observable<DialogEvent<T>>;
    }

    /**
     * 监听所有事件
     */
    onAll(): Observable<DialogEvent> {
        return this.eventBus$.asObservable();
    }
}
