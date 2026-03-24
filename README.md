# 📱 小手机 (Mini Phone)

> 一个运行在浏览器中的仿真手机 Web App，支持 PWA 安装到桌面。
> 内置 AI 角色聊天、情侣空间、日记、论坛等 14 个 App，所有 AI 均通过用户自配置的 API Key 驱动。

---

## 🧠 给 AI 助手的说明（每次对话必读）

**这是一个正在开发中的个人项目。每次找 AI 帮忙时，请把此 README 一并提交，以便 AI 了解项目全貌。**

- 作者是代码小白，代码由 AI 生成后在 VSCode 中手动搬运整合
- 功能清单会随时调整，以最新版 README 为准
- 提问时请说明：你在修改哪个 App、哪个功能、遇到什么问题

---

## 🎨 设计风格

整体采用 **editorial serif 报纸/文学杂志美学**：
- 字体：Georgia / Times New Roman 衬线字体
- 配色：高对比度**纯白黑**，背景色 `#ffffff`（纯白，非米白）
- 图标：几何 Unicode 符号（○ ◎ ◆ ◇ □ ♡ ☆ ☺ 等），统一替代彩色图标
- 排版：细线（1px `#111`）横向规则线分隔区块，报纸刊头感
- 交互：hover 反色（黑底白字），active 轻微缩放

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4 |
| AI | `@google/genai`（Gemini，支持 OpenAI 格式接口） |
| 动画 | Motion |
| Markdown | react-markdown + remark-gfm |
| 数据库 | better-sqlite3（本地） |
| 服务端 | Express（本地 API） |
| PWA | manifest.json（可添加到手机/电脑桌面） |

---

## 📁 项目结构

```
src/
├── apps/
│   ├── wechat/          # App1 微信（最复杂，已有子页面）
│   │   ├── components/
│   │   │   └── WeChatNav.tsx        # 底部导航栏（editorial 风格）
│   │   ├── pages/
│   │   │   ├── Core/
│   │   │   │   ├── AppearancePage.tsx
│   │   │   │   ├── CollectionsPage.tsx
│   │   │   │   ├── CorePage.tsx
│   │   │   │   ├── EmojiManagerPage.tsx  # 表情包管理页
│   │   │   │   ├── MasksPage.tsx    # 面具系统
│   │   │   │   └── ChatPage.tsx
│   │   │   ├── OrbitPage.tsx
│   │   │   ├── SignalsPage.tsx
│   │   │   └── SoulsPage.tsx
│   │   ├── utils/
│   │   │   └── emojiStorage.ts      # 表情包数据层（localStorage + IndexedDB）
│   │   ├── index.tsx
│   │   └── types.ts
│   ├── settings/        # App2 设置（index.tsx）
│   ├── beautify/        # App3 美化（index.tsx）
│   ├── diary/           # App4 日记（index.tsx）
│   └── couples/         # App5 情侣空间（index.tsx）
│   # App6~14 待创建
├── App.tsx              # 主手机框架 + 桌面 App 图标
├── main.tsx
└── index.css
```

---

## 💾 localStorage 存储 Key 一览

| Key | 内容 | 使用位置 |
|-----|------|----------|
| `souyee_os_api_key` | API Key | 设置 App |
| `souyee_os_base_url` | API Base URL | 设置 App |
| `souyee_os_config` | API 完整配置（baseUrl + apiKey + model） | ChatPage |
| `souyee_os_desktop_profile` | 桌面名片（昵称/头像/签名/位置），纯装饰性 | App.tsx HeroCard |
| `souyee_os_core_identity` | CorePage 身份区（昵称/头像），纯装饰性 | CorePage.tsx |
| `souyee_os_masks` | 面具列表（头像/姓名/人设） | MasksPage.tsx |
| `souyee_os_wechat_characters` | 联系人 + 聊天记录 | wechat/index.tsx |
| `souyee_os_wechat_favorites` | 收藏消息 | wechat/index.tsx |
| `souyee_appearance_global` | 界面外观设置（背景/气泡CSS/主题CSS） | AppearancePage.tsx |
| `souyee_inner_voice_${contact.id}` | 每个联系人的心声历史 | ChatPage.tsx |
| `_chat_settings_${contact.id}` | 每个联系人的聊天参数（含面具选择） | ChatPage.tsx |
| `souyee_os_emoji_groups` | 表情包分组列表（含绑定联系人、URL表情） | emojiStorage.ts |

> 本地上传的表情包图片存储在 **IndexedDB**（数据库名 `souyee_emoji_db`），不在 localStorage 中。

> ⚠️ 桌面个人信息（`souyee_os_desktop_profile`）和 CorePage 身份（`souyee_os_core_identity`）是**纯装饰性**，与面具系统无关，互不影响。
>
> ⚠️ 所有 localStorage key 已从 `starry_os_` 统一改为 `souyee_os_`，如遇数据丢失请检查 key 名是否一致。

---

## 📦 本地开发

```bash
npm install
# 在 .env.local 中填入你的 API Key
npm run dev
# 访问 http://localhost:3000
```

---

## 🚀 部署流程（GitHub + Cloudfare）

项目通过 GitHub 连接 Cloudfare 自动部署。**本地 `npm run build` 不会同步到线上**，需要 push 到 GitHub 后由 Cloudfare 自动构建。

### 每次改完代码后，在终端执行：

```bash
git add .
git commit -m "描述本次改动"
git push
```

Cloudfare 检测到 push 后会自动构建，约 1~2 分钟后生效。可在 Cloudfare 后台 **Deploys** 页面查看构建状态，变为绿色 **Published** 即为成功。

### 快捷方式（可选）

在 `package.json` 的 `scripts` 中添加：

```json
"deploy": "git add . && git commit -m 'update' && git push"
```

之后直接运行：

```bash
npm run deploy
```

### ⚠️ PWA 注意事项

修改 `manifest.json` 后，手机上的旧 PWA 快捷方式**不会自动更新**，需要：
1. 删除桌面上的旧图标
2. 重新用浏览器访问并添加到桌面

---

## 📋 App 功能清单（开发状态速查）

> 图例：✅ 已完成 / 🚧 开发中 / 📝 待开发

---

### App 1 — 微信（核心聊天）`src/apps/wechat/`

**联系人管理**
- ✅ 创建、编辑、删除联系人（AI 角色）
- ✅ 拉黑功能（双向：user 拉黑 char / char 拉黑 user，拉黑后消息显示红色感叹号）
- ✅ 已移除"系统提醒"硬编码联系人

**消息功能**
- ✅ 长按消息：引用、编辑、收藏、复制、删除、撤回
- ✅ AI 每轮消息支持重新生成（重 roll）
- ✅ 显示"正在输入中..."状态（名字下方小字，名字始终显示）
- ✅ 允许 user 和 AI 连续发多条消息
- 📝 AI 主动发消息（后台保活机制）
- ✅ 聊天消息气泡下显示时间戳
- ✅ 搜索 / 清空 / 导出聊天记录
- ✅ 合并转发聊天记录
- 📝 群聊功能（多个 char 同时在线）

**AI 状态系统**
- ✅ 每轮对话实时刷新：心声 + 状态（如"焦躁😣"）+ 动作
- ✅ 心声历史保留最近 10 条
- ✅ 随正文请求一并生成，不额外消耗 API

**多媒体消息**
- ✅ 语音（虚拟文字转语音）
- ✅ 图片：文字描述生成 / 相册上传
- ✅ 红包（可加备注）、转账（可选接收/退还）
- ✅ 虚拟定位
- ✅ 虚拟语音通话、视频通话（双向发起，可接通或挂断）
- ✅ 表情包：URL 批量导入 / 本地图片上传，支持 GIF 动态表情
- ✅ 自定义"拍一拍"

**AI 扩展功能**
- ✅ AI 对 user 的备注（自动更新，user 可查看）
- ✅ AI 主动发表情包（在聊天设置中可开关，AI 根据情绪自主判断发哪个）
- 📝 头像库（AI 主动和 user 换头像）
- 📝 AI 主动发朋友圈；user 发朋友圈 AI 点赞/评论

**个性化设置**
- ✅ 聊天背景更换（单个 / 全部角色）
- ✅ 导入气泡 CSS / 全局聊天页面 CSS
- 📝 更换朋友圈背景、头像、昵称
- ✅ 设定 AI 记忆的上下文消息条数
- ✅ 设定 AI 每轮生成消息条数区间
- 📝 双语气泡（点击显示/隐藏翻译）
- 📝 user 手动总结聊天记忆
- ✅ 多"面具"系统（MasksPage 管理；好友设置页可选择面具；AI 请求时自动将面具身份注入 system prompt）

**表情包系统**（新）
- ✅ Core → 表情管理入口（`EmojiManagerPage`）
- ✅ 创建 / 重命名 / 删除表情组
- ✅ 每组可绑定多个联系人
- ✅ 批量导入 URL（支持「释义 URL」同行 或 释义/URL 换行两种格式混用）
- ✅ 本地图片上传（自动压缩至 ≤200KB，存 IndexedDB）
- ✅ 支持 GIF 动态表情
- ✅ 每张表情可设置释义（AI 发表情时按释义选择，user 发的表情 AI 也能通过释义理解含义）
- ✅ 聊天页笑脸按钮弹出表情面板（Tab 切换分组，点击直接发送）
- ✅ 长按 / hover 显示释义
- ✅ 管理（删除单张）只在 Core 页操作，聊天页面板纯发送

**UI 风格**
- ✅ 聊天页顶栏：白底黑字，贴屏幕顶端和两侧无缝隙，2px 黑线分隔，衬线字体
- ✅ 输入栏：白底，1px 黑线上边框，发送/回复按钮 editorial 风格
- ✅ 加号面板：白底，方形图标框（1px solid #111），与卡片风格统一
- ✅ 消息气泡：Georgia serif 字体，硬角（左上/右上 4px，其余 14px）
- ✅ 正在输入气泡：方形小点动画，editorial 风格

---

### App 2 — 设置 `src/apps/settings/`

- ✅ API 设置（Base URL + API Key，兼容所有 OpenAI 格式接口）
- ✅ 导出备份（JSON）、导入备份
- ✅ 危险操作区域：清除全部数据

---

### App 3 — 美化 `src/apps/beautify/`

- 📝 主屏幕壁纸更换、桌面图标更换
- 📝 导入字体（URL 或字体文件）

---

### App 4 — 日记 `src/apps/diary/`

- 📝 user 写日记，char 自动批注（划线）和评语
- 📝 char 自主写日记，user 可写评语，char 看到后回复
- 📝 按日期保留，不自动删除

---

### App 5 — 情侣空间 `src/apps/couples/`

- 📝 向 char 发起建立情侣空间请求，char 可接受或拒绝
- 📝 悄悄话/碎碎念：char 随机更新小纸条，user 可回复
- 📝 养宠物系统
- 📝 情书系统（与日记区分，可评论互动）
- 📝 纪念日 / 重要日期（如生日），char 会记得
- 📝 情侣空间主页显示在一起的天数

---

### App 6 — 世界书 `src/apps/worldbook/`（待创建）

- 📝 添加世界书（破限、增强活人感指令等）
- 📝 全局世界书：对所有角色所有时间生效
- 📝 局部世界书：绑定特定角色，可选填触发关键词

---

### App 7 — 钱包 `src/apps/wallet/`（待创建）

- 📝 查看余额、自定义充值、提现
- 📝 账单明细
- 📝 买理财、买彩票
- 📝 绑定亲属卡（亲属卡可代付）
- 📝 记账：消费分类、金额记录、周/月统计、角色评价

---

### App 8 — 商城 `src/apps/shop/`（待创建）

- 📝 购买商品（奢侈品、日用品等，支持自定义搜索）
- 📝 外卖
- 📝 购物车、支付方式：零钱 / 亲属卡 / 请角色代付
- 📝 可买给自己或送给角色，留存购物记录，角色可知晓

---

### App 9 — 记忆 `src/apps/memory/`（待创建）

- 📝 全局记忆：跨 App（微信、情侣空间、陪伴等）汇总
- 📝 显示日期、时间、角色记住的重要内容（长期记忆）
- 📝 分门别类（普通信息 / 关键约定 / …）
- 📝 不同角色的记忆分开存放
- 📝 user 可修改 char 的记忆

---

### App 10 — 论坛 `src/apps/forum/`（待创建）

- 📝 可编辑用户个人资料，char 可改网名
- 📝 每次刷新生成 NPC 帖子 + char 结合聊天记录发帖，自动生成评论
- 📝 支持论坛分区，user 可自定义
- 📝 user 可转发 / 收藏 / 删除帖子

---

### App 11 — 书城 `src/apps/bookstore/`（待创建）

- 📝 同人文区：写 user 和 char 的同人文，可追更、打赏、评论、收藏、转发
- 📝 原创文学区：各种主题/性向，功能同同人文区

---

### App 12 — 陪伴 `src/apps/companion/`（待创建）

- 📝 番茄钟：上传背景音乐，自主设立时间，专注中 char 有反应，累计专注统计
- 📝 一起看书：上传 txt，累计时间，实时与 char 讨论
- 📝 一起听歌：上传 mp3 或 URL，累计时间，实时与 char 讨论
- 📝 一起学习：上传 pdf/txt/其他，char 教知识点；也可不上传直接问（char 保持角色性格与记忆）

---

### App 13 — 日历 `src/apps/calendar/`（待创建）

- 📝 显示真实日历
- 📝 点击当天：user 选心情贴纸，char 相应自动选择
- 📝 点击日期：显示行程（时间轴）+ 待办（两栏）
- 📝 char 在聊天中读取日历内容，对 user 待办/行程进行监督提醒
- 📝 生理期记录，系统自动预测下个月，char 给予关怀

---

### App 14 — 查手机 `src/apps/phone-peek/`（待创建）

- 📝 自主选择查看哪个 char 的手机
- 📝 char 的手机有密码（需在微信里向角色要）；可选择强制破解（char 不知情）
- 📝 可查看 char 的微信、钱包支出、浏览器记录、备忘录、相册

---

## 🗒 开发备注

- 功能清单随时更新，以最新版 README 为准
- 所有 App 路由统一由 `App.tsx` 主框架管理
- AI 请求统一走设置 App 中配置的 Base URL + API Key（兼容 OpenAI 格式）
- 数据持久化：localStorage（前端），IndexedDB（表情包本地图片），后期考虑导出/导入备份方案
- 自定义状态栏已移除，使用手机原生状态栏（`env(safe-area-inset-top)` 留出安全区域）
- 面具系统已完成：MasksPage 管理 → 好友设置选择 → system prompt 注入，全链路打通
- 表情包系统已完成：emojiStorage 工具层 → EmojiManagerPage 管理 → ChatPage 发送面板 → AI system prompt 注入，全链路打通
- 所有背景色已从米白 `#fafaf8` 统一改为纯白 `#ffffff`
- Core tab 激活时隐藏微信顶部导航栏，由 CorePage 自己处理顶部安全区
- Signals 页不再有硬编码的"系统提醒"联系人
- EmojiManagerPage 使用 `position: fixed; z-index: 200` 覆盖底部导航栏