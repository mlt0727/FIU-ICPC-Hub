# FIU ICPC Hub：项目总览（主文档）

这是整个项目的入口。先看这一篇，了解每一块是干什么的；想看某个文件的细节，点下面的子文档。

网址：https://fiu-icpc-hub.vercel.app · 比赛日：2026-11-07（纽约时间）

## 子文档目录

| 文档 | 内容 |
|---|---|
| [step-1-explained.md](step-1-explained.md) | 数据库的 5 张表、Excel 导入、`data/` 里的修正规则 |
| [step-2-explained.md](step-2-explained.md) | 志愿者个人页、cookie、主屏幕 manifest 和图标、导出链接、地点、地图、任务说明 |
| [step-3-explained.md](step-3-explained.md) | 主页面 `/`：当天时间表、地图、午饭路线、两个标签 |
| [step-4-explained.md](step-4-explained.md) | 推送通知：service worker、订阅、测试通知、任务前提醒 |
| [admin-explained.md](admin-explained.md) | 管理页 `/admin`：登录、公告、改地点和时段、加人、总览表 |
| [task-instructions-draft.md](task-instructions-draft.md) | 各任务说明的草稿（英文 + 中文，等确认） |
| [../design-system/icpc-checkpoint/MASTER.md](../design-system/icpc-checkpoint/MASTER.md) | 设计规范：颜色、字体、卡片样式 |
| [../CLAUDE.md](../CLAUDE.md) | 交接说明：进度、待办、规则、部署信息 |

## 整体是怎么连起来的

```
Excel 名单 ──(npm run db:import)──▶ Neon 数据库 ◀──(管理页 /admin 修改)
                                      │
                                      ▼
             Vercel 上的 Next.js 网站（服务器查数据库，生成网页）
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
    主页面 /（所有人）       个人页 /名字（志愿者）       推送通知（手机）
                                                                 ▲
                         cron-job.org 每分钟调用一次 ─────────────┘
                         /api/cron/reminders（任务前 10 分钟提醒）
```

**一次打开个人页的过程**（例如 `/lingtong-meng`）：

1. 手机请求网址，Vercel 运行 `app/[slug]/page.tsx`。
2. 它调用 `lib/schedule.ts` 查数据库，拿到这个人和他的时段。
3. `components/volunteer-view.tsx` 把名字、到场 / 离场时间和卡片拼成网页，并在最前面加一张按到场时间生成的 **Check in**（PG6 112）卡片。时间格式由 `lib/time.ts` 负责。
4. 网页到了手机上：
   - `task-list.tsx` 用手机的时钟判断哪张卡片是 Now / Next / Done；
   - `remember-me.tsx` 写 cookie，记住这个人；
   - `notify-button.tsx` 显示开通知的按钮。

## 每个文件夹里有什么

### `app/`：网址和接口（Next.js 规定：文件夹路径就是网址）

| 文件 | 网址 | 作用 | 详见 |
|---|---|---|---|
| `layout.tsx` | 所有页面 | 共用外壳：字体、标题、iPhone 设置 | step-2 |
| `globals.css` | — | 全部样式，颜色和设计规范一致 | step-2 |
| `page.tsx` | `/` | 主页面：时间表、地图、午饭，所有人看到的都一样 | step-3 |
| `[slug]/page.tsx` | `/名字` | 志愿者个人页 | step-2 |
| `not-found.tsx` | 打错的网址 | "找不到页面" | step-2 |
| `manifest/route.ts`、`manifest/[slug]/route.ts` | `/manifest`、`/manifest/名字` | 添加到主屏幕用的说明，每人一份 | step-2 |
| `icons/[size]/route.tsx` | `/icons/180` 等 | 用代码画出主屏幕图标 | step-2 |
| `api/push/subscribe/route.ts` | `/api/push/subscribe` | 保存"这台手机要通知" | step-4 |
| `api/push/test/route.ts` | `/api/push/test` | 给自己发一条测试通知 | step-4 |
| `api/cron/reminders/route.ts` | `/api/cron/reminders` | 每分钟被调用，发任务前提醒（要密码） | step-4 |
| `admin/page.tsx` | `/admin` | 管理页首页：登录、公告、任务地点 | admin |
| `admin/[slug]/page.tsx` | `/admin/名字` | 改某个人的时段和到场 / 离场 | admin |
| `admin/overview/page.tsx` | `/admin/overview` | 全部数据，按任务和按人两种排法 | admin |
| `admin/actions.ts` | — | 管理页所有"保存"按钮背后在服务器上运行的代码 | admin |

### `components/`：页面上的零件

| 文件 | 作用 | 详见 |
|---|---|---|
| `volunteer-view.tsx` | 志愿者区域：名字、时长、提醒框、卡片 | step-2 |
| `task-list.tsx` | 任务卡片；在手机上判断 Now / Next / Done，并显示地图和说明的下拉框 | step-2 |
| `remember-me.tsx` | 打开个人页时写 cookie | step-2 |
| `room-map.tsx` | PG6 平面图，高亮某个房间 | step-2 |
| `instructions.tsx` | 显示任务说明（标题、步骤、要点） | step-2 |
| `volunteer-nav.tsx` | 志愿者才看得到的两个标签：My schedule / Contest day | step-3 |
| `notify-button.tsx` | "Turn on reminders" 按钮和它的各种状态 | step-4 |
| `announcements.tsx` | 页面顶部的最新公告 | admin |
| `auto-refresh.tsx` | 每分钟自动刷新页面，公告和改动不用手动刷新 | admin |
| `admin-forms.tsx` | 管理页按钮的 "Saving…" 状态和提示信息 | admin |

### `lib/`：不显示在页面上的共用代码

| 文件 | 作用 | 详见 |
|---|---|---|
| `db.ts` | 连接数据库，全项目只有这一个地方 | step-1 |
| `slug.ts` | 名字 → 网址（`Isabel González Lopez` → `isabel-gonzalez-lopez`） | step-1 |
| `schedule.ts` | 查一个志愿者和他的所有时段 | step-2 |
| `time.ts` | 时间格式（`8:00 AM`）、纽约时区换算、提前几分钟提醒 | step-2 |
| `manifest.ts` | 生成 manifest；App 名字 `APP_NAME` 在这里 | step-2 |
| `rooms.ts` | 平面图上每个房间的位置，以及地点文字 → 房间 | step-2 |
| `instructions.ts` | 把说明文字解析成标题、列表 | step-2 |
| `event.ts` | 读取主页面的当天时间表 | step-3 |
| `push.ts` | 发一条推送 | step-4 |
| `push-subscription.ts` | 检查手机发来的订阅数据 | step-4 |
| `admin-auth.ts` | 管理员密码登录和 cookie 签名 | admin |

### `data/`：手动填写的资料

| 文件 | 作用 | 改完以后 |
|---|---|---|
| `task-details.json` | 每个任务的地点、说明，以及按人分配的地点 | `npm run db:details` |
| `instructions/*.md` | 较长的任务说明原文 | `npm run db:details` |
| `event-schedule.json` | 主页面的当天时间表 | 要 push |
| `corrections.json` | Excel 里已知错误的修正 | 重新导入时生效 |
| `all-hands.json` | Orientation 全员参加的规则 | 重新导入时生效 |

### `db/`：数据库

| 文件 | 作用 |
|---|---|
| `schema.sql` | 表结构：`volunteers`、`tasks`、`shifts`、`announcements`、`push_subscriptions` |
| `extra-volunteers.sql` | Excel 以外后加的人（Talin Malki） |
| `test-lingtong.sql` | Lingtong 的测试账号 |

### `scripts/`：在自己电脑上运行的命令

| 命令 | 文件 | 作用 |
|---|---|---|
| `npm run db:migrate` | `migrate.ts` | 建表（可以重复运行） |
| `npm run db:import -- "文件.xlsx" [--reset]` | `import-excel.ts` | 导入 Excel 名单 |
| `npm run db:details` | `apply-task-details.ts` | 把 `task-details.json` 写进数据库 |
| `npm run links` | `export-links.ts` | 导出所有人的个人链接到 `volunteer-links.csv` |
| `npx tsx scripts/check-*.ts` | `check-time` / `check-rooms` / `check-instructions` / `check-push-subscription` | 自测：改了对应的代码以后跑一下，看有没有改坏 |

### 其他

| 文件 | 作用 |
|---|---|
| `public/sw.js` | service worker：在手机后台接收推送、弹出通知 |
| `public/pg6-map.webp` | PG6 平面图 |
| `public/seating-116.webp` | 116 房间座位表（每张桌子的学校、D1/D2、队名），主页面 "Seating in Room 116" 用 |
| `proxy.ts` | `/admin?key=密码`：点一下就登录管理页 |
| `README.md` | 英文的项目介绍：为什么做、做了什么、怎么运行（GitHub 首页显示的就是它） |
| `.env.local` | 真实的密钥和密码（不进 git）；`.env.example` 是空模板 |
| `.claude/skills/` | ui-ux-pro-max 设计 skill 的本地副本（不进 git；全局那份在 `~/.claude/skills/`） |
| `AGENTS.md` | 给 AI 的提醒：这是新版 Next.js，写代码前要先看文档 |
| `package.json` | 依赖和上面那些 `npm run` 命令 |

## 外部服务

| 服务 | 用来做什么 |
|---|---|
| **Neon**（项目 academy → 数据库 `icpc_day`） | 存所有数据 |
| **Vercel**（项目 `fiu-icpc-hub`） | 运行网站；push 到 GitHub `main` 就会自动部署。环境变量：`DATABASE_URL`、`EVENT_DATE`、`EVENT_TZ`、`VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`CRON_SECRET`、`ADMIN_PASSWORD` |
| **GitHub**（`mlt0727/FIU-ICPC-Hub`） | 存代码 |
| **cron-job.org** | 比赛当天每分钟调用一次 `/api/cron/reminders` |
| **Apple / Google 推送服务** | 把通知送到手机上 |

## 常见操作速查

| 想做的事 | 怎么做 |
|---|---|
| 发公告 | `/admin` → 公告 |
| 改某个任务的地点 | `/admin`，或者改 `task-details.json` 后运行 `npm run db:details` |
| 改某个人的时段 / 加人 | `/admin/名字`，或者在 `/admin` 里加人 |
| 看全部安排 | `/admin/overview` |
| 改主页面时间表 | 改 `data/event-schedule.json` → push |
| 预览比赛日某个时刻 | 网址后面加 `?now=2026-11-07T14:00-05:00` |
| 重新导出链接 | `npm run links`（先关掉 Excel 里打开的 CSV） |
