/**
 * 组件上下文类型定义
 */

/**
 * 作用域对象
 * 支持原型链数据继承和命名空间访问
 */
export interface ScopeObj {
  /** 父级作用域 */
  $parent: ScopeObj | null;
  /** 命名空间映射 (id -> scope) */
  $named: Record<string, ScopeObj>;
  /** 动态数据字段 */
  [key: string]: any;
}

/**
 * 追踪模式
 * - 'none': 不追踪任何上层数据变化
 * - 'explicit': 只追踪 trackExpression 中指定的变量
 * - 'auto': 自动追踪所有上层数据变化 (默认)
 */
export type TrackMode = 'none' | 'explicit' | 'auto';

/**
 * 数据追踪配置
 */
export interface TrackConfig {
  /**
   * 追踪模式
   * @default 'auto'
   */
  mode: TrackMode;

  /**
   * 追踪表达式 (仅在 mode='explicit' 时生效)
   * 支持格式：
   * - '${variable}' - 追踪单个变量
   * - '${var1},${var2}' - 追踪多个变量
   * - '${condition ? a : b}' - 条件表达式
   *
   * @example
   * trackExpression: '${status},${user.name}'
   */
  trackExpression?: string;
}

/**
 * 表达式依赖信息
 */
export interface ExpressionDependency {
  /** 表达式字符串 */
  expression: string;
  /** 依赖的变量路径列表 */
  variables: string[];
  /** 每个变量来源的 Context ID */
  sources: Map<string, string>;
  /** 最后计算的值 */
  lastValue: any;
}

/**
 * 数据作用域选项
 */
export interface DataScopeOptions {
  /** 是否继承父级数据 (默认 false) */
  inherit?: boolean;
  /** 是否向上冒泡变更 (默认 false) */
  bubble?: boolean;
}

/**
 * 数据来源信息
 */
export interface DataSourceInfo<T = any> {
  /** 数据值 */
  value: T | undefined;
  /** 拥有者 Context ID */
  ownerId: string | null;
  /** 拥有者类型 */
  ownerType: string | null;
  /** 距离当前 context 的层数 (0 = 自己) */
  depth: number;
}

