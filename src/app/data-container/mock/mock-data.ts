import { ComponentContext } from 'src/app/context';
import { WidgetModel } from '../models/schema.interface';
import { ScopeService } from '../services/scope.service';

/**
 * Mock Model Collection - Full Demo
 */
export const MOCK_MODELS: WidgetModel[] = [
    {
        id: 'demo-full',
        type: 'container',
        layout: 'tabs',
        layoutProps: {
            type: 'card',
            tabPosition: 'top',
            defaultActiveKey: 'tab-form' // 默认显示第二个页签
        },
        children: [
            // Tab 1: 表格演示
            {
                id: 'tab-table',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '📊 表格演示' },
                dataSource: {
                    url: 'mock://user-list',
                    method: 'GET',
                    autoLoad: true,
                    dataMapping: { users: '' }
                },
                children: [
                    {
                        id: 'table-search-form',
                        type: 'form',
                        props: {
                            layout: 'inline',
                            showSubmit: false, // Use external button
                            fields: [
                                {
                                    name: 'keyword',
                                    label: '关键词',
                                    type: 'text',
                                    placeholder: '请输入搜索关键词',
                                    span: 24
                                }
                            ]
                        }
                    },
                    // 按钮组
                    {
                        id: 'table-actions',
                        type: 'container',
                        layout: 'normal',
                        children: [
                            {
                                id: 'btn-search',
                                type: 'button',
                                props: {
                                    type: 'primary',
                                    text: '获取数据并搜索',
                                    icon: 'search',
                                    actionType: 'script',
                                    script: `
                                        const users = scope.getValue('users');
                                        const keyword = scope.getValue('keyword'); 
                                        alert('当前用户数: ' + (users ? users.length : '0') + '\\n搜索关键词: ' + (keyword || '未输入'));
                                    `
                                }
                            },
                            {
                                id: 'btn-demo-actions',
                                type: 'button',
                                props: {
                                    type: 'default',
                                    text: '操作演示 (切换表格显隐)',
                                    icon: 'tool',
                                    actionType: 'script',
                                    script: `
                                        // 演示：获取数据与控制显隐
                                        // 1. 获取 Form 数据
                                        const keyword = scope.getValue('keyword');
                                        
                                        // 2. 获取 Table 数据 (Page 数据同理，如果在 scope 中)
                                        const users = scope.getValue('users');
                                        
                                        // 3. 控制 Table 显隐 (数据驱动)
                                        // 通过设置 visibleOn 绑定的变量
                                        const currentVisible = scope.getValue('tableVisible') !== false;
                                        scope.setValue('tableVisible', !currentVisible);
                                        
                                        alert('Form 关键词: ' + (keyword || '空') + 
                                              '\\nTable 数据行数: ' + (users ? users.length : 0) + 
                                              '\\nTable 可见性: ' + (!currentVisible ? '显示' : '隐藏'));
                                    `
                                }
                            },
                            {
                                id: 'btn-toggle-destroy',
                                type: 'button',
                                props: {
                                    type: 'primary',
                                    danger: true,
                                    text: '🧪 切换测试按钮显隐 (测试销毁)',
                                    icon: 'experiment',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        const current = scope.getValue('showDestroyableBtn') !== false;
                                        scope.setValue('showDestroyableBtn', !current);
                                        console.log('[Toggle] showDestroyableBtn:', !current);
                                    }
                                }
                            },
                            {
                                id: 'btn-destroyable',
                                type: 'button',
                                visibleOn: '${showDestroyableBtn !== false}',
                                props: {
                                    type: 'dashed',
                                    text: '🎯 我是可销毁的测试按钮',
                                    icon: 'aim',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        console.log('btn-destroyable clicked', ctx);
                                    }
                                }
                            },
                            {
                                id: 'btn-demo-test',
                                type: 'button',
                                props: {
                                    type: 'default',
                                    text: '操作演示 (切换表格显隐)',
                                    icon: 'tool',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        console.log('btn-demo-test', ctx);

                                    }

                                }
                            },
                            {
                                id: 'btn-morph',
                                type: 'button',
                                props: {
                                    type: 'dashed',
                                    danger: true,
                                    text: '变身！(Tabs ↔ 垂直分栏)',
                                    icon: 'thunderbolt',
                                    actionType: 'script',
                                    script: `
                                        // 演示：动态切换布局类型 (Layout Morphing)
                                        const container = scope.getComponent('demo-full');
                                        if (container) {
                                            const currentLayout = container.getLayout();
                                            
                                            if (currentLayout === 'tabs') {
                                                // 从 Tabs 切换到 Splitter
                                                if (confirm('高能预警：\\n即将把当前的 [Tabs 页签布局] 动态切换为 [垂直 Splitter 分栏布局]！\\n\\n这展示了 Container 组件强大的运行时布局重构能力。继续吗？')) {
                                                    container.switchLayout('splitter');
                                                    container.setProperty('direction', 'vertical');
                                                    container.setProperty('splitRatio', [0.3, 0.3, 0.2, 0.2]);
                                                    alert('变身完成！\\n现在这是一个垂直分栏布局，原来的 Tab 页签变成了分栏面板。\\n再次点击可以变回 Tabs 布局！');
                                                }
                                            } else {
                                                // 从其他布局切换回 Tabs
                                                if (confirm('即将把当前布局切换回 [Tabs 页签布局]！继续吗？')) {
                                                    container.switchLayout('tabs');
                                                    container.setProperty('type', 'card');
                                                    container.setProperty('tabPosition', 'top');
                                                    alert('变身完成！\\n已恢复为 Tabs 页签布局。');
                                                }
                                            }
                                        }
                                    `
                                }
                            }
                        ]
                    },
                    {
                        id: 'user-table',
                        type: 'table',
                        visibleOn: '${tableVisible !== false}', // 绑定显隐控制变量
                        props: {
                            columns: [
                                { title: 'ID', dataIndex: 'id' },
                                { title: '姓名', dataIndex: 'name' },
                                { title: '角色', dataIndex: 'role' },
                                { title: '状态', dataIndex: 'status' }
                            ],
                            data: '${_data}'
                        }
                    }
                ]
            },
            // Tab 2: 表单演示
            {
                id: 'tab-form',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '📝 表单演示' },
                children: [
                    {
                        id: 'demo-form',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            submitText: '注册',
                            showReset: true,
                            fields: [
                                { name: 'username', label: '用户名', type: 'text', required: true, placeholder: '请输入用户名' },
                                { name: 'password', label: '密码', type: 'text', required: true, placeholder: '请输入密码' }, // text type for demo
                                { name: 'role', label: '角色', type: 'select', options: [{ label: '管理员', value: 'admin' }, { label: '用户', value: 'user' }] },
                                { name: 'active', label: '启用状态', type: 'switch', defaultValue: true }
                            ]
                        }
                    }
                ]
            },
            // Tab 3: 折叠面板演示
            {
                id: 'tab-collapse',
                type: 'container',
                layout: 'collapse',
                childExtras: { title: '📂 折叠面板', badge: '3' },
                layoutProps: {
                    accordion: true,
                    bordered: true
                },
                children: [
                    {
                        id: 'panel-1',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '用户信息', extra: { icon: 'user' } },
                        children: [
                            { id: 'p1-text', type: 'text', props: { content: '这是用户信息面板的内容' } }
                        ]
                    },
                    {
                        id: 'panel-2',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '系统设置', extra: { icon: 'setting' } },
                        children: [
                            { id: 'p2-text', type: 'text', props: { content: '这是系统设置面板的内容' } }
                        ]
                    },
                    {
                        id: 'panel-3',
                        type: 'container',
                        layout: 'normal',
                        childExtras: { title: '数据统计', extra: { icon: 'bar-chart' } },
                        children: [
                            { id: 'p3-text', type: 'text', props: { content: '这是数据统计面板的内容' } },
                            {
                                id: 'btn-demo-test',
                                type: 'button',
                                props: {
                                    text: '测试',
                                    icon: 'tool',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        console.log('btn-demo-test', ctx);
                                    }
                                }
                            },
                            {
                                id: 'btn-demo-test2',
                                type: 'button',
                                props: {
                                    text: '测试2',
                                    icon: 'tool',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        console.log('btn-demo-test2', ctx);
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            // Tab 4: 分栏布局演示
            {
                id: 'tab-splitter',
                type: 'container',
                layout: 'splitter',
                childExtras: { title: '↔️ 分栏布局' },
                layoutProps: {
                    direction: 'horizontal',
                    splitRatio: [30, 70],
                    minSizes: [100, 100]
                },
                children: [
                    {
                        id: 'split-left',
                        type: 'container',
                        layout: 'normal',
                        style: { background: '#f0f2f5', height: '100%', padding: '16px' },
                        children: [
                            { id: 'left-text', type: 'text', props: { content: '左侧侧边栏 (30%)' } }
                        ]
                    },
                    {
                        id: 'split-right',
                        type: 'container',
                        layout: 'normal',
                        style: { background: '#fff', height: '100%', padding: '16px' },
                        children: [
                            { id: 'right-text', type: 'text', props: { content: '右侧主要内容 (70%)' } },
                            {
                                id: 'inner-split',
                                type: 'container',
                                layout: 'splitter',
                                layoutProps: {
                                    direction: 'vertical',
                                    splitRatio: [50, 50]
                                },
                                style: { height: '300px', border: '1px solid #ddd', marginTop: '16px' },
                                children: [
                                    {
                                        id: 'inner-top',
                                        type: 'container',
                                        style: { background: '#e6f7ff', padding: '8px' },
                                        children: [
                                            { id: 'top-text', type: 'text', props: { content: '上部区域' } }
                                        ]
                                    },
                                    {
                                        id: 'inner-bottom',
                                        type: 'container',
                                        style: { background: '#f6ffed', padding: '8px' },
                                        children: [
                                            { id: 'bottom-text', type: 'text', props: { content: '下部区域' } }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            // Tab 5: 简单数据同步测试 (Page > Form)
            {
                id: 'tab-simple-sync',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '🧪 简单同步测试', badge: 'TEST' },
                // Page 层初始数据
                data: {
                    testValue: '初始值-Page层',
                    counter: 0
                },
                children: [
                    {
                        id: 'page-level-display',
                        type: 'text',
                        props: {
                            content: '📋 **Page 层显示区** - 观察这里是否与 Form 同步'
                        }
                    },
                    // 第一个 Form - 使用 Context 数据
                    {
                        id: 'sync-form-1',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: false,
                            useContextData: true,
                            dataWriteMode: 'owner',
                            fields: [
                                { name: 'testValue', label: '✏️ Form1 输入', type: 'text', placeholder: '输入后看是否同步' },
                                { name: 'counter', label: '✏️ Form1 计数', type: 'number' }
                            ]
                        }
                    },
                    {
                        id: 'sync-divider',
                        type: 'text',
                        props: {
                            content: '---\n\n👇 **第二个 Form (也继承)** - 应该与上方 Form 同步'
                        }
                    },
                    // 第二个 Form - 也使用 Context 数据 (只读)
                    {
                        id: 'sync-form-2',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: false,
                            readonly: true,
                            useContextData: true,
                            fields: [
                                { name: 'testValue', label: '👁️ Form2 显示', type: 'text' },
                                { name: 'counter', label: '👁️ Form2 计数', type: 'number' }
                            ]
                        }
                    },
                    {
                        id: 'sync-actions',
                        type: 'container',
                        layout: 'normal',
                        children: [
                            {
                                id: 'btn-show-all-data',
                                type: 'button',
                                props: {
                                    type: 'primary',
                                    text: '📊 显示所有层级数据',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        const pageCtx = ctx.getComponent('tab-simple-sync');
                                        const form1Ctx = ctx.getComponent('sync-form-1');
                                        const form2Ctx = ctx.getComponent('sync-form-2');

                                        alert(`📊 数据层级:

【Page (tab-simple-sync)】
${JSON.stringify(pageCtx?.getAllData() || {}, null, 2)}

【Form1 (sync-form-1)】
getAllData: ${JSON.stringify(form1Ctx?.getAllData() || {}, null, 2)}
lookupData('testValue'): ${form1Ctx?.lookupData('testValue')}

【Form2 (sync-form-2)】
getAllData: ${JSON.stringify(form2Ctx?.getAllData() || {}, null, 2)}
lookupData('testValue'): ${form2Ctx?.lookupData('testValue')}`);
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            // Tab 5: 两个 Form 都继承 Context 数据 (数据同步演示)
            {
                id: 'tab-form-context',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '🔗 双 Form 都继承 (同步)', badge: 'NEW' },
                // Page 层设置初始数据
                data: {
                    orderStatus: 'pending',
                    customerName: '张三',
                    orderAmount: 1000,
                    isPriority: false,
                    age: 7  // 初始 age=3，Button 不显示
                },
                children: [

                    // Form 1: 可编辑，使用 Context 数据
                    {
                        id: 'order-form-editable',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: true,
                            useContextData: true,
                            dataWriteMode: 'owner',
                            fields: [
                                {
                                    name: 'orderStatus',
                                    label: '📝 订单状态',
                                    type: 'select',
                                    disabledOn: '${isPriority}',
                                    options: [
                                        { label: '待处理', value: 'pending' },
                                        { label: '处理中', value: 'processing' },
                                        { label: '已完成', value: 'completed' },
                                        { label: '已取消', value: 'cancelled' }
                                    ]
                                },
                                { name: 'customerName', label: '📝 客户名称', type: 'text', placeholder: '可编辑', disabledOn: '${isPriority}' },
                                { name: 'orderAmount', label: '📝 订单金额', type: 'number', disabledOn: '${isPriority}' },
                                { name: 'age', label: '📝 年龄 (>5 显示按钮)', type: 'number', disabledOn: '${isPriority}' },
                                { name: 'isPriority', label: '📝 优先订单', type: 'switch' }
                            ]
                        }
                    },
                    // 条件显示的 Button: 当 age > 5 时显示
                    {
                        id: 'btn-age-conditional',
                        type: 'button',
                        visibleOn: '${age > 5}',  // 使用 ${expression} 格式
                        props: {
                            type: 'primary',
                            text: '🎉 我出现了！(age > 5)',
                            icon: 'check-circle',
                            actionType: 'function',
                            script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                const age = ctx.lookupData('age');
                                alert(`当前 age = ${age}，大于 5 所以我显示了！`);
                            }
                        }
                    },

                    // Form 2: 只读，也使用 Context 数据 (会同步显示)
                    {
                        id: 'order-form-readonly',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: false,
                            readonly: true,  // 只读模式
                            useContextData: true,  // 也继承数据
                            fields: [
                                {
                                    name: 'orderStatus',
                                    label: '👁️ 订单状态',
                                    type: 'select',
                                    options: [
                                        { label: '待处理', value: 'pending' },
                                        { label: '处理中', value: 'processing' },
                                        { label: '已完成', value: 'completed' },
                                        { label: '已取消', value: 'cancelled' }
                                    ]
                                },
                                { name: 'customerName', label: '👁️ 客户名称', type: 'text' },
                                { name: 'orderAmount', label: '👁️ 订单金额', type: 'number' },
                                { name: 'age', label: '👁️ 年龄', type: 'number' },
                                { name: 'isPriority', label: '👁️ 优先订单', type: 'switch' }
                            ]
                        }
                    },
                ]
            },
            // Tab 6: 可编辑继承 + 只读不继承 (对比演示)
            {
                id: 'tab-form-local',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '📦 继承 vs 不继承 (对比)', badge: 'NEW' },
                // Page 层数据
                data: {
                    productName: 'Page层产品名',
                    productCode: 'PAGE-001',
                    productPrice: 888,
                    category: 'clothing'
                },
                children: [
                    {
                        id: 'local-data-info',
                        type: 'text',
                        props: {
                            content: `📝 **演示说明**: 

✏️ **可编辑表单**: \`useContextData: true\`，从 Page Context 读取数据并可编辑
👁️ **只读表单**: \`useContextData: false\`，使用自己的默认值，**不读取 Page 数据**

🧪 修改可编辑表单后：
- Page Context 数据会更新
- 只读表单 **不会同步** (因为它不继承)`
                        }
                    },
                    // Form 1: 可编辑，使用 Context 数据 (继承)
                    {
                        id: 'product-form-editable',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: true,
                            useContextData: true,  // ✅ 继承 Page 数据
                            dataWriteMode: 'owner',
                            fields: [
                                { name: 'productName', label: '📝 产品名称 (继承)', type: 'text', placeholder: '来自 Page', disabledOn: '${isPriority}' },
                                { name: 'productCode', label: '📝 产品编码 (继承)', type: 'text', disabledOn: '${isPriority}' },
                                { name: 'productPrice', label: '📝 价格 (继承)', type: 'number', disabledOn: '${isPriority}' },
                                {
                                    name: 'category',
                                    label: '📝 分类 (继承)',
                                    type: 'select',
                                    disabledOn: '${isPriority}',
                                    options: [
                                        { label: '电子产品', value: 'electronics' },
                                        { label: '服装', value: 'clothing' },
                                        { label: '食品', value: 'food' }
                                    ]
                                },
                                { name: 'isPriority', label: '📝 优先订单', type: 'switch' }
                            ]
                        }
                    },
                    {
                        id: 'divider-text-2',
                        type: 'text',
                        props: {
                            content: '---\n\n👇 **只读表单 (不继承 Context 数据)** - 使用自己的默认值，与上方表单数据独立'
                        }
                    },
                    // Form 2: 只读，不使用 Context 数据 (不继承)
                    {
                        id: 'product-form-readonly',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            showSubmit: false,
                            showReset: false,
                            readonly: true,  // 只读模式
                            useContextData: false,  // ❌ 不继承 Page 数据
                            fields: [
                                { name: 'productName', label: '👁️ 产品名称 (不继承)', type: 'text', defaultValue: 'Form自己的默认值' },
                                { name: 'productCode', label: '👁️ 产品编码 (不继承)', type: 'text', defaultValue: 'FORM-LOCAL-001' },
                                { name: 'productPrice', label: '👁️ 价格 (不继承)', type: 'number', defaultValue: 99.99 },
                                {
                                    name: 'category',
                                    label: '👁️ 分类 (不继承)',
                                    type: 'select',
                                    defaultValue: 'electronics',  // 与 Page 的 'clothing' 不同
                                    options: [
                                        { label: '电子产品', value: 'electronics' },
                                        { label: '服装', value: 'clothing' },
                                        { label: '食品', value: 'food' }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        id: 'local-form-actions',
                        type: 'container',
                        layout: 'normal',
                        children: [
                            {
                                id: 'btn-compare-all',
                                type: 'button',
                                props: {
                                    type: 'primary',
                                    text: '📊 对比三方数据 (Page + 两个 Form)',
                                    icon: 'swap',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        const pageCtx = ctx.getComponent('tab-form-local');
                                        const editableCtx = ctx.getComponent('product-form-editable');
                                        const readonlyCtx = ctx.getComponent('product-form-readonly');

                                        const pageData = pageCtx?.getAllData() || {};
                                        const editableData = editableCtx?.getAllData() || {};
                                        const readonlyData = readonlyCtx?.getAllData() || {};

                                        alert(`📊 三方数据对比:

【Page Context 数据】
${JSON.stringify(pageData, null, 2)}

【可编辑 Form (继承 Page)】
本地数据: ${JSON.stringify(editableData, null, 2)}
lookupData('productName'): ${editableCtx?.lookupData('productName')}

【只读 Form (不继承，用默认值)】
本地数据: ${JSON.stringify(readonlyData, null, 2)}
lookupData('productName'): ${readonlyCtx?.lookupData('productName')}

💡 可编辑 Form lookupData 返回 Page 数据
💡 只读 Form lookupData 返回自己的默认值`);
                                    }
                                }
                            },
                            {
                                id: 'btn-show-source',
                                type: 'button',
                                props: {
                                    type: 'default',
                                    text: '🔍 查看 productName 数据来源',
                                    icon: 'search',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext, event: MouseEvent) => {
                                        const editableCtx = ctx.getComponent('product-form-editable');
                                        const readonlyCtx = ctx.getComponent('product-form-readonly');

                                        const editableSource = editableCtx?.getDataSourceInfo<string>('productName');
                                        const readonlySource = readonlyCtx?.getDataSourceInfo<string>('productName');

                                        alert(`🔍 productName 数据来源对比:

【可编辑 Form (继承)】
  值: ${editableSource?.value}
  来源 Context: ${editableSource?.ownerId}
  来源类型: ${editableSource?.ownerType}
  距离: ${editableSource?.depth} 层
  👆 数据来自 Page！

【只读 Form (不继承)】
  值: ${readonlySource?.value}
  来源 Context: ${readonlySource?.ownerId}
  来源类型: ${readonlySource?.ownerType}
  距离: ${readonlySource?.depth} 层
  👆 数据来自 Form 自己！`);
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            // Tab 7: 多层级嵌套测试 (Layer 1 > Layer 2 > Layer 3)
            {
                id: 'tab-nested-layers',
                type: 'container',
                layout: 'normal',
                childExtras: { title: '📚 多层级嵌套', badge: 'DEEP' },
                // Layer 1 (Page 1) Data
                data: {
                    layerName: 'Level 1 (Root)',
                    sharedData: 'L1-Value',
                    rootOnly: 'Root-Secret'
                },
                children: [
                    {
                        id: 'info-l1',
                        type: 'text',
                        props: { content: '## 1️⃣ 第一层 (Page 1)\n数据: layerName="Level 1", sharedData="L1-Value"' }
                    },
                    // Form 1 (Child of Page 1)
                    {
                        id: 'form1-l1',
                        type: 'form',
                        props: {
                            layout: 'horizontal',
                            useContextData: true,
                            readonly: false,
                            fields: [
                                { name: 'layerName', label: '📝 Form1 (L1) - Layer', type: 'text', placeholder: '修改 Layer 1 数据' },
                                { name: 'sharedData', label: '📝 Form1 (L1) - Shared', type: 'text', placeholder: '修改 Layer 1 共享数据' }
                            ]
                        }
                    },
                    // Page 2 (Child of Page 1)
                    {
                        id: 'page2-l2',
                        type: 'container',
                        layout: 'normal',
                        style: { border: '2px dashed #1890ff', padding: '16px', background: '#f0f5ff', marginTop: '16px' },
                        // Layer 2 Data (Overrides inherited)
                        data: {
                            layerName: 'Level 2 (Nested)',
                        },
                        children: [
                            {
                                id: 'info-l2',
                                type: 'text',
                                props: { content: '## 2️⃣ 第二层 (Page 2)\nOverride数据: layerName="Level 2", sharedData="L2-Override"' }
                            },
                            // Form 3 (Child of Page 2)
                            {
                                id: 'form3-l2',
                                type: 'form',
                                props: {
                                    layout: 'horizontal',
                                    useContextData: true,
                                    readonly: false,
                                    fields: [
                                        { name: 'layerName', label: '📝 Form3 (L2) - Layer', type: 'text', placeholder: '修改 Layer 2 数据' },
                                        { name: 'sharedData', label: '📝 Form3 (L2) - Shared', type: 'text', placeholder: '修改 Layer 2 共享数据' },
                                        { name: 'rootOnly', label: '📝 Form3 (L2) - Root', type: 'text', placeholder: '修改 Root 数据 (从 L2)' }
                                    ]
                                }
                            },
                            {
                                id: 'page3-l2',
                                type: 'container',
                                children: [
                                    {
                                        id: 'divider-l2',
                                        type: 'text',
                                        props: { content: '---\n👇 **第 三层区域 (Page 2 & Form 2)**' }
                                    },
                                    // Form 2 (Child of Page 1, Sibling of Page 2)
                                    {
                                        id: 'form2-l1',
                                        type: 'form',
                                        props: {
                                            layout: 'horizontal',
                                            useContextData: true,
                                            readonly: false,
                                            fields: [
                                                { name: 'layerName', label: '📝 Form2 (L1) - Layer', type: 'text', placeholder: 'Form 2也可修改' },
                                                { name: 'sharedData', label: '📝 Form2 (L1) - Shared', type: 'text' }
                                            ]
                                        }
                                    },
                                ]
                            },
                            // Button to debug data
                            {
                                id: 'btn-debug-layers',
                                type: 'button',
                                props: {
                                    type: 'primary',
                                    text: '🔍 检查层级数据 (Lookup)',
                                    actionType: 'function',
                                    script: (scope: ScopeService, ctx: ComponentContext) => {
                                        const form3 = ctx.getComponent('form3-l2');
                                        alert(`📊 Form3 数据查找:
                                        
Current Data (Own+Inherited):
${JSON.stringify(form3?.getAllData() || {}, null, 2)}

Lookup Specific Keys:
- layerName: ${form3?.lookupData('layerName')}
- sharedData: ${form3?.lookupData('sharedData')}
- rootOnly: ${form3?.lookupData('rootOnly')}
                                        `);
                                    }
                                }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// Mock Users Data
export const MOCK_USERS = [
    { id: 1, name: '张三', role: '管理员', status: 'active', email: 'zhangsan@example.com' },
    { id: 2, name: '李四', role: '普通用户', status: 'active', email: 'lisi@example.com' },
    { id: 3, name: '王五', role: '普通用户', status: 'inactive', email: 'wangwu@example.com' },
    { id: 4, name: '赵六', role: '访客', status: 'active', email: 'zhaoliu@example.com' },
    { id: 5, name: '孙七', role: '普通用户', status: 'active', email: 'sunqi@example.com' }
];

// Mock Menus Data
export const MOCK_MENUS = [
    {
        level: 1,
        title: 'Dashboard',
        icon: 'dashboard',
        selected: true,
        children: [
            { level: 2, title: '分析页', selected: true },
            { level: 2, title: '监控页', selected: false },
            { level: 2, title: '工作台', selected: false }
        ]
    },
    {
        level: 1,
        title: '表单页',
        icon: 'form',
        selected: false,
        children: [
            { level: 2, title: '基础表单', selected: false },
            { level: 2, title: '分步表单', selected: false },
            { level: 2, title: '高级表单', selected: false }
        ]
    }
];
