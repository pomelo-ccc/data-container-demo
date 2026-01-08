import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { WidgetSchema } from '../models/schema.interface';

/**
 * Schema 服务 - 负责获取和处理 Schema 配置
 */
@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private readonly http = inject(HttpClient);

    /**
     * 根据名称获取 Schema (模拟 API 调用)
     */
    fetchSchemaByName(name: string): Observable<WidgetSchema | null> {
        // 这里可以替换为真实的 API 调用
        // return this.http.get<WidgetSchema>(`/api/schemas/${name}`);

        // Mock 实现
        const mockSchemas = this.getMockSchemas();
        return of(mockSchemas[name] ?? null).pipe(delay(100));
    }

    /**
     * 合并 Schema 参数 (UI Override)
     */
    mergeSchemaParams(schema: WidgetSchema, mParams: Partial<WidgetSchema>): WidgetSchema {
        return {
            ...schema,
            ...mParams,
            props: { ...schema.props, ...mParams.props },
            layoutProps: { ...schema.layoutProps, ...mParams.layoutProps }
        };
    }

    /**
     * 获取 Mock Schema 数据
     */
    private getMockSchemas(): Record<string, WidgetSchema> {
        return {
            'demo-tabs': {
                id: 'container-tabs-1',
                type: 'container',
                layout: 'tabs',
                layoutProps: {
                    defaultActiveKey: 'tab-1',
                    type: 'card',
                    tabPosition: 'top'
                },
                children: [
                    {
                        id: 'tab-1',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '基本信息', badge: '3' },
                        children: [
                            { id: 'text-1', type: 'text', props: { content: '这是第一个 Tab 的内容' } }
                        ]
                    },
                    {
                        id: 'tab-2',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '详细配置' },
                        children: [
                            { id: 'text-2', type: 'text', props: { content: '这是第二个 Tab 的内容' } }
                        ]
                    }
                ]
            },
            'demo-collapse': {
                id: 'container-collapse-1',
                type: 'container',
                layout: 'collapse',
                layoutProps: {
                    accordion: true,
                    bordered: true
                },
                children: [
                    {
                        id: 'panel-1',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '面板一', extra: { icon: 'setting' } },
                        children: [
                            { id: 'text-1', type: 'text', props: { content: '面板一的内容' } }
                        ]
                    },
                    {
                        id: 'panel-2',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '面板二' },
                        children: [
                            { id: 'text-2', type: 'text', props: { content: '面板二的内容' } }
                        ]
                    }
                ]
            }
        };
    }
}
