# 邻里AI V17.0

> 微信小程序 + Node.js 后端的本地生活AI营销平台

## 项目结构

```
邻里AI_V17.0/
├── client/                     ← 微信小程序前端
│   └── miniprogram/
│       ├── pages/              ← 页面（10个）
│       ├── components/          ← 组件
│       ├── utils/              ← 工具函数
│       └── static/             ← 静态资源
│
├── server/                     ← Node.js 后端
│   ├── src/
│   │   ├── app.ts              ← 入口
│   │   ├── core/               ← 基础设施（配置/数据库/Redis/队列）
│   │   ├── modules/            ← 业务模块（8个）
│   │   └── api/                ← API路由
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── schema/                 ← 建表SQL
│       ├── 01_init.sql         ← 核心表（商家/内容/画像）
│       ├── 02_marketing.sql    ← 营销表
│       └── 03_system.sql       ← 系统表
│
├── docs/                       ← 开发文档
└── scripts/                    ← 部署脚本
```

## 快速开始

### 1. 环境要求
- Node.js >= 18
- MySQL 8.0
- Redis 7.0
- FFmpeg（视频处理）
- 微信开发者工具

### 2. 后端启动
```bash
cd server

# 安装依赖
npm install

# 复制环境配置
copy .env.example .env
# 编辑 .env 填写实际配置

# 开发模式
npm run dev

# 生产模式
npm run build && npm start
```

### 3. 数据库初始化
```bash
# 登录MySQL
mysql -u root -p

# 执行建表脚本
source database/schema/01_init.sql;
source database/schema/02_marketing.sql;
source database/schema/03_system.sql;
```

### 4. 小程序导入
1. 打开微信开发者工具
2. 新建项目 → 导入 `client/` 目录
3. 填入 AppID
4. 安装 Vant Weapp 组件（参考下方）

### 5. 安装Vant Weapp组件
```bash
cd client
npm init -y
npm install @vant/weapp
# 在微信开发者工具中：工具 → 构建npm
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序 + Vant Weapp + TypeScript |
| 后端 | Node.js + Koa + TypeScript |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis |
| AI | DeepSeek API |
| 视频 | FFmpeg |
| 存储 | 腾讯云COS |

## 开发阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| 阶段1 | 基础架构（目录/脚手架/数据库） | ✅ Day1完成 |
| 阶段2 | 核心引擎（FFmpeg+AI+GEO） | ⏳ 待开始 |
| 阶段3 | 业务功能（用户/商家/营销/支付） | ⏳ 待开始 |
| 阶段4 | Admin后台+优化 | ⏳ 待开始 |

## API文档

启动后访问：`http://localhost:3000/api/v1/health`

| 模块 | 路由前缀 | 说明 |
|------|---------|------|
| 健康检查 | /api/v1/health | 服务状态 |
| 用户 | /api/v1/user | 注册/登录/会员 |
| 商家 | /api/v1/merchant | 商家入驻/画像 |
| AI | /api/v1/ai | 文案生成/优化 |
| 内容 | /api/v1/content | 内容管理 |
| 营销 | /api/v1/marketing | 砍价/拼团/秒杀 |
| 支付 | /api/v1/payment | 订单/支付 |
| GEO | /api/v1/geo | 位置注入 |
| 视频 | /api/v1/video | 视频处理 |
| 分发 | /api/v1/distribution | 内容分发 |
| Admin | /api/v1/admin | 后台管理 |

## 注意事项

1. **API密钥** - 请在 `.env` 中填写真实密钥
2. **微信配置** - AppID、支付商户号需在微信公众平台申请
3. **GEO注入** - 需要腾讯位置服务支持
4. **视频存储** - 需要腾讯云COS配置

## 团队分工

| 角色 | 负责 |
|------|------|
| Echo（AI助手） | 架构设计 + 代码开发 |
| 峰哥（你） | 产品验收 + UI设计 + 运营 |

---

_最后更新：2026-04-16_
