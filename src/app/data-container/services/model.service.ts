import { Injectable, inject } from '@angular/core';
import { Observable, of, delay, map, catchError } from 'rxjs';
import {
    WidgetModel,
    RuntimeSchema,
    ModelRegistryItem,
    TransformOptions,
    ValidationResult,
    ValidationError,
    ValidationWarning
} from '../models/schema.interface';
import { MOCK_MODELS } from '../mock/mock-data';

/**
 * 模型服务 - 负责获取、转换和验证模型配置
 * 
 * 职责:
 * 1. 通过 name 查询模型
 * 2. 转换模型为运行时 Schema
 * 3. 验证模型配置
 * 4. 合并参数覆盖
 */
@Injectable({
    providedIn: 'root'
})
export class ModelService {
    /** 模型注册表缓存 */
    private modelRegistry = new Map<string, ModelRegistryItem>();

    constructor() {
        // 初始化 Mock 模型
        this.initMockModels();
    }

    /**
     * 初始化 Mock 模型
     */
    private initMockModels(): void {
        if (Array.isArray(MOCK_MODELS)) {
            MOCK_MODELS.forEach(model => {
                if (model.id) {
                    this.registerModel(model.id, model);
                }
            });
        } else {
            Object.entries(MOCK_MODELS).forEach(([name, model]) => {
                this.registerModel(name, (model as WidgetModel));
            });
        }
    }

    /**
     * 注册模型
     */
    registerModel(name: string, model: WidgetModel, description?: string): void {
        this.modelRegistry.set(name, {
            name,
            model,
            description,
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    /**
     * 通过名称获取模型
     * @param name 模型名称
     * @returns 模型定义的 Observable
     */
    getModelByName(name: string): Observable<WidgetModel | null> {
        // 从缓存获取
        const registryItem = this.modelRegistry.get(name);
        if (registryItem) {
            return of(registryItem.model).pipe(delay(50)); // 模拟网络延迟
        }

        // 模拟从远程 API 获取
        return this.fetchModelFromApi(name);
    }

    /**
     * 从 API 获取模型 (模拟)
     */
    private fetchModelFromApi(name: string): Observable<WidgetModel | null> {
        // 这里可以替换为真实的 API 调用
        // return this.http.get<WidgetModel>(`/api/models/${name}`);

        console.warn(`Model not found in registry: ${name}`);
        return of(null).pipe(delay(100));
    }

    /**
     * 转换模型为运行时 Schema
     * @param model 原始模型
     * @param options 转换选项
     * @returns 运行时 Schema
     */
    transformToRuntimeSchema(
        model: WidgetModel,
        modelName: string,
        options: TransformOptions = {}
    ): RuntimeSchema {
        const runtimeSchema: RuntimeSchema = {
            ...model,
            _modelName: modelName,
            _visible: true,
            _disabled: false,
            _loading: false,
            _error: null
        };

        // 递归处理子组件
        if (options.recursive !== false && model.children?.length) {
            runtimeSchema.children = model.children.map((child, index) =>
                this.transformToRuntimeSchema(child, `${modelName}.children[${index}]`, options)
            );
        }

        // 应用自定义转换器
        if (options.customTransformers) {
            this.applyCustomTransformers(runtimeSchema, options.customTransformers);
        }

        // 移除空值
        if (options.removeEmpty) {
            this.removeEmptyValues(runtimeSchema);
        }

        return runtimeSchema;
    }

    /**
     * 更新子项的可见性状态
     * @param schema 运行时 Schema
     * @param evaluator 表达式求值函数
     */
    updateVisibility(schema: RuntimeSchema, evaluator: (expr: string) => boolean): RuntimeSchema {
        // 计算当前项的可见性
        if (schema.visibleOn) {
            schema._visible = evaluator(schema.visibleOn);
        } else {
            schema._visible = true;
        }

        // 计算禁用状态
        if (schema.disabledOn) {
            schema._disabled = evaluator(schema.disabledOn);
        } else {
            schema._disabled = false;
        }

        // 递归处理子组件
        if (schema.children?.length) {
            schema.children = schema.children.map(child =>
                this.updateVisibility(child, evaluator)
            );
        }

        return schema;
    }

    /**
     * 合并参数覆盖
     * @param model 原始模型
     * @param mParams 参数覆盖
     */
    mergeParams(model: WidgetModel, mParams?: Partial<WidgetModel>): WidgetModel {
        if (!mParams) return model;

        return {
            ...model,
            ...mParams,
            props: { ...model.props, ...mParams.props },
            layoutProps: { ...model.layoutProps, ...mParams.layoutProps },
            style: { ...model.style, ...mParams.style }
        };
    }

    /**
     * 验证模型配置
     * @param model 模型定义
     */
    validateModel(model: WidgetModel): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // 验证必填字段
        if (!model.id) {
            errors.push({
                path: 'id',
                message: '缺少必填字段: id',
                code: 'MISSING_REQUIRED'
            });
        }

        if (!model.type) {
            errors.push({
                path: 'type',
                message: '缺少必填字段: type',
                code: 'MISSING_REQUIRED'
            });
        }

        // 验证类型有效性
        const validTypes = ['container', 'page', 'table', 'form', 'button', 'list', 'text'];
        if (model.type && !validTypes.includes(model.type)) {
            warnings.push({
                path: 'type',
                message: `未知的组件类型: ${model.type}`,
                suggestion: `有效类型: ${validTypes.join(', ')}`
            });
        }

        // 验证布局类型
        if (model.layout) {
            const validLayouts = ['normal', 'tabs', 'collapse', 'splitter'];
            if (!validLayouts.includes(model.layout)) {
                warnings.push({
                    path: 'layout',
                    message: `未知的布局类型: ${model.layout}`,
                    suggestion: `有效布局: ${validLayouts.join(', ')}`
                });
            }
        }

        // 递归验证子组件
        if (model.children?.length) {
            model.children.forEach((child, index) => {
                const childResult = this.validateModel(child);
                errors.push(...childResult.errors.map(e => ({
                    ...e,
                    path: `children[${index}].${e.path}`
                })));
                warnings.push(...childResult.warnings.map(w => ({
                    ...w,
                    path: `children[${index}].${w.path}`
                })));
            });
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 获取所有已注册的模型名称
     */
    getRegisteredModelNames(): string[] {
        return Array.from(this.modelRegistry.keys());
    }

    /**
     * 获取模型注册表项
     */
    getModelRegistryItem(name: string): ModelRegistryItem | undefined {
        return this.modelRegistry.get(name);
    }

    /**
     * 应用自定义转换器
     */
    private applyCustomTransformers(
        schema: RuntimeSchema,
        transformers: Record<string, (value: any, schema: WidgetModel) => any>
    ): void {
        for (const [key, transformer] of Object.entries(transformers)) {
            if (key in schema) {
                (schema as any)[key] = transformer((schema as any)[key], schema);
            }
        }
    }

    /**
     * 移除空值
     */
    private removeEmptyValues(obj: Record<string, any>): void {
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value === null || value === undefined || value === '') {
                delete obj[key];
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                this.removeEmptyValues(value);
            }
        }
    }
}
