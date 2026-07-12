# luckytask-be

任务管理系统后端，基于 Nest.js + TypeORM + MySQL。

## 技术栈

| 类别   | 选型                                | 说明                |
| ------ | ----------------------------------- | ------------------- |
| 框架   | Nest.js 11                          | 模块化 Node.js 框架 |
| 语言   | TypeScript                          | 全栈统一            |
| ORM    | TypeORM                             | MySQL 映射          |
| 数据库 | MySQL 8.0                           | 关系型              |
| 认证   | passport + passport-jwt             | JWT 无状态认证      |
| 密码   | bcrypt                              | 哈希加密            |
| 校验   | class-validator + class-transformer | DTO 自动校验        |
| 包管理 | pnpm                                | 严格的依赖隔离      |

## 本地启动

### 1. 创建数据库

```sql
CREATE DATABASE luckytask CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 配置环境变量

编辑 `.env`：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=luckytask
JWT_SECRET=your-secret-key
```

### 3. 启动

```bash
# 安装依赖
pnpm install

# pnpm 首次需要批准 bcrypt 的构建脚本
pnpm approve-builds

# 开发模式（热重载）
pnpm run start:dev
# → http://localhost:3000
```

> `synchronize: true` 会在开发环境自动同步表结构，无需手动建表。

## API 概览

Base: `http://localhost:3000/api/v1`

### 认证

| 方法 | 路径           | 说明                                  |
| ---- | -------------- | ------------------------------------- |
| POST | /auth/register | 注册 `{username, password, nickname}` |
| POST | /auth/login    | 登录 `{username, password}`           |
| GET  | /auth/me       | 当前用户信息（需 Token）              |

### 任务

| 方法   | 路径             | 说明                                   |
| ------ | ---------------- | -------------------------------------- |
| GET    | /tasks           | 任务列表 `?status=&priority=&keyword=` |
| GET    | /tasks/:id       | 任务详情（含待办 + 进度统计）          |
| POST   | /tasks           | 创建任务                               |
| PATCH  | /tasks/:id       | 编辑任务                               |
| DELETE | /tasks/:id       | 删除任务（级联删除待办）               |
| GET    | /tasks/:id/stats | 任务统计                               |

### 待办

| 方法   | 路径       | 说明                         |
| ------ | ---------- | ---------------------------- |
| GET    | /todos     | 待办列表 `?task_id=&status=` |
| GET    | /todos/:id | 待办详情                     |
| POST   | /todos     | 创建待办                     |
| PATCH  | /todos/:id | 编辑待办（含勾选完成）       |
| DELETE | /todos/:id | 删除待办                     |

## 项目结构

```
src/
├── main.ts                  # 入口（CORS + 启动）
├── app.module.ts            # 主模块
├── auth/                    # 认证模块
│   ├── user.entity.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── tasks/                   # 任务模块
│   ├── task.entity.ts
│   ├── tasks.service.ts
│   └── tasks.controller.ts
└── todos/                   # 待办模块
    ├── todo.entity.ts
    ├── todos.service.ts
    └── todos.controller.ts
```

## 构建部署

```bash
pnpm run build          # 输出到 dist/
pnpm run start:prod     # 生产模式启动
```

## 端口释放

```bash
lsof -ti:3000 | xargs kill -9
```
