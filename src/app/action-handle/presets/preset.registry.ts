import { Injectable, Inject, Optional } from '@angular/core';
import { IPresetStrategy } from '../interfaces/strategy.interface';
import { InjectionToken } from '@angular/core';

/**
 * 预设注册 Token
 */
export const PRESET_REGISTRY = new InjectionToken<IPresetStrategy[]>('PRESET_REGISTRY');

/**
 * 预设注册表服务
 * 
 * 管理所有预设策略的注册和获取
 */
@Injectable({ providedIn: 'root' })
export class PresetRegistryService {
    /** 预设映射表 */
    private readonly presetMap = new Map<string, IPresetStrategy>();

    constructor(
        @Optional() @Inject(PRESET_REGISTRY) presets: IPresetStrategy[][] | null
    ) {
        // 注册通过 DI 提供的预设
        if (presets) {
            const flatPresets = presets.flat();
            flatPresets.forEach(preset => {
                if (preset && preset.presetType) {
                    this.register(preset);
                }
            });
        }

        console.debug('[PresetRegistry] Initialized with presets:', this.getPresetTypes());
    }

    /**
     * 注册预设
     * @param preset 预设策略
     */
    register(preset: IPresetStrategy): void {
        if (this.presetMap.has(preset.presetType)) {
            console.warn(`[PresetRegistry] Overwriting preset: ${preset.presetType}`);
        }
        this.presetMap.set(preset.presetType, preset);
    }

    /**
     * 获取预设
     * @param type 预设类型
     */
    get(type: string): IPresetStrategy | undefined {
        return this.presetMap.get(type);
    }

    /**
     * 检查是否存在
     * @param type 预设类型
     */
    has(type: string): boolean {
        return this.presetMap.has(type);
    }

    /**
     * 获取所有预设类型
     */
    getPresetTypes(): string[] {
        return Array.from(this.presetMap.keys());
    }

    /**
     * 获取所有预设
     */
    getAll(): IPresetStrategy[] {
        return Array.from(this.presetMap.values());
    }
}
