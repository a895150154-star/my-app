---
name: coding
description: 编码实现阶段的标准化流程，确保代码质量和可验证性
---

# 编码实现流程

进入编码阶段前，必须已有经用户确认的 spec.md 和 tasks.md。

## Step 1：阅读规范
开始编码前，先读取以下文件：
- `.claude/rules/coding-style.md`
- `.claude/rules/verification.md`
- 当前任务的 `spec.md` 和 `tasks.md`

## Step 2：逐任务实现
按 tasks.md 中的任务顺序逐个实现：
- 每完成一个任务，立即运行验证（lint + type-check + test）
- 验证通过后更新 tasks.md 状态
- 验证失败则修复，2 轮修复不通过则暂停汇报

## Step 3：前端变更的 UI 验证
如果涉及 UI 变更，必须：
1. 启动 dev server
2. 截图对比预期效果
3. 测试关键交互路径
4. 检查控制台无报错
5. 验证响应式适配

## Step 4：更新变更记录
在 `changes/` 对应目录的 `summary.md` 中记录：
- 完成的任务项
- 修改的文件列表
- 遇到的问题与解决方案
- 当前状态（进行中/已完成/阻塞）
