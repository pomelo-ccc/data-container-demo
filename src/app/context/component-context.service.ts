import { Injectable, Optional, SkipSelf } from '@angular/core';
import { ComponentContextRuntime } from './component-context/runtime';

export {
  ScopeObj,
  TrackMode,
  TrackConfig,
  ExpressionDependency,
  DataScopeOptions,
  DataSourceInfo,
} from './types/context-types';
export {
  evaluateExpression,
  getNestedValue,
  extractVariables,
  getRootKey,
} from './utils/expression-utils';

@Injectable()
export class ComponentContext extends ComponentContextRuntime {
  constructor(@SkipSelf() @Optional() parent?: ComponentContext) {
    super(parent ?? null);
  }
}
