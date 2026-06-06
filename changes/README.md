# 变更管理目录

每个需求/功能创建独立的变更目录，格式如下：

```
{类型}-{功能名}-{YYYYMMDD}/
├── spec.md              # 需求规格（问题、方案、验收标准）
├── tasks.md             # 任务拆解清单
├── summary.md           # 执行状态追踪（Single Source of Truth）
├── plan_review_v1.md    # 方案评审记录（版本递增，旧版不删）
├── code_review_v1.md    # 代码评审记录
└── changes/             # 代码变更明细
```

类型：feat / fix / refactor / hotfix

规则：
- summary.md 是唯一的状态真相源，每完成一个阶段必须更新
- 评审记录版本递增，旧版本永不删除
- 每条变更记录可追溯到原始需求
