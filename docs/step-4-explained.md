# 第 4 步（第一部分）：推送通知，逐个文件讲解

这一部分做了：志愿者页面上的 "Turn on reminders" 按钮、后台的 service worker、保存订阅、给自己发测试通知、任务开始前 10 分钟自动提醒。
**还没做**：管理页发公告（公告推送会复用这里的 `sendPush`）。

## 推送通知是怎么走的（先看整体）

```
志愿者点 "Turn on reminders"
  → 手机问"允许通知吗？" → 允许
  → 手机向苹果 / 谷歌的推送服务要一个"地址"（subscription，里面有 endpoint 和两把钥匙）
  → 我们把这个地址存进 push_subscriptions 表，记下是哪个志愿者的

到了该提醒的时候
  → 我们的服务器用 VAPID 私钥签名，把消息发到那个地址
  → 苹果 / 谷歌把消息送到手机
  → 手机上的 service worker（sw.js）收到，弹出通知
```

- **VAPID 密钥**：一对钥匙。公钥给手机，私钥只放在服务器上。推送服务用它来确认"这条消息真的是 fiu-icpc-hub 发的"。
- **service worker**：网站交给手机的一个小脚本，就算 app 关着也能在后台收消息。

## 文件一览

| 文件 | 作用 |
|---|---|
| `package.json` | 新增 `web-push`（发推送的库）；新增 `npm run db:details` |
| `.env.local` / `.env.example` | 新增 `VAPID_PUBLIC_KEY`、`VAPID_PRIVATE_KEY`、`CRON_SECRET`。`.env.local` 里的是真值（不进 git），`.env.example` 里是空的占位 |
| `db/schema.sql` | `shifts` 表加了一列 `reminder_sent_at`，记录这个时段的提醒发过没有 |
| `lib/push.ts` | 发一条推送的函数 `sendPush` |
| `lib/push-subscription.ts` | 检查手机发来的订阅数据是否合法 |
| `scripts/check-push-subscription.ts` | 上面那个检查函数的自测 |
| `public/sw.js` | service worker：收到推送就弹通知，点通知就打开个人页 |
| `components/notify-button.tsx` | "Turn on reminders" 按钮和它的各种状态 |
| `components/volunteer-view.tsx` | 把按钮放在名字和卡片之间 |
| `app/globals.css` | 按钮和提示框的样式 |
| `app/api/push/subscribe/route.ts` | 保存订阅 |
| `app/api/push/test/route.ts` | 给自己发一条测试通知 |
| `app/api/cron/reminders/route.ts` | 每分钟被调用一次，发"马上开始"的提醒 |
| `lib/time.ts` | 新增 `REMINDER_MINUTES = 10`：提前几分钟提醒，只在这里改 |
| `scripts/apply-task-details.ts` | 把 `task-details.json` 写进数据库（`npm run db:details`） |

## `components/notify-button.tsx`：按钮的几种状态

| 状态 | 什么时候 | 显示什么 |
|---|---|---|
| `needs-home-screen` | iPhone 上用 Safari 直接打开（没从主屏幕打开） | 教他点 Share → Add to Home Screen，再从主屏幕打开 |
| `off` | 还没开通知 | 一句说明 + 琥珀色按钮 "Turn on reminders" |
| `working` | 点了按钮，正在处理 | 按钮变成 "Turning on…"，不能再点 |
| `on` | 已经开了 | "Reminders are on for this phone." + "Send a test notification" 按钮 |
| `blocked` | 用户点了"不允许" | 告诉他去手机设置里打开 |
| `error` | 其他错误 | "Try again" 按钮 |
| `not-set-up` | 服务器上没有 VAPID 公钥（Vercel 环境变量没填） | "Reminders aren't available yet." |
| `unsupported` | 很老的浏览器 | 什么都不显示 |

几个细节：
- **为什么 iPhone 要先添加到主屏幕？** iPhone 的 Safari 只有在"从主屏幕打开"时才提供推送功能（`PushManager`）。所以代码看到没有 `PushManager`、又是 iPhone，就显示添加到主屏幕的说明。
- **必须是点按钮才申请权限**：iPhone 规定，只有用户亲手点了什么，才能弹"允许通知吗"。所以 `turnOn()` 直接在点击里运行。
- **页面一打开就注册 `sw.js`**；如果这台手机已经开过通知，就把订阅**再存一次**。这样就算同一台手机之前是别人用的，现在也会归到当前这个人名下。
- `keyBytes()`：VAPID 公钥是一串文字，有些版本的 Safari 只接受原始字节，所以先转一下。
- 公钥是服务器通过 props 传给按钮的（`process.env.VAPID_PUBLIC_KEY`），不用另外设 `NEXT_PUBLIC_` 变量。公钥本来就是公开的，私钥只在服务器上。

## `app/api/push/subscribe/route.ts`：保存订阅

- 先用 `parseSubscription` 检查：`endpoint` 必须是 `https://` 开头、不超过 1000 字；两把钥匙只能是 base64url 字符、不超过 200 字。**从网上来的数据一律不信任。**
- `slug` 只能是小写字母、数字和 `-`。
- 一条 SQL 搞定：`insert ... select ... from volunteers where slug = ...`。找不到这个志愿者就什么都不插入，返回 404。
- `on conflict (endpoint) do update`：同一台手机再存一次就是更新，不会重复。

## `app/api/push/test/route.ts`：测试通知

只能发给**已经存在数据库里的**那台手机，而且要提供它的 `endpoint`，只有那台手机自己知道这个值。所以别人没法用这个接口骚扰其他志愿者。

## `lib/push.ts`：`sendPush`

- `urgency: "high"`：手机在省电模式时也尽快送达。
- `TTL`（存活时间，单位秒）：如果手机一直离线，超过这个时间就不送了，**宁可不送，也不要很晚才送到**。
- 推送服务返回 404 或 410，说明这个订阅已经失效（删了 app、关了通知），就把它从数据库里删掉。

## `app/api/cron/reminders/route.ts`：任务前提醒

1. 先检查请求头 `Authorization: Bearer <CRON_SECRET>`，不对就返回 401。没有这个密码的人调用不了。
2. **一条 `update ... returning` 同时"找出到点的时段"和"标记为已提醒"**。条件是：还没提醒过、还没开始、10 分钟之内开始。这样就算两次调用撞在一起，每个时段也只会被其中一次拿到，不会重复提醒。
3. 已经开始的时段跳过：开始了才收到"马上开始"反而让人困惑。
4. 找出这些志愿者的所有订阅（一个人可能有两台设备），每台发一条：
   - 标题：`Proctors at 1:30 PM`
   - 内容：`Starts soon · PG6 Lobby`（没填地点就只写 `Starts soon`）
   - 点开：这个人的个人页
5. TTL 设成"离开始还有几秒"，过了开始时间就不送了。

我用数据库检查过这个条件：假装现在是比赛日 11:52，它正好选出 12:00 开始的 28 个时段（Lunch、Print Running、Photography）。

**注意**：`npm run db:import -- ... --reset` 会删掉所有时段再重建，`reminder_sent_at` 也会一起清空，提醒会重新发。比赛当天不要在提醒已经开始发之后再 reset。

## `public/sw.js`

- `push` 事件：把服务器发来的 JSON `{ title, body, url }` 弹成通知，图标用我们的主屏幕图标。
- `notificationclick` 事件：点通知时，如果这个页面已经开着就切过去，没开就打开它。

## `scripts/apply-task-details.ts`：填地点

- 你在 `data/task-details.json` 里填好 `location`（和 `instructions`）后，运行 `npm run db:details`，就会写进数据库，网站上的卡片马上显示新地点，**不用重新部署**。
- 留空的不会覆盖数据库里已有的内容（和导入脚本一样用 `coalesce`）。
- JSON 里的任务名必须和数据库里**一字不差**，对不上的会打印 "Skipped"。
- 我在 JSON 最上面加了 `Breakfast Setup`。
- `instructions`（说明）现在会存进数据库，但卡片上还没显示，等你给各任务的文档模板以后再决定怎么显示。

## 怎么测试

1. `.env.local` 里的三个新值复制到 Vercel（见 CLAUDE.md），push 部署。
2. iPhone：从主屏幕打开 FIU ICPC Hub → 点 "Turn on reminders" → 允许 → 点 "Send a test notification"，几秒内应该收到通知。点通知应该打开你的页面。
3. 安卓：Chrome 打开你的链接，同样操作。
4. 任务前提醒要等 cron-job.org 设好；比赛当天之前不会有任何时段"10 分钟内开始"，所以平时调用它什么都不会发。

## 第二轮：签到提醒（2026-11-02）

| 文件 | 作用 |
|---|---|
| `db/schema.sql` | `volunteers` 表加了一列 `checkin_reminder_sent_at`：签到提醒发过没有 |
| `app/api/cron/reminders/route.ts` | 每分钟除了发任务提醒，也发签到提醒 |
| `app/admin/actions.ts` | 管理页改了到场时间，就清空 `checkin_reminder_sent_at`，新的时间还会再提醒 |
| `lib/rooms.ts` | `CHECK_IN_LOCATION = "PG6 112"`，Check in 卡片和签到提醒共用这一个值 |

**签到提醒**：到场时间前 10 分钟，推送标题 `Check in at 12:00 PM`，内容 `Go to PG6 112 first, before anything else`，点开是这个人的个人页。

**和任务提醒的关系**：比如 12:00 到场、12:00 午饭的人，11:50 左右会收到两条：
1. "Check in at 12:00 PM"
2. "Lunch at 12:00 PM"

代码里**先发签到、再发任务**，所以手机上签到那条一般排在前面。

**防止重复**的做法和任务提醒一样：一条 `update ... returning` 同时"找出到点的人"和"标记已发"。

**顺手修的问题**：任务提醒原来用的是任务本身的地点（`t.location`），所以 Print Running 的人收到的是 "PG6 105 or 106"。现在改成和卡片一样，先用这个人自己的地点：`coalesce(s.location, t.location)`。所以他们收到的是 "PG6 105" 或 "PG6 106"。

**代码结构**：原来发送部分是写死给任务用的，现在提成了一个 `sendAll(rows, message)`：给每一行找到这个人的所有手机，每台发一条。签到和任务都用它。

**测过的**（本地）：
- 用数据库验证：假装现在是比赛日 11:52，正好选出 12:00 到场的 12 个人。
- 实际测试：临时把 Lingtong 的到场时间改成"6 分钟后"，调用一次本地接口，返回 `{"checkIns":1,"shifts":0,"sent":2,"failed":0}`（他有两台设备开了通知）。马上再调用一次，返回 `checkIns: 0`，说明没有重复。测完已经把到场时间改回 11 月 7 日 8:00 AM。
