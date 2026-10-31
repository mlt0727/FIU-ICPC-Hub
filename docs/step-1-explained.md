# 第 1 步：数据库和 Excel 导入，逐个文件讲解

这一步还没有网页，只做两件事：**在 Neon 里建表**，**把 Excel 里的人和任务导进去**。

## 文件一览

| 文件 | 作用 |
|---|---|
| `package.json` | 项目依赖和命令。`npm run db:migrate` 建表，`npm run db:import` 导入 Excel。 |
| `tsconfig.json` | TypeScript 设置。`strict: true` 让类型检查更严格；`paths` 让以后可以写 `@/lib/db`。 |
| `.env.example` | 环境变量模板。复制成 `.env.local` 再填真实值，`.env.local` 不进 git（里面有数据库密码）。 |
| `.gitignore` | 不进 git 的东西：`node_modules`、`.env.local`，以及所有 `.xlsx`（名单不放进仓库）。 |
| `lib/db.ts` | 全项目唯一连接数据库的地方，导出 `sql`。 |
| `lib/slug.ts` | 把名字变成网址：`Isabel González Lopez` → `isabel-gonzalez-lopez`。 |
| `db/schema.sql` | 5 张表的定义。 |
| `scripts/migrate.ts` | 读 `schema.sql`，一条一条执行。 |
| `scripts/import-excel.ts` | 读 Excel，检查数据，写进数据库。 |
| `data/task-details.json` | **你来填**：每个任务的地点和说明。 |
| `data/corrections.json` | Excel 里已知错误的修正：Shirina 8:00 到场；Lyna 的 Move people into 116 改成 10:00-11:00。 |
| `data/all-hands.json` | 全员活动的规则：Orientation 11:00-12:00，12:00 前到场的普通志愿者都参加（技术组不算）。 |

## 依赖为什么选这几个

- `@neondatabase/serverless`：Neon 官方驱动，走 HTTPS，所以在 Vercel 上也能用。
- `exceljs`：读 `.xlsx`。没选 `xlsx`（SheetJS），因为它在 npm 上的版本已经不更新了。
- `tsx`：直接运行 `.ts` 文件，不用先编译。`--env-file=.env.local` 是 Node 自带的读取环境变量的功能。
- `typescript` 固定在 5.x：Next.js 目前按 5.x 测试，7.x 太新。

## 数据库的 5 张表（`db/schema.sql`）

```
volunteers ──< shifts >── tasks
    │
    └──< push_subscriptions        announcements（独立）
```

- **volunteers**：一个人一行。`slug` 是网址里的名字，`unique` 保证不重复。`team` 只能是 `general` 或 `tech`。`arrive_at` / `leave_at` 是到场和离场时间。
- **tasks**：一种工作一行。`kind` 是 `duty`（干活）、`break`（Lunch、Dinner）或 `meeting`（Orientation），以后卡片可以显示成不同样式。允许的值写在 `alter table ... add constraint` 里，放在建表语句外面，这样对已经存在的数据库也能修改。`location` 和 `instructions` 是所有做这个任务的人都会看到的地点和说明。
- **shifts**：最核心的表，意思是"某人在某个时间段做某个任务"。`references ... on delete cascade` 表示删掉一个人时，他的时段也一起删掉。`check (ends_at > starts_at)` 不允许结束时间早于开始时间。两个 `index` 让"查某人的全部时段"和"查接下来要开始的时段"（第 4 步推送用）更快。
- **announcements**：你当天发的公告。
- **push_subscriptions**：第 4 步用，每台同意接收通知的手机一行。

**为什么用 `timestamptz`（带时区的时间）？** 推送提醒要和"现在"比较，服务器在 UTC，手机在本地时区。存成精确的时刻，就不会差几个小时。Excel 里的 `8:00` 会被当作 2026-11-07 纽约时间的 8:00 存进去，也就是 UTC 13:00（11 月 1 日夏令时已经结束）。

## `scripts/migrate.ts`

1. 读 `db/schema.sql`。
2. 按"行尾的 `;`"切成一条条语句，去掉 `--` 注释。
3. 用 `sql.query()` 逐条执行。Neon 的 HTTP 驱动一次只能跑一条，所以要拆开。

所有语句都写了 `if not exists`，所以重复运行也不会出错。

## `scripts/import-excel.ts`，分三段

**① 读 Excel**
- `Availability` 表：A 列是名字、B 列是到达时间的行，才算一个人。下面的颜色图例那几行（Registration、Photography……）B 列是空的，所以会被跳过。
- `Tech team` 表：同样的读法，`team = 'tech'`。
- `Volunteers by Task` 表：只要 C 列像 `8:00-11:00` 的行，所以 `Registration: 7 人` 这种计数行和空行会被跳过。
- `cellTime()`：Excel 把"8:00"存成 1899-12-30 08:00 的日期，这里只取出 `"08:00"`。
- `taskName()`：全大写的 `LUNCH` 变成 `Lunch`，其他名字保持原样。

**①½ 应用修正和全员活动**
- `corrections.json` 里的每条修正都必须在 Excel 里找到对应的数据，找不到就报 Problem。这样如果以后 Excel 改了，修正不会悄悄失效。
- `all-hands.json` 按规则给每个符合条件的人加上 Orientation。`"10:00" < "12:00"` 这种比较之所以能直接用字符串，是因为时间都补齐成了两位数的 `HH:MM`。
- Orientation 的 `kind` 是 `meeting`，以后卡片会显示成"全员活动"的样式。

**② 写数据库之前先检查**
- **Problems**（会中止导入）：任务表里出现名单里没有的人；两个人生成了同一个网址。
- **Warnings**（照样导入，只是提醒你）：任务超出这个人的可用时间、到场期间有空档、任务时间重叠、某人没有任何任务。技术组不做这些检查，因为他们有自己的安排。修正之后，现在的数据**没有任何警告**。

**③ 写入**
- 已经有时段数据时，不加 `--reset` 就拒绝运行，防止误删你在管理页上做的修改。
- `sql.transaction([...])`：所有语句要么全部成功，要么全部不执行，不会只导入一半。
- 人用 `on conflict (slug) do update`：已存在就更新，不存在就新建，所以重新导入不会出现重复的人。
- 任务的地点和说明用 `coalesce`：JSON 里留空的话，**不会覆盖**你以后在管理页上填的内容。
- `at(time)` 把 `"08:00"` 变成 `('2026-11-07'::date + '08:00'::time) at time zone 'America/New_York'`，由数据库来算准确时刻。
- 所有值都通过 `${}` 传进去，驱动会把它们作为参数发送，不会拼进 SQL 字符串，所以没有 SQL 注入的风险。

## 怎么在你自己电脑上跑

```bash
npm install
cp .env.example .env.local     # 填入 DATABASE_URL（Neon 控制台 → academy → icpc_day → Connect）
npm run db:migrate
npm run db:import -- "Final Volunteer_Availability.xlsx"            # 第一次
npm run db:import -- "Final Volunteer_Availability.xlsx" --reset    # 以后再导入
```

> 说明：我这边的云端环境不允许直接连 Neon 的地址，所以这次是先让脚本**完整跑一遍、把它要发的 SQL 截下来**，再通过 Neon 的管理接口执行。脚本本身没有改动，你在自己电脑上可以直接跑。
