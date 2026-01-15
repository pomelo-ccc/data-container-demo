import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ContainerComponent } from './container.component';
import { ScopeService } from '../services/scope.service';
import { ModelService } from '../services/model.service';
import { WidgetModel } from '../models/schema.interface';

describe('ContainerComponent', () => {
    let component: ContainerComponent;
    let fixture: ComponentFixture<ContainerComponent>;
    let scopeService: ScopeService;
    let modelService: ModelService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ContainerComponent,
                HttpClientTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ContainerComponent);
        component = fixture.componentInstance;
        scopeService = fixture.debugElement.injector.get(ScopeService);
        modelService = TestBed.inject(ModelService);
    });

    describe('组件初始化', () => {
        it('应该能够创建组件实例', () => {
            expect(component).toBeTruthy();
        });

        it('应该提供独立的 ScopeService 实例', () => {
            expect(scopeService).toBeTruthy();
        });

        it('setAllData 应支持 replace 模式整体替换', () => {
            const ctx = (component as any).ctx;
            ctx.setData('a', 1);
            ctx.setData('b', 2);

            ctx.setAllData({ a: 10 }, { replace: true });

            expect(ctx.getAllData()).toEqual({ a: 10 });
        });

        it('runtimeSchema 初始值应该为 null', () => {
            expect(component.runtimeSchema()).toBeNull();
        });

        it('isLoading 初始值应该为 false', () => {
            expect(component.isLoading()).toBe(false);
        });

        it('error 初始值应该为 null', () => {
            expect(component.error()).toBeNull();
        });
    });

    describe('布局类型', () => {
        it('默认布局应该是 normal', () => {
            expect(component.currentLayout()).toBe('normal');
        });
    });

    describe('子组件', () => {
        it('没有 schema 时 children 应该为空数组', () => {
            expect(component.children()).toEqual([]);
        });

        it('没有 schema 时 hasChildren 应该返回 false', () => {
            expect(component.hasChildren()).toBe(false);
        });

        it('没有 schema 时 visibleChildren 应该为空数组', () => {
            expect(component.visibleChildren()).toEqual([]);
        });
    });

    describe('ModelService 集成', () => {
        it('ModelService 应该可用', () => {
            expect(modelService).toBeTruthy();
        });

        it('应该能够获取已注册的模型名称', () => {
            const names = modelService.getRegisteredModelNames();
            expect(names.length).toBeGreaterThan(0);
        });

        it('应该能够通过名称获取模型', (done) => {
            modelService.getModelByName('demo-full').subscribe(model => {
                expect(model).toBeTruthy();
                expect(model?.id).toBe('demo-full');
                done();
            });
        });

        it('不存在的模型应该返回 null', (done) => {
            modelService.getModelByName('non-existent').subscribe(model => {
                expect(model).toBeNull();
                done();
            });
        });
    });

    describe('验证功能', () => {
        it('应该能够验证有效的模型', () => {
            const validModel: WidgetModel = {
                id: 'test',
                type: 'container'
            };
            const result = modelService.validateModel(validModel);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('应该能够检测到缺少 id 的模型', () => {
            const invalidModel: WidgetModel = {
                id: '',
                type: 'container'
            };
            const result = modelService.validateModel(invalidModel);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('转换功能', () => {
        it('应该能够转换模型为运行时 Schema', () => {
            const model: WidgetModel = {
                id: 'test',
                type: 'container',
                layout: 'tabs',
                children: [
                    { id: 'child-1', type: 'text' },
                    { id: 'child-2', type: 'text', visibleOn: '${show} === true' }
                ]
            };

            const runtime = modelService.transformToRuntimeSchema(model, 'test-model');

            expect(runtime._modelName).toBe('test-model');
            expect(runtime._visible).toBe(true);
            expect(runtime.children?.length).toBe(2);
            expect(runtime.children?.[0]._visible).toBe(true);
        });
    });
});
