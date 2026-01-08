/**
 * 布局类型枚举
 */
export type LayoutType = 'normal' | 'tabs' | 'collapse' | 'splitter';

/**
 * 组件类型枚举
 */
export type WidgetType = 'container' | 'page' | 'table' | 'form' | 'button' | 'list' | 'text';

/**
 * Tabs 布局特有配置
 */
export interface TabsLayoutProps {
    defaultActiveKey?: string;
    destroyInactive?: boolean;
    tabPosition?: 'top' | 'bottom' | 'left' | 'right';
    type?: 'line' | 'card' | 'editable-card';
}

/**
 * Collapse 布局特有配置
 */
export interface CollapseLayoutProps {
    accordion?: boolean;
    expandIconPosition?: 'left' | 'right';
    bordered?: boolean;
}

/**
 * Splitter 布局特有配置
 */
export interface SplitterLayoutProps {
    direction?: 'horizontal' | 'vertical';
    splitRatio?: number[];
    minSizes?: number[];
}

/**
 * Normal 布局特有配置
 */
export interface NormalLayoutProps {
    gap?: number;
    direction?: 'row' | 'column';
}

/**
 * 布局属性联合类型
 */
export type LayoutProps = TabsLayoutProps | CollapseLayoutProps | SplitterLayoutProps | NormalLayoutProps | Record<string, any>;

/**
 * Tab 子项配置
 */
export interface TabChildItem {
    title: string;
    badge?: string;
    disabled?: boolean;
}

/**
 * Collapse 子项配置
 */
export interface CollapseChildItem {
    title: string;
    extra?: { icon?: string; text?: string };
    disabledOn?: string;
}

/**
 * 通用子项扩展属性
 */
export interface ChildExtras extends TabChildItem, CollapseChildItem { }

/**
 * 数据源配置
 */
export interface DataSourceConfig {
    /** API 地址 */
    url: string;
    /** 请求方法 */
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    /** 请求参数 (支持表达式) */
    params?: Record<string, any>;
    /** 数据映射 */
    dataMapping?: Record<string, string>;
    /** 自动加载 */
    autoLoad?: boolean;
}

/**
 * 模型定义 (原 WidgetSchema)
 * 存储在配置库中的静态配置
 */
export interface WidgetModel {
    /** 唯一标识 */
    id: string;
    /** 组件类型 */
    type: WidgetType | string;
    /** 样式配置 */
    style?: Record<string, any>;
    /** 可见性表达式 */
    visibleOn?: string;
    /** 禁用表达式 */
    disabledOn?: string;
    /** 布局类型 */
    layout?: LayoutType;
    /** 布局特有配置 */
    layoutProps?: LayoutProps;
    /** 子组件列表 */
    children?: WidgetModel[];
    /** 子项扩展属性 (用于 Tab/Collapse 标题等) */
    childExtras?: Partial<ChildExtras>;
    /** 数据源配置 */
    dataSource?: DataSourceConfig;
    /** 组件自定义属性 */
    props?: Record<string, any>;
    /** 初始上下文数据 (在 Component Context 中预设的数据) */
    data?: Record<string, any>;
}

/**
 * 运行时 Schema (转换后的模型)
 * 包含运行时计算的状态字段
 */
export interface RuntimeSchema extends WidgetModel {
    /** 运行时: 是否可见 (计算后的值) */
    _visible?: boolean;
    /** 运行时: 是否禁用 (计算后的值) */
    _disabled?: boolean;
    /** 运行时: 是否加载中 */
    _loading?: boolean;
    /** 运行时: 错误信息 */
    _error?: string | null;
    /** 运行时: 原始模型名称 */
    _modelName?: string;
    /** 运行时: 转换后的子组件 */
    children?: RuntimeSchema[];
}

/**
 * 模型注册表项
 */
export interface ModelRegistryItem {
    /** 模型名称 */
    name: string;
    /** 模型版本 */
    version?: string;
    /** 模型描述 */
    description?: string;
    /** 模型定义 */
    model: WidgetModel;
    /** 创建时间 */
    createdAt?: Date;
    /** 更新时间 */
    updatedAt?: Date;
}

/**
 * 容器组件输入数据
 */
export interface ContainerInput {
    /** 模型名称 (通过名称查询模型) */
    name: string;
    /** 初始数据 */
    data?: Record<string, any>;
    /** 参数覆盖 (UI Override) */
    mParams?: Partial<WidgetModel>;
}

/**
 * 模型转换选项
 */
export interface TransformOptions {
    /** 是否验证必填字段 */
    validateRequired?: boolean;
    /** 是否移除空值 */
    removeEmpty?: boolean;
    /** 是否递归处理子组件 */
    recursive?: boolean;
    /** 自定义转换器 */
    customTransformers?: Record<string, (value: any, schema: WidgetModel) => any>;
}

/**
 * 模型验证结果
 */
export interface ValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** 错误列表 */
    errors: ValidationError[];
    /** 警告列表 */
    warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
    /** 字段路径 */
    path: string;
    /** 错误消息 */
    message: string;
    /** 错误代码 */
    code: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
    /** 字段路径 */
    path: string;
    /** 警告消息 */
    message: string;
    /** 建议 */
    suggestion?: string;
}

// 保持向后兼容的别名
export type WidgetSchema = WidgetModel;
export type ContainerRenderData = ContainerInput;
