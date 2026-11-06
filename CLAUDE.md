# ICPC day website — 项目交接说明

> Claude Code 每次在这个文件夹启动都会读这个文件。最后更新：2026-10-31（主页面、管理页、推送都已上线；**下次从"接下来从这里开始"那一节接着做**）。

**项目总览（主文档）：`docs/overview.md`**。每个文件夹、每个文件是干什么的，以及所有子文档的链接，都在那里。加了新文件或新文档，要同步更新它。

## 工作规则（必须遵守）

- **Lingtong 要完全理解每一部分代码。** 每写完一部分，都要逐个文件讲清楚在做什么（参考 `docs/step-1-explained.md` 的写法）。
- **不要 push 到 GitHub。** 由 Lingtong 自己看懂后提交。
- 代码注释用英文；给 Lingtong 的讲解用中文。
- 网站界面**全英文**，**手机优先**，要检查小屏和大屏之间的布局。
- 前端设计必须使用 **ui-ux-pro-max** skill（https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ），已经装在全局 `~/.claude/skills/`（所有项目都能用；项目里那份不进 git）。所有前端设计都要先用它，而且要做得**有辨识度**，不要做成千篇一律的模板风格。
- **设计已定（2026-10-31）**：见 `design-system/icpc-checkpoint/MASTER.md`。深蓝底，当前任务用琥珀色描边。很多志愿者不是计算机专业的，所以**通俗易懂、不花哨**：每个任务一张卡片，只写时间、任务名、地点，用 Now / Next / Done 这种日常词，不用 AC、RUNNING 之类的行话。

## 项目目标

为 **2026-11-07 的 ICPC 比赛日**做一个网站，时区 **America/New_York**。

- **参赛者**：只用通用链接。可以看时间表、地图、总餐厅、从餐厅回来的路线、座位表（以后可能再加）。
- **志愿者**：能看到参赛者的全部内容，另外还有自己的专属区域。
  - 专属链接是 `网站/名字`，例如 `/isabel-gonzalez-lopez`（全名、去掉重音、小写、用连字符）。别人能看到别人的也没关系。
  - **记住身份**：志愿者打开一次专属链接后，用 cookie 记住他。**（2026-10-31 改）** 主页面 `/` 对所有人都一样；志愿者在主页面顶部多一个 "My schedule" 标签，可以回到自己的页面。个人页上有 "Contest day" 标签，可以去主页面。参赛者看不到这两个标签。
  - 个人页顶部显示名字、到场时间、离场时间、总时长。下面每个任务一张卡片，写时间、地点、任务类型。**正在进行的任务卡片外面一圈高亮。**
  - 每种任务类型会有专门的文档模板，Lingtong 之后提供。
  - **技术组**（8 人）：只显示到场、离场、时长，再加技术组自己的内容，没有任务卡片。
- **管理页**：带密码，可以改任务、发公告。比赛当天大概率不改，但要能改。
- **推送通知（必须有）**：任务开始前提醒，加上手动公告。iPhone 需要先把网站"添加到主屏幕"（iOS 16.4 以上），Lingtong 会让志愿者照做。安卓在 Chrome 里直接允许通知就行。

## 主屏幕和推送方案（2026-10-31 已确定）

**问题**：iPhone 上"添加到主屏幕"的网页 app 有自己独立的 cookie 和存储，不和 Safari 共享。Lingtong 实测过，在 Safari 里设的 cookie 到了主屏幕 app 里会不见。iOS 又只允许在主屏幕 app 里开通知，所以主屏幕 app 必须自己知道"我是谁"。

**做法：每个志愿者用自己的 manifest。**
- `/isabel-gonzalez-lopez` 页面挂 `<link rel="manifest" href="/manifest/isabel-gonzalez-lopez">`（路径以实际实现为准）。
- 这个 manifest 里 `id` 和 `start_url` 都是 `/isabel-gonzalez-lopez`，`scope` 是 `/`，`display` 是 `standalone`。
- 结果：点主屏幕图标永远打开她自己的页面，页面在主屏幕 app 自己的存储里重新写 cookie。不依赖 Safari 的 cookie 带过去，也不需要一次性令牌（个人链接本来就公开）。`scope: "/"` 让参赛者页面（地图、餐厅）也留在 app 里。
- 通用页面用普通 manifest（`start_url: "/"`）。安卓 Chrome 没有这个问题，同一套写法也能用。
- **给志愿者的说明**：先在 Safari 里打开**自己的专属链接**，再"添加到主屏幕"，不要从通用链接添加。
- 第 2 步一开始就先做最小版本、部署，**用真 iPhone 测**：添加到主屏幕 → 能认出人 → 能收到一条通知。

**推送**：
- 用 `web-push` 从 Vercel 函数直接发，几秒就到，48 人的量不需要 OneSignal 之类的服务。Vercel Hobby 函数最长 300 秒，够用。
- 慢的是 Vercel Hobby 的 cron（一天一次，触发时间在那个小时里随机），所以任务前提醒用 cron-job.org 每分钟调一次受保护的接口。
- 手动公告在管理页点发送就立即发，不经过定时器。
- 发送时设 `Urgency: high` 和较短的 TTL（比如 10 分钟），过时的提醒不会很晚才到。
- 专注模式、勿扰、低电量模式可能让通知延迟或不响，所以**公告同时显示在网页上**，推送只是补充。

## 部署（2026-10-31 已上线）

- 网址：**https://fiu-icpc-hub.vercel.app**（个人页例如 `/lingtong-meng`）
- Vercel 项目 `fiu-icpc-hub`（`prj_e0RCH0Q4xndq8HDu8A0mAiuHnmuv`），团队 `lingtong-mengs-projects`，Node 24。
- 连着 GitHub 仓库 `mlt0727/FIU-ICPC-Hub`，**push 到 `main` 就会自动部署到正式网址**。
- 环境变量：`DATABASE_URL`（加密）、`EVENT_DATE`、`EVENT_TZ`，三个环境都填了。**推送用的 `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`CRON_SECRET` 还没填**（见"上线推送通知"）。
- 访问保护：设成只保护预览部署和单次部署网址，**正式网址 `fiu-icpc-hub.vercel.app` 对所有人公开**。Vercel 新建项目默认会给整个网站加登录，那样志愿者打不开，所以改掉了。

## 技术选型（已确定）

- **Next.js + TypeScript**，不用 Python。
- **Vercel** 部署，**新建项目**。已有的 `volunteer-schedule` 项目只是之前做规划用的，不要动。
- **数据库**：Neon 项目 **academy**（`patient-glitter-01621934`）→ branch `main` → 数据库 **`icpc_day`**。驱动是 `@neondatabase/serverless`，写原生 SQL，不用 ORM。
- **定时提醒**：Vercel 免费版（Hobby）的 cron 频率太低（具体限制以 Vercel 官方文档为准），计划用免费的外部定时服务（比如 cron-job.org）每分钟调用一个受保护的 API。
- 网站名字必须带 **ICPC**。候选：**ICPC Checkpoint**（推荐）、ICPC Basecamp、ICPC Day Hub。还没最终确定。

## 计划和进度

1. ✅ **数据库 + Excel 导入**：5 张表已建好，数据已导入（48 人、15 种任务、162 个时段，没有任何警告）。另外加了 Lingtong 的测试数据和新任务 Breakfast Setup（见 `db/test-lingtong.sql`）。2026-10-31 又加了 **Talin Malki**（`/talin-malki`，Excel 里没有，见 `db/extra-volunteers.sql`）：Extra → Orientation → Lunch → Balloon Running → Dinner Setup → Awards → Event Break Down，时间照 Ahmed Mostafa 的。现在数据库共 50 人。2026-11-06：技术组的 **Tarun 换成了 Azam Shirali**（直接改了数据库里那一行的名字和链接：`/tarun` → `/azam-shirali`，时间不变 8:00 AM–2:00 PM）。**注意**：`--reset` 重新导入旧 Excel 会把 Tarun 加回来。
2. ✅ **志愿者页面 + 管理页**（都已上线）
   - ✅ 设计系统（`design-system/icpc-checkpoint/MASTER.md`）。
   - ✅ Next.js 16 网站：个人页、通用首页、cookie 记住身份、名字打错的 404 页、每人自己的 manifest、主屏幕图标。讲解见 `docs/step-2-explained.md`。
   - ✅ 已部署到 https://fiu-icpc-hub.vercel.app 。
   - ✅ **真 iPhone 测试通过**：添加到主屏幕后点开，仍然认得出是 Lingtong。
   - ✅ 根据 iPhone 测试改了三处：
     - 顶部留白加大（第一行原来贴在状态栏下面，被模糊盖住）。
     - 志愿者页面顶部那行改成 `ICPC Volunteer · Sat, Nov 7`。
     - 主屏幕图标下面的名字（志愿者和参赛者都一样）改成 **"FIU ICPC Hub"**，在 `lib/manifest.ts` 的 `APP_NAME`。
     - 主屏幕图标改成**临时的纯文字版**：深蓝底，上面是大号琥珀色 "FIU"，中间一条线，下面是 "ICPC"。

     **已经上线**（Lingtong 已 push）。Lingtong 认为主屏幕功能基本可以了。
   - ✅ **所有志愿者的个人链接已导出**：`npm run links` → `volunteer-links.csv`（不进 git）。线上链接和 manifest 都检查过，全部正常。加了 Talin Malki 以后要再运行一次 `npm run links`（运行前先关掉在 Excel 里打开的 CSV，否则会报 EBUSY）。**还没发给志愿者**，发之前先看下面"发链接之前"。
   - ✅ **管理页 `/admin`**（讲解见 `docs/admin-explained.md`），本地写好、build 通过：
     - 密码登录（`ADMIN_PASSWORD`）。
     - 发公告：存进数据库、推送给所有开了通知的手机、显示在志愿者页面顶部。
     - 改任务地点和说明。
     - 改某个人的时段：时间、个人地点、删除、新增。
     - 志愿者页面每分钟自动刷新。
   - ✅ 本地测过：登录、密码错误、没登录会被跳转、改时段再改回。**发公告没在本地测**，因为会真的推送给所有人。
   - ✅ 已上线，`ADMIN_PASSWORD` 已设（线上 `/admin` 显示密码框）。
   - ✅ Lingtong 在线上测过发公告，正常。
   - ✅ 一点就进的管理员链接：`/admin?key=<ADMIN_PASSWORD>`（`proxy.ts`）。打开后自动登录，再跳回干净的 `/admin`。本地测过，等 push。密码里有特殊字符要做 URL 编码。拿到链接就是管理员，不要外传。
   - ✅ 管理页第二轮（本地做好、build 通过，等 push）：在管理页加新志愿者、改到场 / 离场时间，以及新页面 `/admin/overview`（Volunteers by task、Tasks by volunteer，和 Excel 的表一样）。讲解见 `docs/admin-explained.md` 最后一节。
3. ✅ **主页面 `/`（参赛者和所有人）**（讲解见 `docs/step-3-explained.md`）：已上线。
   - 内容：当天时间表（Now / Next / Done，带地图）、PG6 总览地图、午饭（Graham Center 的 Google Maps 链接，以及走回 PG6 的步行路线）。
   - 志愿者两个标签：My schedule 和 Contest day，本地测过可以来回切换。
   - ✅ 时间表已经按 Lingtong 给的海报填好：Registration 10:00 → Orientation 11:00 → Practice contest 12:00–1:30 → Lunch 12:30–1:45（8th Street Campus Kitchen，Graham Center 里）→ Move to contest area 1:45 → Contest 2:00–7:00（全部在 116）→ Dinner 7:00–7:30 → Awards 7:30–8:00。112 是教练的位置。参赛者没有早餐；晚饭参赛者和志愿者都有。
   - ✅ Lingtong 确认：参赛者 Orientation 在 116，Dinner 和 Awards 在 Lobby。
   - ✅ 座位表（2026-11-06）：主页面 "Seating in Room 116"，图片 `public/seating-116.webp`，来自 Lingtong 的 PDF。点图片进入 `/seating` 页面（有返回链接，图片可以左右滑动、两指放大）。原来是直接打开图片文件，在主屏幕 app 里会顶到状态栏下面、而且没法返回，2026-11-06 改掉了。横屏时图片会铺满整个屏幕宽度。所有页面顶部留白改成"状态栏 + 44px"（20px 在真机上还会被状态栏下面的模糊盖住）。本地测过，等 push。
4. ✅ **推送通知**（讲解见 `docs/step-4-explained.md`）
   - ✅ 本地写好、build 通过：
     - "Turn on reminders" 按钮：iPhone 在 Safari 里打开时，会提示先添加到主屏幕。
     - `public/sw.js`、保存订阅、"Send a test notification"。
     - 任务开始前 10 分钟自动提醒（`/api/cron/reminders`，同一个时段不会重复提醒）。
   - ✅ 本地已检查：接口的密码校验和输入校验都正常；提醒的 SQL 用"假装比赛日 11:52"验证过，选出的时段是对的。
   - ✅ 代码已 push 上线（提交 `Notification feature`）。
   - ❌ **第一次 iPhone 测试失败**：显示 "Couldn't turn on reminders"，系统也没弹出权限询问。
     - **原因**：3 个环境变量没有填到 Vercel，线上页面拿到的公钥是空的，手机直接拒绝了订阅。
     - 已加保护：没有公钥时改为显示 "Reminders aren't available yet."；出错时会在浏览器控制台打印原因。
   - ✅ **Lingtong 填好密钥后再测：iPhone 能开通知，测试通知也能收到。**
   - ✅ cron-job.org 已设置（Lingtong 的账号，每分钟调用一次 `/api/cron/reminders`）。Test run 返回 200 和 `{"shifts":0,"sent":0}`。
   - ✅ **任务前提醒全流程测通**（2026-10-31）：临时测试任务 3:26 PM 开始，提醒在 3:16:13 PM 发出，Lingtong 的 iPhone 收到了。测试任务已经删掉。
   - ⏸ 安卓测试（Lingtong 说暂时不做）。
   - ✅ 公告推送已做（在管理页里）。

## Check in 卡片（2026-11-02）

- 每个人（包括技术组）的卡片最前面多一张 **Check in**：时间 = 到场时间，地点 = `PG6 112`，到场后 15 分钟内算 Now。
- 不存数据库，由 `components/volunteer-view.tsx` 的 `checkInCard()` 根据 `arrive_at` 生成，改到场时间会自动跟着变。`/admin/overview` 里不显示。
- **规则**：所有人必须先去 PG6 112 签到，再去做任务或吃饭（Lingtong 2026-11-02 确认）。Check in 卡片的 Instructions 里写了这句。讲解见 `docs/step-2-explained.md` 最后一节。
- ✅ **签到推送**（2026-11-02，本地测过，等 push）：到场前 10 分钟推 "Check in at 12:00 PM · Go to PG6 112 first"，用 `volunteers.checkin_reminder_sent_at` 防止重复。管理页改到场时间会重新提醒。讲解见 `docs/step-4-explained.md` 第二轮。
- 顺手修好：任务提醒原来不用个人地点（Print Running 收到 "105 or 106"），现在用 `coalesce(s.location, t.location)`。

## 地点和地图（2026-10-31 做的，讲解见 `docs/step-2-explained.md` 最后一节）

- Lingtong 已经在 `data/task-details.json` 里填了大部分地点，已用 `npm run db:details` 写进数据库。他把 Photography 和 Balloon Running 的地点误写在 `instructions` 里了，Claude 已经挪到 `location`。
- Claude 按 Lingtong 的口头说明补了三项：Extra → `PG6 Lobby`；Directions → `Outside PG6`；Print Running → `PG6 105 or 106`。**这三项 Lingtong 原来填的值没有提交过，被脚本覆盖了，找不回来；当时推测他原来没填，要请他确认。**
- **地图**：`public/pg6-map.webp`（Lingtong 给的平面图，已标出 Lobby）。地图上能高亮的地方：116、112、105、106、Lobby，以及 Directions 的 Spot 1/2/3（都在 `lib/rooms.ts` 里）。卡片上的地点文字提到这些地方，就会显示 "Show on map"，点开后高亮。括号里的文字只是描述，不参与匹配。
- **Graham Center**（Lunch）不在平面图上，卡片显示 "Open in Google Maps ↗"。
- **按人分配地点**：`shifts.location` 列，加上 `task-details.json` 里的 `byPerson`。已经分好：
  - **Print Running**：Lingtong 让 Claude 自己分，Claude 按名字字母顺序分的。**Lingtong 已同意这个分法。**
    - 105：Muhammad Abuzar、Oliver Hernandez、Olivia Mason（比赛期间也在跑），以及 Fabiola Cagigas、Godwin Siyou Simo、Jonathan Gaspar（只做中午 12:00–1:00）。
    - 106：Pedro Remior、Subhash Gurappa、Yassine Mekdad（比赛期间也在跑），以及 Lyna Hamlaoui、Matthew Chavez-Alvarez、Muhammad Zain ul Abideen（只做中午）。

    Lingtong 说的 "10" 和 "166" 都按 105 / 106 理解。

    **2026-11-06 更新**：Olivia Mason 和 Pedro Remior 不跑 Print Running 了，他们的 Print Running 时段已经从数据库删除。比赛期间的 Print Running 现在只有 4 人，两边各 2 人：105 是 Muhammad Abuzar、Oliver Hernandez；106 是 Subhash Gurappa、Yassine Mekdad。中午 12:00–1:00 的 5 人（Fabiola、Godwin → 105；Lyna、Matthew、Zain → 106）不变。**注意**：如果用 `--reset` 重新导入旧 Excel，Olivia 和 Pedro 的 Print Running 会回来。
  - **Directions**：Alex Santa Maria → Spot 1（Lobby 下面），Felipe Trujillo → Spot 2（106 南门），Oliver Hernandez → Spot 3（东边院子）。谁站哪个点是 Claude 按字母顺序定的，Lingtong 可以换。
  - 改分配：在 `task-details.json` 的 `byPerson` 里改名字，然后运行 `npm run db:details`，不用部署。
- Event Break Down 和 Photography 写的是 "PG6"：工作范围是整个比赛现场，**不需要地图**（Lingtong 已确认）。

## 上线推送通知（Lingtong 要做的）

1. **把 3 个新环境变量填到 Vercel**：打开 Vercel → `fiu-icpc-hub` → Settings → Environment Variables，从 `.env.local` 最后三行复制，三个环境（Production / Preview / Development）都勾上：
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`（选 Sensitive）
   - `CRON_SECRET`（选 Sensitive）

   Claude 不能读这些密钥，所以这一步要 Lingtong 自己做。**`.env.local` 里的 VAPID 密钥以后不要换**：换了以后，所有已经开通知的手机都收不到了。
2. **填好以后必须重新部署一次**，环境变量才会生效：提交并 push（会自动部署），或者在 Vercel 的 Deployments 里对最新部署点 Redeploy。只填变量、不重新部署，线上还是拿不到密钥。
3. 真机测试：从主屏幕打开 → Turn on reminders → 允许 → Send a test notification。
4. **设置 cron-job.org**（免费，账号要 Lingtong 自己注册）：
   - 新建 job，URL 填 `https://fiu-icpc-hub.vercel.app/api/cron/reminders`，频率选每分钟。
   - 在 Advanced → Headers 里加一个请求头：名字 `Authorization`，值 `Bearer ` 加上 `CRON_SECRET` 的值（Bearer 后面有一个空格）。
   - 点 "Test run"，应该返回 `{"shifts":0,"sent":0}`。返回 401 就是密码没填对。
   - 只需要 11 月 7 日当天跑，可以在 cron-job.org 里设定日期，或者当天早上再打开。

## 任务说明（instructions，2026-10-31 开始）

- 草稿在 `docs/task-instructions-draft.md`：16 个任务，每个都有英文和中文。
  - Registration 和 Balloon Running 来自 Lingtong 给的两份文件，只调整了格式。
  - 其他 14 个（包括 Lingtong 让 Claude 写的 Print Running）是 Claude 的草稿，不确定的地方标了 `[?]`。文件最后列了 12 个要 Lingtong 回答的问题。
- **网站上只显示英文**，中文只给 Lingtong 审阅用。
- ✅ **Registration 和 Balloon Running 的说明已放进数据库**（原文在 `data/instructions/*.md`）。卡片上有 "Instructions" 下拉框，点开才显示，不影响卡片本身。本地测过，等 push 后上线。讲解见 `docs/step-2-explained.md` 最后一节。
- ⏸ **其他任务的说明先不放**：Lingtong 要跟其他人对过之后再定。加的时候：在 `data/instructions/` 里新建文件，在 `task-details.json` 里加 `instructionsFile`，然后运行 `npm run db:details`；或者直接在管理页填。
- Registration 原文学生文件夹的颜色是 "[color]"，网站上暂时没写颜色。

## 发链接之前

- 名字不用再改（Lingtong 确认：只要不重复就行，现在的链接都是唯一的）。**链接发出去以后就不要改名**，改名会让链接失效。
- 现在就可以发链接。以后网站更新，志愿者主屏幕上的图标会自动用上新版本，不用重新添加。

## 接下来从这里开始（建议顺序）

1. **push 管理页第二轮**，在线上试一下加人和 All data 页面。
2. Directions 谁站哪个点：Lingtong 还没说要换，先按现在的。
3. ⏸ **换成真 logo**（Lingtong 说暂时不做）：Lingtong 提供 FIU 和 ICPC 的官方 logo 文件（最好是 SVG 或大尺寸透明 PNG），并确认 FIU 的品牌规范允许这样用。不要自己画、也不要从网上随便找。拿到以后放进 `public/`，改 `app/icons/[size]/route.tsx`：FIU logo 在上，ICPC logo 在下。图标最小只有 180px，两个 logo 都要在这么小的尺寸下还看得清。
4. ✅ ~~管理页加人、改到场 / 离场~~（已做，见上面）。
5. ✅ ~~主页面座位表~~（已加）。
6. **比赛前收尾**：
   - 写给志愿者的"添加到主屏幕并打开通知"说明（英文）。
   - ✅ Lingtong 的账号 `lingtong-meng` 保留，不删（Lingtong 2026-10-31 决定）。Breakfast Setup 任务也保留。
   - 用几个真实志愿者的链接抽查一遍。

## 现有文件

| 文件 | 作用 |
|---|---|
| `db/schema.sql` | 5 张表：`volunteers`、`tasks`、`shifts`、`announcements`、`push_subscriptions` |
| `scripts/migrate.ts` | `npm run db:migrate`，执行 schema.sql，可以重复运行 |
| `scripts/import-excel.ts` | `npm run db:import -- "文件.xlsx" [--reset]`，读 Excel、检查数据、导入 |
| `lib/db.ts` / `lib/slug.ts` | 数据库连接 / 名字转网址 |
| `data/task-details.json` | **Lingtong 待填**：每个任务的地点和说明。填完运行 `npm run db:details` |
| `scripts/apply-task-details.ts` | `npm run db:details`，把 task-details.json 写进数据库，可以重复运行 |
| `docs/step-3-explained.md` | 第 3 步（主页面）的中文逐文件讲解 |
| `data/event-schedule.json`、`lib/event.ts`、`components/volunteer-nav.tsx` | 主页面时间表和志愿者标签，见第 3 步讲解 |
| `data/instructions/*.md`、`lib/instructions.ts`、`components/instructions.tsx` | 任务说明和它的显示 |
| `scripts/check-instructions.ts` | 说明格式解析的自测：`npx tsx scripts/check-instructions.ts` |
| `scripts/check-time.ts` | 时间换算的自测：`npx tsx scripts/check-time.ts` |
| `docs/admin-explained.md` | 管理页的中文逐文件讲解 |
| `proxy.ts` | `/admin?key=密码` 一点登录，见管理页讲解第三轮 |
| `app/admin/overview/page.tsx` | `/admin/overview`：全部数据，按任务和按人两种排法 |
| `app/admin/`、`lib/admin-auth.ts`、`components/admin-forms.tsx`、`components/announcements.tsx`、`components/auto-refresh.tsx` | 管理页和公告，见管理页讲解 |
| `docs/step-4-explained.md` | 第 4 步（推送通知）的中文逐文件讲解 |
| `lib/push.ts`、`lib/push-subscription.ts`、`public/sw.js`、`components/notify-button.tsx`、`app/api/` | 推送通知，见第 4 步讲解 |
| `public/pg6-map.webp`、`lib/rooms.ts`、`components/room-map.tsx` | PG6 平面图和房间高亮，见第 2 步讲解最后一节 |
| `scripts/check-rooms.ts` | 地点文字 → 地图高亮的自测：`npx tsx scripts/check-rooms.ts` |
| `scripts/check-push-subscription.ts` | 订阅数据检查的自测：`npx tsx scripts/check-push-subscription.ts` |
| `data/corrections.json` | Excel 已知错误的修正 |
| `data/all-hands.json` | Orientation 规则 |
| `docs/step-1-explained.md` | 第 1 步的中文逐文件讲解 |
| `docs/step-2-explained.md` | 第 2 步（志愿者页面）的中文逐文件讲解 |
| `app/`、`components/`、`lib/schedule.ts`、`lib/time.ts`、`lib/manifest.ts` | Next.js 网站本体，见第 2 步讲解 |
| `scripts/export-links.ts` | `npm run links`，生成 `volunteer-links.csv`（每人的个人链接，不进 git） |
| `db/extra-volunteers.sql` | Excel 之后才加的志愿者（目前只有 **Talin Malki**），`--reset` 重新导入后要再执行一次，或者直接把他加进 Excel |
| `db/test-lingtong.sql` | Lingtong 自己的测试数据（Breakfast Setup → Orientation → Lunch → Proctors）。`--reset` 重新导入后要再执行一次；比赛前决定要不要删 |
| `design-system/icpc-checkpoint/MASTER.md` | 设计规范 |

测试技巧：任何志愿者页面网址后面加 `?now=2026-11-07T14:00-05:00`，就能把时钟固定在比赛日的某个时刻，查看 Now / Done 的效果。

## 数据规则（Lingtong 已确认）

- 数据来源是 `Final Volunteer_Availability.xlsx`，以 "Volunteers by Task" 表为准。`.gitignore` 排除了所有 xlsx，名单不进 git。
- **Orientation 11:00–12:00** 是全员活动，这个时间段没人干活。12:00 前到场的普通志愿者参加（24 人），之后才到的不用参加。`kind = 'meeting'`。
- Shirina **8:00** 到场（表格里写错了），Lyna 的 Move people into 116 是 **10:00–11:00**。这两条写在 `corrections.json` 里，没有改 Excel。
- Lunch 是 `kind = 'break'`，其他任务是 `duty`。
- **Excel 里的 "DINNER" 其实是准备晚饭（set up dinner），不是吃晚饭**，所以网站上叫 **Dinner Setup**，`kind = 'duty'`。这个改名写在 `corrections.json` 的 `taskNames` 里，重新导入 Excel 时也会自动改。真正的晚饭是海报上的 7:00–7:30 PM，参赛者和志愿者都吃，显示在主页面的时间表里。
- 时间存成 `timestamptz`。Excel 里的 "8:00" 等于 2026-11-07 纽约时间 8:00，也就是 UTC 13:00。

## 本地运行

Lingtong 电脑上已经做好：`npm install`、`.env.local`（已填 Neon 连接串）、git 仓库（已推到 GitHub `mlt0727/FIU-ICPC-Hub`）。从这台电脑可以直接连 Neon。

```bash
npm run dev                  # 本地网站：http://localhost:3000/lingtong-meng
npm run build                # 和 Vercel 一样的打包检查
npm run typecheck
# 新电脑才需要：
npm install
cp .env.example .env.local   # 填 DATABASE_URL：Neon 控制台 → academy → icpc_day → Connect
# 数据库里已经有数据了。只有 Excel 改了才需要重新导入：
npm run db:import -- "Final Volunteer_Availability.xlsx" --reset
```

## 还没决定 / 等 Lingtong 提供

- 名字：主屏幕名字定为 **"FIU ICPC Hub"**；志愿者页面顶部那行写 "ICPC Volunteer"。参赛者首页顶部还写着 "ICPC Checkpoint"，网页标题（浏览器标签上的字）也还是 "ICPC Checkpoint"，要不要都改成 FIU ICPC Hub 还没定。
- FIU 和 ICPC 的官方 logo 文件。
- 15 个任务的地点和说明（`task-details.json`，或者等管理页做好后在网页上填）。
- 各任务类型的文档模板。
- 参赛者内容：地图、餐厅路线、座位表的素材。
- 管理页密码：由 Lingtong 自己定，填进 `.env.local` 和 Vercel 的 `ADMIN_PASSWORD`。Claude 看不到这个密码。
- 任务开始前几分钟提醒：现在先用 10 分钟（`lib/time.ts` 的 `REMINDER_MINUTES`），Lingtong 想改再说。
- 地图：PG6 平面图、Lobby、Directions 站位、Graham Center 的 Google Maps 链接和走回 PG6 的步行路线都已经有了。
- 技术组卡片上写什么（现在写的是 "Tech team details will appear here."）。
