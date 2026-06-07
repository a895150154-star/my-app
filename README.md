# FIN AI · 金融研究 Agent

把分析师/助理的「答疑 + 解读 + 找内容」工作 AI 化的金融研究 Agent 产品——让散户对手里的研究服务有掌控感，让公司降本。标的中性（股票 / 现货均适用）。

- **前端框架**：Next.js 16 + React 19 + TypeScript
- **AI 调用**：OpenRouter（兼容 OpenAI SDK）
- **行情数据**：Tushare（A 股）
- **图表**：lightweight-charts

---

## ⚠️ 下载后请先看这里

这是一份**纯源码包**，为了体积，仓库**不包含**以下内容，需要你自己装/配（都是免费、可重建的）：

| 没包含的东西 | 怎么获取 |
|---|---|
| 依赖 `node_modules` | 进 `app` 跑 `npm install`，自动装 |
| 构建缓存 `.next` | 运行时自动生成，无需管 |
| 密钥文件 `.env.local` | 复制 `app/.env.example` 改名为 `.env.local`，填入你自己的 key |

> 🔑 需要你自备两个免费 key：
> - **OpenRouter**（LLM 调用）：https://openrouter.ai
> - **Tushare**（A 股行情）：https://tushare.pro/user/token

---

## 🚀 快速上手

```bash
# 1. 进入应用目录
cd app

# 2. 安装依赖（首次 1-2 分钟）
npm install

# 3. 配置密钥
cp .env.example .env.local
# 然后编辑 .env.local，填入你的 OPENROUTER_API_KEY 和 TUSHARE_TOKEN

# 4. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可。

---

## 📦 环境要求

- Node.js 20+
- 一个 OpenRouter API key（LLM）
- 一个 Tushare token（A 股行情，免费版够用）

---

## 📁 项目结构

```
.
├── app/              主应用（Next.js）
│   ├── src/          源码
│   ├── public/       静态资源
│   └── .env.example  ⭐ 密钥模板（复制为 .env.local 使用）
├── changes/          变更记录
├── PRODUCT-FLOW.md   产品业务流程文档（项目定位与方法论）
├── DESIGN.md         设计规范
├── dogpay-arch.html  架构图
└── fin-ai-arch.html  架构图
```

---

## 📄 更多文档

- 产品流程与定位：[`PRODUCT-FLOW.md`](PRODUCT-FLOW.md)
- 设计规范：[`DESIGN.md`](DESIGN.md)
- 应用说明：[`app/README.md`](app/README.md)

---

## 🔒 安全提示

`.env.local` 含真实密钥，已被 `.gitignore` 排除，**切勿提交**。若 key 泄露，请立即去 OpenRouter / Tushare 后台重置。
