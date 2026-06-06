# 编码规范

## 通用规则
- 使用 ES Modules（import/export），不用 CommonJS（require）
- 优先解构导入：`import { foo } from 'bar'`
- 变量命名：camelCase，组件命名：PascalCase，常量：UPPER_SNAKE_CASE
- 文件命名：组件用 PascalCase，工具函数用 kebab-case
- 单文件不超过 300 行，超过则拆分

## TypeScript 优先
- 所有新文件使用 TypeScript
- 禁止 `any` 类型，必须显式定义接口
- API 响应必须定义 Response 类型

## 样式规范
- 使用 Tailwind CSS utility classes 优先
- 复杂组件样式允许 CSS Modules
- 响应式设计：mobile-first，必须适配 3 种断点（sm/md/lg）
- 间距使用设计系统 token，不硬编码像素值

## 前端 UI 术语约定（与 AI 沟通时使用）
- 页面顶部大图区域 → Hero Section
- 内边距 → padding，外边距 → margin
- 子元素间距 → gap（Flex/Grid 布局）
- 圆角 → border-radius
- 弹性布局 → Flexbox，网格布局 → CSS Grid
- 毛玻璃效果 → backdrop-filter: blur()
- 渐变 → gradient（linear-gradient / radial-gradient）
- 卡片 → Card，弹窗 → Modal/Dialog，抽屉 → Drawer
- 骨架屏 → Skeleton，加载指示器 → Spinner
- 导航栏 → Navbar，侧边栏 → Sidebar，面包屑 → Breadcrumb
