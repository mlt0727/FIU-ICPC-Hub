# 管理页（`/admin`），逐个文件讲解

管理页可以做四件事：**登录**、**发公告**（存起来、推送、显示在志愿者页面上）、**改任务地点和说明**、**改某个人的时段**。

## 文件一览

| 文件 | 作用 |
|---|---|
| `lib/admin-auth.ts` | 只用一个密码的登录：检查密码、发 cookie、检查 cookie |
| `app/admin/actions.ts` | 所有"修改"操作（Server Actions）：登录、退出、发公告、删公告、改任务、改 / 删 / 加时段 |
| `app/admin/page.tsx` | `/admin`：没登录就只显示密码框；登录后显示公告、任务地点、人员列表 |
| `app/admin/[slug]/page.tsx` | `/admin/lingtong-meng`：改这个人的时段 |
| `components/admin-forms.tsx` | 需要在浏览器里运行的部分：登录表单、公告表单、"Saving…" 按钮 |
| `components/announcements.tsx` | 志愿者页面顶部显示最近 3 条公告 |
| `components/auto-refresh.tsx` | 志愿者页面每分钟自动从服务器重新读取一次 |
| `components/volunteer-view.tsx` | 把上面两个放进志愿者页面 |
| `lib/time.ts` | 新增 `toInputTime()`：把时间变成 `08:00`，给时间输入框用 |
| `app/globals.css` | 公告框、表单、输入框的样式 |
| `.env.example` | 新增 `ADMIN_PASSWORD` 占位 |

## 先理解 Server Actions

文件开头写了 `"use server"` 的函数就是 Server Action。网页上的 `<form action={saveTask}>` 提交时，浏览器会发一个 POST 请求，`saveTask` 在**服务器**上运行。

**重要**：任何人都能直接发这个 POST，不一定要经过我们的页面。所以"没登录就不显示表单"**不算保护**。保护靠的是：每个 action 第一行都调用 `requireAdmin()`；所有输入在写进数据库之前都要检查。

改完以后调用 `refresh()`，Next.js 会在同一次请求里把页面重新渲染好送回来，所以页面上马上就能看到新数据。

## `lib/admin-auth.ts`：怎么登录

- 没有用户表，只有一个密码，放在环境变量 `ADMIN_PASSWORD` 里。
- 登录成功后，浏览器拿到一个 cookie。cookie 的内容是用密码算出来的签名（HMAC-SHA256），**不是密码本身**。没有密码就造不出这个签名。改密码以后，旧的 cookie 全部失效，相当于所有人都被登出。
- cookie 的几个设置：
  - `httpOnly`：页面里的 JavaScript 读不到。
  - `secure`：线上只走 https。
  - `sameSite: "strict"`：别的网站链接或提交到这里时不会带上它。
  - `path: "/admin"`：只在管理页使用。
  - 有效期 12 小时。
- 比较签名用 `timingSafeEqual`（不管哪一位不同，比较时间都一样），不会因为"猜对了前几位、回应快一点"而泄露信息。
- 密码输错会等 1 秒再回应，让暴力猜密码变慢。

## 发公告（`sendAnnouncement`）

1. 检查：标题必填、最多 80 字；内容必填、最多 500 字。
2. 存进 `announcements` 表。
3. 推送给**所有**开了通知的手机（包括技术组）。点通知打开那个人自己的页面，公告就显示在最上面。TTL 设为 1 小时：手机离线超过 1 小时就不送了。
4. 返回 "Posted. Sent to N of M phones."，表单下面会显示出来。

管理页上能看到所有发过的公告，可以删掉（比如打错了字）。**删公告只是从网页上去掉，已经推送出去的通知收不回来。**

## 志愿者页面上的公告

- `components/announcements.tsx`：显示最近 3 条，琥珀色边框，写着发布时间。只显示在志愿者页面上，参赛者首页不显示（公告是写给志愿者的）。
- `components/auto-refresh.tsx`：主屏幕 app 可能一开就是好几个小时，不刷新的话看到的一直是旧数据。所以每 60 秒、以及 app 从后台切回前台时，都会从服务器重新读一次页面。公告、改过的时段、新地点都会自动出现。页面在后台时不刷新。

## 改任务地点（`saveTask`）

管理页上每个任务一张卡片，可以改 Location 和 Instructions。改完以后，所有人的卡片马上就是新的（自动刷新最多等 1 分钟）。地点里写了地图上有的地方（116、105、Lobby……），卡片上就会出现 "Show on map"。

**和 `task-details.json` 的关系**：管理页直接改数据库。之后如果再运行 `npm run db:details`，JSON 里**非空**的值会覆盖管理页改的内容。所以选一种方式用就好；比赛当天建议只用管理页。

## 改某个人的时段（`/admin/[slug]`）

- 每个时段可以改开始 / 结束时间，以及"只给这个人的地点"（比如 Print Running 的 105 / 106）。留空就用任务本身的地点，输入框里灰色的字就是任务地点。
- 时间用 `<input type="time">`，显示和保存都按纽约时间、比赛当天，规则和 Excel 导入一样。
- 结束时间必须晚于开始时间，否则不会保存。
- **改了开始时间，会把 `reminder_sent_at` 清空**，新时间到了还会再提醒一次。只改结束时间或地点，不会重复提醒。
- "Remove this shift" 删掉这个时段；最下面可以给这个人加一个新时段（选任务、填时间）。
- 到场 / 离场时间暂时不能在这里改（要改的话直接改数据库，或者以后再加）。

## 已经测过的（本地，用临时密码 `localtest`，只在那次测试的进程里，没有写进任何文件）

- 没登录打开 `/admin/lingtong-meng` → 跳回 `/admin`。
- 输错密码 → "Wrong password."；输对 → 进入管理页。
- 把 Lingtong 的 Breakfast Setup 结束时间改成 10:30 → 数据库确实变了 → 改回 11:00 → 他的页面显示正确。
- **没测发公告**：本地和线上用的是同一个数据库，一发就会真的推送到 Lingtong 的手机，并且出现在所有志愿者的页面上。所以留给 Lingtong 在线上自己测。
