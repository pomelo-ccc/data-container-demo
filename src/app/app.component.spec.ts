import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'data-container-demo' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('data-container-demo');
  });

  it('should have model names after init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.ngOnInit();
    expect(app.modelNames.length).toBeGreaterThan(0);
  });

  it('should have default selected model name', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.selectedModelName).toBe('demo-conditional');
  });

  it('should change selected model on onModelChange', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    app.onModelChange('demo-table');
    expect(app.selectedModelName).toBe('demo-table');
  });

  it('should increment renderKey on loadModel', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const initialKey = app.renderKey;
    app.loadModel();
    expect(app.renderKey).toBe(initialKey + 1);
  });

  it('should return render data with name and data', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const renderData = app.getRenderData();
    expect(renderData.name).toBe(app.selectedModelName);
    expect(renderData.data).toBeTruthy();
  });

  it('should update testData on updateTestData', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const initialKey = app.renderKey;
    app.testData.showDetail = false;
    app.updateTestData();

    expect(app.testData.showDetail).toBe(false);
    expect(app.renderKey).toBe(initialKey + 1);
  });

  it('should toggle debug panel', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    const initial = app.showDebug;
    app.toggleDebug();
    expect(app.showDebug).toBe(!initial);
  });

  it('should render header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('数据容器组件演示');
  });
});
