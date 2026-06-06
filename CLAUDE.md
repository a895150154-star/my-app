# FIN AI · 金融分析智能体

## 项目概述
基于 Agent Loop 架构的金融研究智能体，面向散户提供多步推理、多源数据调用与自主验证的闭环研究能力。核心商业逻辑：将分析师能力 AI 化，实现规模化交付。

## 技术栈
前端框架与具体技术栈在项目启动时确认，本 harness 设计为技术栈无关。

## 开发规范
@.claude/rules/agent-boundary.md
@.claude/rules/coding-style.md
@.claude/rules/git-workflow.md
@.claude/rules/verification.md
@.claude/rules/prompt-engineering.md

## 上下文管理策略
- L1 常驻层（本文件 + rules/）：每次会话自动加载，控制在上下文 40% 以内
- L2 阶段触发层（skills/）：按开发阶段按需加载，用完即释放
- L3 按需查询层（changes/ + 外部文档）：不主动加载，需要时手动查阅

## 四阶段工作流
1. **探索**：Plan Mode 读代码、理解现状，不写代码
2. **计划**：输出方案让我审阅，标注问题后再推进
3. **实现**：按计划编码，每次改动后自动验证
4. **提交**：描述性 commit message + PR

## 关键约束
- 金融数据场景：价格字段用整数（单位为分），禁用浮点
- 任何涉及交易执行的操作必须人工确认，禁止全自动
- AI 输出必须标注置信度，低于阈值标记"仅供参考"
