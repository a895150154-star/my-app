# Git 工作流

## 分支策略
- `main`：生产分支，只接受 PR 合并
- `dev`：开发分支，日常开发基于此分支
- `feature/xxx`：功能分支，从 dev 切出
- `fix/xxx`：修复分支，从 dev 切出
- `hotfix/xxx`：紧急修复，从 main 切出

## Commit 规范
格式：`<type>: <description>`

类型：
- `feat`：新功能
- `fix`：Bug 修复
- `refactor`：重构（不改变功能）
- `style`：样式调整（不影响逻辑）
- `docs`：文档更新
- `test`：测试相关
- `chore`：构建/工具链变更

示例：`feat: 添加行情分析 Agent 的多源数据聚合能力`

## PR 规范
- 标题简洁，< 70 字符
- Body 包含：Summary（要点）+ Test Plan（验证步骤）
- 单个 PR 聚焦一个功能或修复，不混合无关变更
- 提交前确保 lint + type-check + 测试全部通过

## 禁止操作
- 禁止 force push 到 main/dev
- 禁止直接 commit 到 main
- 禁止提交 .env、密钥、凭证文件
