import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, catchError } from 'rxjs';
import { DataSourceConfig } from '../models/schema.interface';
import { ScopeService } from './scope.service';

/**
 * 数据源服务 - 负责执行 HTTP 请求获取数据
 */
@Injectable({
    providedIn: 'root'
})
export class DataSourceService {
    private readonly http = inject(HttpClient);

    /**
     * 执行数据源请求
     */
    fetchData(config: DataSourceConfig, scope: ScopeService): Observable<any> {
        const { url, method = 'GET', params } = config;

        // 解析参数中的表达式
        const resolvedParams = this.resolveParams(params ?? {}, scope);

        // Mock 数据处理
        if (url.startsWith('mock://')) {
            return this.getMockData(url, resolvedParams);
        }

        // 真实 HTTP 请求
        switch (method) {
            case 'GET':
                return this.http.get(url, { params: resolvedParams }).pipe(
                    catchError(err => {
                        console.error('DataSource fetch error:', err);
                        return of(null);
                    })
                );
            case 'POST':
                return this.http.post(url, resolvedParams).pipe(
                    catchError(err => {
                        console.error('DataSource fetch error:', err);
                        return of(null);
                    })
                );
            default:
                return of(null);
        }
    }

    /**
     * 解析参数中的表达式
     */
    private resolveParams(params: Record<string, any>, scope: ScopeService): Record<string, any> {
        const resolved: Record<string, any> = {};

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
                const varName = value.slice(2, -1);
                resolved[key] = scope.getValue(varName);
            } else {
                resolved[key] = value;
            }
        }

        return resolved;
    }

    /**
     * 获取 Mock 数据
     */
    private getMockData(url: string, params: Record<string, any>): Observable<any> {
        const mockPath = url.replace('mock://', '');

        const mockDataMap: Record<string, any> = {
            'user-list': [
                { id: 1, name: '张三', age: 28, department: '技术部' },
                { id: 2, name: '李四', age: 32, department: '产品部' },
                { id: 3, name: '王五', age: 25, department: '设计部' }
            ],
            'user-detail': {
                id: params['id'] ?? 1,
                name: '张三',
                email: 'zhangsan@example.com',
                phone: '13800138000',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan'
            },
            'menu-tree': [
                {
                    id: 1,
                    name: '系统管理',
                    children: [
                        { id: 11, name: '用户管理' },
                        { id: 12, name: '角色管理' }
                    ]
                },
                {
                    id: 2,
                    name: '业务管理',
                    children: [
                        { id: 21, name: '订单管理' },
                        { id: 22, name: '商品管理' }
                    ]
                }
            ]
        };

        return of(mockDataMap[mockPath] ?? null).pipe(delay(300));
    }
}
