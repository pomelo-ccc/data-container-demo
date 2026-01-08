import { RenderParam } from './render-param.interface';
import { DialogRef } from './dialog-ref.interface';
import { Observable } from 'rxjs';
import { ComponentContext } from '../../context';

/**
 * Action 策略上下文
 */
export interface ActionContext<T = any> {
    /** 渲染参数 */
    param: RenderParam<T>;

    /** 组件上下文（触发 action 的组件） */
    ctx?: ComponentContext;

    /** 父对话框 ID（如果有） */
    parentId?: string;

    /** 额外数据 */
    extra?: Record<string, any>;
}

/**
 * Action 执行结果类型
 * 
 * - DialogRef: Modal/Drawer 等 UI 策略返回
 * - Observable: 异步流（如外部请求）
 * - Promise: 异步结果
 * - void: 无返回值
 * - 其他: 同步返回值（字符串、对象等）
 */
export type ActionResult<R = any> =
    | DialogRef<any, R>      // UI 策略
    | Observable<R>          // 流
    | Promise<R>             // Promise
    | void                   // 无返回值
    | R;                     // 直接返回值

/**
 * Action 策略接口
 * 
 * TResult 类型由具体策略决定：
 * - UI 策略 (modal/drawer): 返回 DialogRef
 * - 事件策略: 返回执行结果或 Promise
 * - 外部请求策略: 返回 Observable 或 Promise
 */
export interface IActionStrategy<TResult = ActionResult> {
    /** 策略类型标识 */
    readonly strategyType: string;

    /**
     * 执行操作
     * @param context Action 上下文
     * @returns 执行结果（类型由策略决定）
     */
    execute<T>(context: ActionContext<T>): TResult;
}

/**
 * UI 策略接口（Modal/Drawer）
 * 
 * 明确返回 DialogRef
 */
export interface IDialogStrategy extends IActionStrategy<DialogRef> {
    execute<T, R>(context: ActionContext<T>): DialogRef<T, R>;
}

/**
 * 预设策略接口
 * 
 * 继承基础策略，提供预定义的配置
 */
export interface IPresetStrategy extends IDialogStrategy {
    /** 预设类型标识 */
    readonly presetType: string;

    /**
     * 获取预设配置
     * @returns 预设的渲染参数
     */
    getPresetConfig(): Partial<RenderParam>;
}

/**
 * 判断是否为预设策略
 */
export function isPresetStrategy(strategy: IActionStrategy): strategy is IPresetStrategy {
    return 'presetType' in strategy && 'getPresetConfig' in strategy;
}

/**
 * 判断是否为 UI 策略
 */
export function isDialogStrategy(strategy: IActionStrategy): strategy is IDialogStrategy {
    const type = strategy.strategyType;
    return type === 'modal' || type === 'drawer';
}

/**
 * 判断结果是否为 DialogRef
 */
export function isDialogRef<R>(result: ActionResult<R>): result is DialogRef<any, R> {
    return result !== null &&
        typeof result === 'object' &&
        'close' in result &&
        'afterClosed' in result;
}

/**
 * 策略注册条目
 */
export interface StrategyRegistryEntry {
    /** 策略类型 */
    type: string;

    /** 策略实例 */
    strategy: IActionStrategy;
}

/**
 * 预设注册条目
 */
export interface PresetRegistryEntry {
    /** 预设类型 */
    type: string;

    /** 预设策略实例 */
    preset: IPresetStrategy;
}
