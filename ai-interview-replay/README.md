# Interview Replay - 保研面试复盘工具

面向保研学生的文字版 AI 面试复盘助理。通过"面试前临场模拟"和"面试后多版本复盘"两种模式，帮助学生诊断回答中的表达损失、证据缺失、逻辑漏洞和导师追问风险，并生成下一次可复用的回答策略。

## 技术栈

- **框架**：Next.js 16 (App Router) + TypeScript
- **样式**：Tailwind CSS 4
- **AI 调用**：服务端 API Route → OpenAI 兼容 LLM
- **部署**：Node.js + npm + PM2

## 本地运行

```bash
cd ai-interview-replay
npm install
cp .env.example .env.local
# 编辑 .env.local 填入真实 API Key
npm run dev
```

访问 http://localhost:3000

## 环境变量

在 `.env.local` 中配置，参考 `.env.example`：

| 变量 | 说明 | 示例 |
|------|------|------|
| `LLM_API_KEY` | LLM API 密钥（必填） | `sk-xxx` |
| `LLM_BASE_URL` | LLM API 基础地址 | `https://api.deepseek.com/v1` |
| `LLM_MODEL` | 模型名称 | `deepseek-chat` |
| `PORT` | 服务端口（默认 3000） | `3000` |

> 密钥只在服务端读取，不使用 `NEXT_PUBLIC_` 前缀。

## 生产构建

```bash
npm run build
npm start
```

## 服务器部署

```bash
git clone <repo-url>
cd ai-interview-replay
npm install
cp .env.example .env.local
# 手动填写 .env.local 中的真实密钥
npm run build
npm start
```

### PM2 部署

```bash
pm2 start npm --name interview-replay -- start
pm2 logs interview-replay
pm2 restart interview-replay
pm2 save
```

### 更新代码

```bash
git pull
npm install
npm run build
pm2 restart interview-replay
```

## 公网端口

默认端口 3000，可通过 `PORT` 环境变量修改。确保云服务器安全组或防火墙已开放对应端口。

## 常见问题

**缺少 API Key 报错**：确认 `.env.local` 中已填入 `LLM_API_KEY`。

**构建失败**：检查 Node.js 版本 ≥ 20，运行 `npm install` 确保依赖完整。

**端口被占用**：设置 `PORT=3001` 或其他可用端口。

**AI 返回异常**：检查 `LLM_BASE_URL` 和 `LLM_MODEL` 配置是否正确，确认 API 账户余额充足。
