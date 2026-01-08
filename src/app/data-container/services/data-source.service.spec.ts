import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataSourceService } from './data-source.service';
import { ScopeService } from './scope.service';
import { DataSourceConfig } from '../models/schema.interface';

describe('DataSourceService', () => {
    let service: DataSourceService;
    let scopeService: ScopeService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [DataSourceService, ScopeService]
        });

        service = TestBed.inject(DataSourceService);
        scopeService = TestBed.inject(ScopeService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Mock 数据请求', () => {
        it('应该能够获取 user-list Mock 数据', fakeAsync(() => {
            const config: DataSourceConfig = {
                url: 'mock://user-list',
                method: 'GET'
            };

            let result: any;
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            tick(300); // Mock 数据有 300ms 延迟

            expect(result).toBeTruthy();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);
            expect(result[0].name).toBe('张三');
        }));

        it('应该能够获取 user-detail Mock 数据', fakeAsync(() => {
            scopeService.setValue('id', 5);

            const config: DataSourceConfig = {
                url: 'mock://user-detail',
                method: 'GET',
                params: { id: '${id}' }
            };

            let result: any;
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            tick(300);

            expect(result).toBeTruthy();
            expect(result.id).toBe(5);
        }));

        it('应该能够获取 menu-tree Mock 数据', fakeAsync(() => {
            const config: DataSourceConfig = {
                url: 'mock://menu-tree',
                method: 'GET'
            };

            let result: any;
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            tick(300);

            expect(result).toBeTruthy();
            expect(result.length).toBe(2);
            expect(result[0].name).toBe('系统管理');
        }));

        it('不存在的 Mock 路径应该返回 null', fakeAsync(() => {
            const config: DataSourceConfig = {
                url: 'mock://nonexistent',
                method: 'GET'
            };

            let result: any = 'initial';
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            tick(300);

            expect(result).toBeNull();
        }));
    });

    describe('真实 HTTP 请求', () => {
        it('应该能够发起 GET 请求', () => {
            const config: DataSourceConfig = {
                url: '/api/users',
                method: 'GET'
            };

            service.fetchData(config, scopeService).subscribe();

            const req = httpMock.expectOne('/api/users');
            expect(req.request.method).toBe('GET');
            req.flush([{ id: 1, name: 'Test' }]);
        });

        it('应该能够发起 POST 请求', () => {
            const config: DataSourceConfig = {
                url: '/api/users',
                method: 'POST',
                params: { name: '新用户' }
            };

            service.fetchData(config, scopeService).subscribe();

            const req = httpMock.expectOne('/api/users');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ name: '新用户' });
            req.flush({ id: 1, name: '新用户' });
        });

        it('HTTP 错误应该返回 null', () => {
            const config: DataSourceConfig = {
                url: '/api/error',
                method: 'GET'
            };

            let result: any = 'initial';
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            const req = httpMock.expectOne('/api/error');
            req.error(new ErrorEvent('Network error'));

            expect(result).toBeNull();
        });
    });

    describe('参数解析', () => {
        it('应该能够解析表达式参数', fakeAsync(() => {
            scopeService.updateData({ userId: 100, userName: '测试' });

            const config: DataSourceConfig = {
                url: 'mock://user-detail',
                method: 'GET',
                params: {
                    id: '${userId}',
                    name: '${userName}',
                    static: 'staticValue'
                }
            };

            let result: any;
            service.fetchData(config, scopeService).subscribe(data => {
                result = data;
            });

            tick(300);

            expect(result.id).toBe(100);
        }));
    });
});
