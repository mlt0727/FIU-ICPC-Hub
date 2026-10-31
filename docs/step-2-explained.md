# 第 2 步（第一部分）：志愿者页面，逐个文件讲解

这一部分做了：Next.js 网站骨架、志愿者个人页、通用首页、cookie 记住身份、每人自己的 manifest（解决 iPhone 主屏幕丢 cookie 的问题）、主屏幕图标。
**还没做**：管理页、推送通知、部署到 Vercel。

## 先理解 Next.js 的两个概念

- **文件夹就是网址。** `app/page.tsx` 是 `/`，`app/[slug]/page.tsx` 是 `/任何名字`。方括号 `[slug]` 表示"这一段是变量"，代码里用 `params` 拿到它的值。`route.ts` 不是页面，而是返回数据（JSON、图片）的接口。
- **服务器组件 vs 浏览器组件。** 默认所有组件都在**服务器**上运行：可以直接查数据库，生成好 HTML 再发给手机。文件第一行写了 `"use client"` 的组件会在**手机浏览器**里运行，可以用定时器、读写 `document.cookie`。这一步只有两个浏览器组件：`task-list.tsx` 和 `remember-me.tsx`。

## 文件一览

| 文件 | 作用 |
|---|---|
| `package.json` | 新增 `next`、`react`、`react-dom` 依赖；新增 `npm run dev`（本地开发）、`build`（打包）、`start` |
| `tsconfig.json` | 第一次 `next build` 时 Next.js 自动补了几项（`jsx`、`plugins` 等），不用手动管 |
| `.claude/launch.json` | 让 Claude 在应用内的浏览器里启动 `npm run dev` 预览 |
| `db/test-lingtong.sql` | 你的测试数据（下面单独讲） |
| `lib/schedule.ts` | 从数据库读一个志愿者和他的所有任务 |
| `lib/time.ts` | 把时间变成 `8:00 AM`、`8:00 – 10:00 AM`、`7 hours` 这种格式 |
| `lib/manifest.ts` | 生成 manifest（主屏幕安装说明） |
| `app/layout.tsx` | 所有页面共用的外壳：字体、标题、图标、iPhone 设置 |
| `app/globals.css` | 全部样式，颜色和 `MASTER.md` 一一对应 |
| `app/[slug]/page.tsx` | 个人页 `/lingtong-meng` |
| `app/page.tsx` | 通用首页 `/` |
| `app/not-found.tsx` | 名字打错时显示的页面 |
| `app/manifest/route.ts` | `/manifest`：参赛者用的 manifest |
| `app/manifest/[slug]/route.ts` | `/manifest/lingtong-meng`：每个志愿者自己的 manifest |
| `app/icons/[size]/route.tsx` | `/icons/180`、`/icons/192`、`/icons/512`：用代码画出来的主屏幕图标 |
| `components/volunteer-view.tsx` | 志愿者区域：名字、到场 / 离场 / 时长，然后是卡片 |
| `components/task-list.tsx` | 卡片列表，自己判断哪张是 Now / Next / Done |
| `components/remember-me.tsx` | 写 cookie |

## 你的测试数据：`db/test-lingtong.sql`

- 新建了任务 **Breakfast Setup**（`duty`），Excel 里没有这个任务。
- 新建了志愿者 **Lingtong Meng**（`lingtong-meng`），8:00 AM 到场，7:00 PM 离场。
- 4 个时段：Breakfast Setup 8:00–11:00 → Orientation 11:00–12:00 → Lunch 12:00–1:30 → Proctors 1:30–7:00。Lunch 和 Proctors 的时间照抄了表里早上那批志愿者的安排。
- 已经通过 Neon 执行过了。**注意**：`npm run db:import -- ... --reset` 会删掉所有时段，包括你的；重新导入以后要再执行一次这个文件。文件开头写了比赛前怎么删掉你。

## `lib/schedule.ts`

`getVolunteer(slug)` 做两次查询：先查这个人，再用 `join` 把他的时段和任务名、地点一起查出来，按开始时间排序。找不到人就返回 `null`，页面会显示 404。
时间统一转成 ISO 字符串（`2026-11-07T13:00:00.000Z`），因为它要原样传到手机浏览器里去比较。

## `lib/time.ts`

- `Intl.DateTimeFormat` 是浏览器和 Node 自带的格式化工具，`timeZone: "America/New_York"` 让它总是按纽约时间显示。所以就算手机设在别的时区，看到的也是现场时间。
- `formatRange`：两端都是 AM（或都是 PM）就只在后面写一次，比如 `8:00 – 10:00 AM`；跨中午就两边都写：`11:00 AM – 12:00 PM`。
- 这些格式化都在**服务器**上做，所以手机上不用算时区。

## `components/task-list.tsx`（在手机上运行）

- 每张卡片三行：时间、任务名、地点。地点还空着的时候显示 "Location coming soon"。
- 状态判断：现在 ≥ 结束时间 → **Done**（文字变暗）；开始 ≤ 现在 < 结束 → **Now**（琥珀色描边）；还没开始的第一张 → 加 **Next**。
- `useState(serverNow)`：第一次显示用服务器的时间，保证手机上的第一屏和服务器生成的 HTML 一模一样（不然 React 会报"不一致"）。然后 `useEffect` 换成手机的时间，**每 30 秒更新一次**，不用刷新页面，描边就会自己移到下一张卡片。
- **测试用的 `?now=`**：网址后面加 `?now=2026-11-07T10:20-05:00`，就把时钟固定在比赛日的上午 10:20，可以提前看到 Now / Done 的效果。`-05:00` 表示纽约时间。

## `components/remember-me.tsx` 和 cookie

打开个人页时，它在手机上写一个 cookie：`volunteer=lingtong-meng`，有效期 60 天。以后再打开通用首页 `/`，服务器读到这个 cookie，就会在最上面显示你的名字和卡片。参赛者从来不打开个人链接，所以永远不会有这个 cookie。

- 用的是"打开谁的链接就记住谁"。**你自己测试时如果打开了别人的链接，cookie 会变成那个人。**
- `secure` 只在 https 下加（本地是 http，加了反而写不进去）。

## manifest 和 iPhone 主屏幕（这一步最关键的部分）

- **manifest** 是一个 JSON，告诉手机"添加到主屏幕"后叫什么名字、用什么图标、点开时打开哪个网址。
- `/lingtong-meng` 页面的 `generateMetadata` 会在网页 `<head>` 里放 `<link rel="manifest" href="/manifest/lingtong-meng">`。这个 manifest 里 `start_url` 是 `/lingtong-meng`，所以从这页添加到主屏幕，**点图标永远打开你自己的页面**。页面一打开，`remember-me` 就会在主屏幕 app 自己的 cookie 里再写一次。这样就算 iPhone 不把 Safari 的 cookie 带过来，也没关系。
- 主屏幕图标下面的名字来自两处：manifest 里的 `name` / `short_name`，以及 iPhone 专用的 `apple-mobile-web-app-title` 标签（在 `layout.tsx` 里设置）。两处都读 `lib/manifest.ts` 里的 `APP_NAME`（"FIU ICPC Hub"），改一处就全改了。已经添加过的图标不会自动改名，要删掉重新添加。
- `id` 每人不同，所以两个人用同一台手机，也会装成两个不同的 app。`scope: "/"` 让点到网站里其他页面时还留在 app 里。
- 通用首页也做了一个保护：如果你有 cookie、却从 `/` 添加到主屏幕，`/` 也会给你挂上你自己的 manifest。
- `layout.tsx` 里的 `appleWebApp` 会生成 iPhone 专用的标签：可以全屏打开，状态栏透明。`viewportFit: "cover"` 让深色背景铺到刘海下面，`globals.css` 里的 `env(safe-area-inset-*)` 再把文字往里推，不会被刘海挡住。顶部是"状态栏高度 + 20px"：只留状态栏的高度时，第一行字正好贴在 iPhone 状态栏下面，被模糊效果盖住了（真机测试时发现的）。

## `app/icons/[size]/route.tsx`

iPhone 的主屏幕图标必须是 PNG。我没有放图片文件，而是用 Next.js 自带的 `ImageResponse` 现场"画"一张：深蓝底，上面是大号琥珀色 "FIU"，中间一条线，下面是 "ICPC"。这是**临时的纯文字版**，等拿到 FIU 和 ICPC 的官方 logo 文件再换成真 logo。只允许 180 / 192 / 512 三种尺寸，其他尺寸返回 404。以后想换图标，改这个文件就行。

## 安全方面

- 所有 SQL 都用 `${}` 传参数，和第 1 步一样，没有 SQL 注入风险。
- `/manifest/[slug]` 只接受小写字母、数字和 `-`，其他输入直接 404。

## 怎么在自己电脑上看

```bash
npm run dev
```

然后打开：
- http://localhost:3000/lingtong-meng —— 你的个人页（会顺便写 cookie）
- http://localhost:3000/lingtong-meng?now=2026-11-07T14:00-05:00 —— 假装现在是下午 2 点：前三张 Done，Proctors 是 Now
- http://localhost:3000/ —— 通用首页，有 cookie 就会显示你的卡片

## 已经检查过的

`npm run build` 和 `npm run typecheck` 都通过了。我在应用内的浏览器里看过手机宽度（375px）和电脑宽度，具体包括：
- 个人页、Now / Next / Done 三种状态
- 有 cookie 和没有 cookie 时的首页
- 技术组页面
- 名字打错时的 404 页面
- 两个 manifest 的内容、图标

**还没在真 iPhone 上测过**，因为要先部署到 https 的网址才能测。
