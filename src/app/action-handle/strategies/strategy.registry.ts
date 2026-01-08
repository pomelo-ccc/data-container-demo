import { InjectionToken, Provider, Type } from '@angular/core';
import { IActionStrategy } from '../interfaces/strategy.interface';

/**
 * 策略注册条目
 */
export interface ActionStrategyEntry {
    /** 策略类型标识（如 'modal', 'drawer', 'event' 等） */
    type: string;

    /** 策略类（用于 DI 注入） */
    strategy: Type<IActionStrategy>;
}

/**
 * 策略注册 Token
 * 
 * 用于通过 DI 注入可扩展的策略列表
 * 
 * @example
 * ```typescript
 * // 在 providers 中注册新策略
 * providers: [
 *   MyCustomStrategy,
 *   { 
 *     provide: ACTION_STRATEGY_REGISTRY, 
 *     useValue: { type: 'custom', strategy: MyCustomStrategy },
 *     multi: true 
 *   }
 * ]
 * ```
 */
export const ACTION_STRATEGY_REGISTRY = new InjectionToken<ActionStrategyEntry[]>(
    'ActionStrategyRegistry',
    {
        providedIn: 'root',
        factory: () => []
    }
);

/**
 * 创建策略注册 Provider
 * 
 * @param entries 策略条目列表
 */
export function provideActionStrategies(entries: ActionStrategyEntry[]): Provider[] {
    const providers: Provider[] = [];

    entries.forEach(entry => {
        // 注册策略实例
        providers.push(entry.strategy);
        // 注册到 registry
        providers.push({
            provide: ACTION_STRATEGY_REGISTRY,
            useValue: entry,
            multi: true
        });
    });

    return providers;
}
