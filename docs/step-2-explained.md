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

## 导出所有志愿者的链接：`scripts/export-links.ts`

运行 `npm run links`，会在项目根目录生成 `volunteer-links.csv`，每个志愿者一行，五列：名字、组别（`general` / `tech`）、个人链接、到场、离场。可以直接用 Excel 打开，复制链接发给每个人。

- 数据直接从数据库读，所以以后名单改了（重新导入 Excel 或在管理页改），再运行一次就是最新的。
- 网址默认是 `https://fiu-icpc-hub.vercel.app`。以后换域名，在 `.env.local` 里加一行 `SITE_URL=新网址` 就行。
- 每一格都加了双引号，名字里有逗号也不会被拆成两列。
- 文件开头加了一个看不见的 BOM 字符（`﻿`），告诉 Excel "这是 UTF-8"。不加的话，`González` 在 Excel 里会变成乱码。
- **这个 CSV 不进 git**（`.gitignore` 里加了 `volunteer-links.csv`），因为里面是名单，和 Excel 文件的规则一样。
- 时间格式复用了 `lib/time.ts` 的 `formatTime`，和网页上显示的一模一样。

## 地点和地图（"Show on map"）

| 文件 | 作用 |
|---|---|
| `public/pg6-map.webp` | Lingtong 给的 PG6 平面图（1578 × 996 像素） |
| `lib/rooms.ts` | 地图上每个房间的轮廓坐标，以及 `roomsIn()`：从地点文字里找出提到了哪些房间 |
| `components/room-map.tsx` | 显示平面图，把指定的房间用琥珀色框出来 |
| `components/task-list.tsx` | 卡片上加了 "Show on map"，点开就在卡片里显示地图 |
| `components/volunteer-view.tsx` | 给每张卡片算好要高亮的房间 |
| `db/schema.sql` | `shifts` 表加了 `location` 列：同一个任务的不同人可以去不同地方 |
| `lib/schedule.ts` | 卡片上的地点 = 这个人自己的地点（如果有），否则用任务的地点 |
| `scripts/apply-task-details.ts` | 支持 `byPerson`，按人分配地点 |

**地点文字怎么变成地图高亮？** `roomsIn("PG6 116")` 会在文字里找 `116` 这个完整的数字（`1160` 不算），找到就高亮 116 房间。所以地点只要写 `PG6 116`、`Room 116` 都行，不用另外再填一个"房间号"。地点里没有地图上的房间（比如 `PG6 Lobby`、`Graham Center`），卡片上就不显示 "Show on map"。

**高亮是怎么画上去的？** 图片上面盖了一层大小完全相同的 SVG，SVG 用的是图片自己的像素坐标（`viewBox="0 0 1578 996"`）。所以不管手机多宽，框都正好对准房间。每个房间画两次：先画一条深色的粗线，再在上面画一条琥珀色的细线。这样在橙色的 112 房间上也看得清。

**"Show on map" 用的是 HTML 自带的 `<details>`**：点一下展开，再点一下收起，不用写任何 JavaScript，键盘和读屏软件也都能用。地图可以用两根手指放大（我们没有禁止缩放）。

**按人分配地点（`byPerson`）**：Print Running 有人在 105，有人在 106。`task-details.json` 里这样写：

```json
"Print Running": {
  "location": "PG6 105 or 106",
  "byPerson": { "PG6 105": ["名字1", "名字2"], "PG6 106": ["名字3"] }
}
```

运行 `npm run db:details` 后，这些人的卡片显示自己的房间，地图也只高亮自己的房间；没分配到的人看到的是 "PG6 105 or 106"，两个房间都高亮。名字必须和名单里**一字不差**，对不上的会打印警告。`--reset` 重新导入以后要再运行一次 `npm run db:details`。

**以后加新地点（比如 Lobby、门口）**：在 `lib/rooms.ts` 的 `ROOMS` 里加一行，写上 id（比如 `"Lobby"`）、显示名，以及在图片上按顺时针读出的各个角的坐标。地点文字里出现这个 id，就会自动高亮。

### 第二轮（Lobby、Directions 站位、Graham Center）

- **新地图**：`public/pg6-map.webp` 换成了 Lingtong 标上 "Lobby" 的版本（1579 × 996）。
- **Lobby**：`lib/rooms.ts` 里加了 `Lobby` 的轮廓，地点写 `PG6 Lobby` 的任务（Registration、Move people into 116、Extra、Dinner、Awards）都会高亮它。
- **Directions 的 3 个站位**：按 Lingtong 圈的位置画了 3 个椭圆（`oval()` 用 16 条边近似一个椭圆）：
  - Spot 1：Lobby 下面
  - Spot 2：106 南边的门口
  - Spot 3：东边的小院子

  这 3 个站位都属于同一组 `Outside PG6`。地点文字只写 `Outside PG6` 时，三个都高亮；写了 `Spot 2` 时，只高亮 Spot 2（具体编号优先于组名）。
- **括号里的文字不参与匹配**：`Spot 1 (below the Lobby)` 只高亮 Spot 1，不会把 Lobby 也高亮。这是测试时发现的问题，已经修好。所以描述性的话都写在括号里。
- **Google Maps**：地点里有 "Graham Center" 的卡片，会显示 "Open in Google Maps ↗"，点开就用谷歌地图搜 FIU 的 Graham Center。其他地图上没有的地点，在 `lib/rooms.ts` 的 `EXTERNAL` 里加一行就行。
- **自测**：`npx tsx scripts/check-rooms.ts`，检查各种地点文字匹配到的房间对不对。

### 第三轮：让高亮更明显（`components/room-map.tsx`）

Lingtong 反馈原来的高亮不够明显，所以现在地图分三层：

1. **深色蒙层**：一块半透明的深色盖住整张地图，但要去的房间被"挖空"，所以目标房间保持原来的亮色，其他地方都变暗。做法是一条 SVG `path`：先画整张图的大矩形，再画每个房间的轮廓，加上 `fill-rule="evenodd"`。这个规则的意思是，被两个形状同时盖住的地方算"外面"，所以房间就变成了洞。
2. **粗边框**：深色粗线在下，琥珀色线在上，和原来一样，但更粗。
3. **名字牌**：每个要去的地方放一个琥珀色的圆角牌子，上面写 `105`、`Lobby`、`Spot 2`。不靠颜色也能一眼认出是哪里。牌子的位置是 `lib/rooms.ts` 里每个地点的 `pin`。106 是 L 形，它的牌子放在下半部分，避免落进 105 里。

地图下方的文字也改成了 "Go to **Room 105**"，房间名加粗。

## 任务说明（"Instructions" 下拉框）

| 文件 | 作用 |
|---|---|
| `data/instructions/registration.md`、`data/instructions/balloon-running.md` | 两份说明的英文原文。网站上只放英文 |
| `data/task-details.json` | 这两个任务多了 `instructionsFile`，指向上面两个文件 |
| `scripts/apply-task-details.ts` | `npm run db:details` 会读这些文件，写进 `tasks.instructions` |
| `lib/instructions.ts` | 把说明文字拆成标题、编号步骤、圆点、普通段落；`**加粗**` 也能识别 |
| `scripts/check-instructions.ts` | 上面这个的自测 |
| `components/instructions.tsx` | 把拆好的内容显示出来 |
| `components/task-list.tsx` | 卡片上加 "Instructions" 下拉框，在 "Show on map" 上面 |
| `lib/schedule.ts` | 查询时多取 `t.instructions` |
| `app/admin/page.tsx`、`app/admin/actions.ts` | 管理页的说明输入框变大，最多 4000 字 |

**写说明的格式**（文件里或者管理页的输入框里都一样）：
- `## 标题` → 琥珀色小标题
- `1. 步骤` → 编号列表
- `- 要点` → 圆点列表
- `**重要的字**` → 琥珀色加粗
- 其他行 → 普通段落；空行只是用来分隔

**安全**：说明文字只当文字显示，不会变成网页代码。就算有人在管理页输入 `<script>`，页面上也只会原样显示这几个字符。

**改说明的两种方式**：
1. 改 `data/instructions/` 里的文件，然后运行 `npm run db:details`。
2. 在管理页 "Task locations" 里对应任务的 Instructions 框里直接改，点 Save。

注意：再运行 `npm run db:details` 时，文件里的内容会覆盖管理页改过的内容。

只有 Registration 和 Balloon Running 有说明，其他任务的卡片上没有 "Instructions"，等 Lingtong 和其他人确认后再加。草稿在 `docs/task-instructions-draft.md`。
