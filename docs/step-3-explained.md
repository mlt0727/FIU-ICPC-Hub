# 第 3 步：主页面（参赛者和所有人），逐个文件讲解

主页面就是网址 `/`，所有人都能看：参赛者、教练、志愿者。上面有三块：**当天时间表**、**PG6 地图**、**午饭（Graham Center）**。

志愿者在自己的页面和主页面之间，用顶部的两个标签切换：**My schedule** 和 **Contest day**。参赛者看不到这两个标签。

## 文件一览

| 文件 | 作用 |
|---|---|
| `data/event-schedule.json` | **当天时间表**：标题、开始、结束、地点。照 Lingtong 给的海报填的 |
| `lib/event.ts` | 把时间表变成卡片，和志愿者的任务卡片是同一种 |
| `lib/time.ts` | 新增 `eventTimeIso("08:00")`：比赛当天纽约时间 → 精确时刻 |
| `scripts/check-time.ts` | 上面这个换算的自测 |
| `app/page.tsx` | 主页面 |
| `components/volunteer-nav.tsx` | 志愿者的两个标签 |
| `components/volunteer-view.tsx` | 志愿者页面顶部加上标签 |
| `components/room-map.tsx` | 可以传自己的说明文字（`caption`），主页面的总览地图用它 |
| `lib/rooms.ts` | Lobby 的名字牌往右挪了一点，不会在地图边上被切掉 |
| `app/layout.tsx`、`app/not-found.tsx` | 网页标题从 "ICPC Checkpoint" 改成 "FIU ICPC Hub" |
| `app/globals.css` | 标签的样式 |

## 主页面上有什么

1. **时间表**：用的就是志愿者页面的卡片组件（`TaskList`），所以同样会自动标出 Now / Next / Done，地点里有房间号的也会有 "Show on map"，Graham Center 也有谷歌地图链接。同样可以用 `?now=2026-11-07T15:00-05:00` 测试。
2. **PG6 地图**：Lobby、116、112 一直是亮的，下面写着 "Lobby: registration, dinner, awards · 116: contest · 112: coaches"。
3. **午饭**：8th Street Campus Kitchen（Graham Center 里的自助餐厅），两个链接：
   - "Open in Google Maps"：在谷歌地图里搜 8th Street Campus Kitchen。
   - "Walking directions back to PG6"：谷歌地图从那里到 PG6 Tech Station 的步行路线。

   这两个网址在 `lib/rooms.ts` 里（`LUNCH_MAP_URL`、`WALK_BACK_URL`），志愿者 Lunch 卡片上的链接也用同一个。

**座位表**（2026-11-06 加）：时间表下面是 "Seating in Room 116"。
- 图片是 `public/seating-116.webp`，来自 Lingtong 给的 `PG6 Map 116 - November 7 2026.pptx.pdf`：用 `pdftoppm` 按 200 dpi 转成 PNG（2667 × 1500），再转成 WebP（217 KB），放大以后队名也看得清。
- 点图片会进入 **`/seating` 页面**（`app/seating/page.tsx`）：顶部有 "← Contest day" 返回链接；图片画成约两倍屏幕宽（`width: max(100%, 900px)`），在框里左右滑动看整个房间，也可以两指放大。
- **为什么不直接打开图片文件**（2026-11-06 改的）：一开始点图片打开的是 `/seating-116.webp` 这个图片文件本身。在主屏幕 app 里，iPhone 会把图片直接显示在 app 里：没有我们页面的留白，所以顶部被状态栏盖住；背景是白的；**而且主屏幕 app 没有浏览器的返回按钮，人就卡在图片上回不去了**。改成我们自己的页面以后，这三个问题都没有了。
- `seating` 也加进了管理页"不能当作志愿者链接"的名单（`app/admin/actions.ts` 的 `TAKEN`），避免有人的链接和这个页面重名。
- `<img>` 上写了 `width` 和 `height`，图片还没加载完时也会先占好位置，页面不会跳。
- 以后座位有变化：把新的 PDF 同样转一次，覆盖 `public/seating-116.webp`，然后 push。

## 时间表为什么放在 JSON 文件里

当天的时间表基本不会变，放在 `data/event-schedule.json` 里最简单：改文件，push 就上线。要临时通知大家的变化用管理页发公告。

**注意和任务地点不一样**：任务地点在数据库里，改了马上生效；这个时间表是网站代码的一部分，**改了要 push 才会生效**。

`eventTimeIso()`：时间表里写的是 "14:00" 这种当地时间，要变成精确时刻，才能和"现在"比较、判断 Now / Done。11 月 7 日夏令时已经结束，纽约是 UTC−5，所以 "08:00" 就是 UTC 13:00。函数用 `Intl` 算出那一天纽约和 UTC 的时差，不用写死 −5，结果和数据库导入时的算法一致。自测：`npx tsx scripts/check-time.ts`。

## 志愿者的两个标签（`components/volunteer-nav.tsx`）

- 只在两种情况下出现：打开自己的个人页；或者带着志愿者 cookie 打开主页面。参赛者没有个人链接、也没有 cookie，所以看不到。
- 当前所在的那个标签是琥珀色的，用的是 `aria-current="page"`。读屏软件会读出"当前页面"，样式也是靠它变色。
- 主页面会先到数据库里确认 cookie 里的这个人还在。如果人已经删了，就不显示标签，避免点 "My schedule" 进到 404。

**和原来设计的不同**：原来 CLAUDE.md 里写的是"志愿者打开通用页面会显示他的志愿者内容"。现在按 Lingtong 的新要求改成：主页面对所有人都一样，志愿者只是多了一个回到自己页面的标签。

主页面仍然保留一个保护：有志愿者 cookie 的人从主页面添加到主屏幕，图标打开的还是他自己的页面。

## 时间重叠

海报上 Practice contest（12:00–1:30）和 Lunch（12:30–1:45）时间重叠。卡片组件本来就允许两张卡片同时是 Now，所以 12:45 的时候两张都会带琥珀色边框。

### 座位表页面第二轮（2026-11-06，真机反馈）

1. **竖屏时返回链接被模糊**：新版 iPhone 在主屏幕 app 里，会把状态栏下面一小段做成渐变模糊。原来页面顶部只留"状态栏高度 + 20px"，第一行还在模糊区里。现在改成 **+ 44px**（`app/globals.css` 的 `main`）。这是所有页面共用的留白，所以志愿者页面、主页面的第一行也一起往下移了。
2. **横屏时图片没有变大**：原来图片在 480px 宽的那一栏里，横过来还是那么窄。现在 `.seating-full` 跳出这一栏：宽度 = 屏幕宽度减去两边留白（横屏时也减去刘海那一侧的安全区），最多 1400px，再用 `left: 50%` + `translateX(-50%)` 放到正中间。
   - 竖屏：框和原来一样宽，图片 900px，左右滑动。
   - 横屏（`@media (orientation: landscape)`）：图片宽度 = 框的宽度，整个房间一屏放下，不用滑；"turn your phone sideways" 的提示也自动隐藏。

测过：模拟 844×390 横屏，框宽 812px、图片 812px、页面没有横向滚动；375 竖屏不变。
