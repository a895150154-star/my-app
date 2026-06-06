# 验证闭环规范

## 核心原则
IMPORTANT: 每次代码变更后必须验证，不能只看 diff 就宣布完成。

## 验证层级

### 1. 自动验证（Hook 执行，零例外）
- 文件保存后自动运行 linter + formatter
- 提交前自动运行 type-check
- 提交前自动运行受影响的测试

### 2. UI 验证（前端变更必做）
- 启动 dev server（preview_start）
- 检查控制台无报错（preview_console_logs）
- 截图确认 UI 符合预期（preview_screenshot）
- 测试关键交互路径（preview_click / preview_fill）
- 检查响应式：至少验证 mobile + desktop 两个断点

### 3. 功能验证（后端/逻辑变更必做）
- 运行单元测试，确认通过
- 运行集成测试（如有）
- 验证 API 响应格式与类型定义一致

## 质量门禁（可程序化验证）
通过标准不能是模糊描述，必须是可验证条件：
- lint: `exit code == 0`
- type-check: `exit code == 0`
- test: `status == PASS && total_tests > 0 && failed == 0`
- build: `exit code == 0`

## 验证失败处理
1. 分析错误原因，不要盲目重试
2. 修复后重新验证
3. 如果 2 轮修复仍未通过，暂停并向用户报告
