# 扫码版签到页部署说明（GitHub / 本地，无需 Node）

本目录是**纯静态网页** + **Google Firebase（免费档）**，适合：**同学们用自己的手机扫码**，**登记号全场连续**（R-001、R-002…），无需在你电脑上安装 Node。

---

## 一、你需要准备什么

1. 一个 **GitHub 账号**（用于托管网页与 `jobs.json`，免费）。
2. 一个 **Google 账号**，在 [Firebase 控制台](https://console.firebase.google.com/) 新建项目（免费 Spark 即可）。
3. 约 **15～30 分钟** 按下面步骤点完（可请公司 IT 同事代操作一次）。

---

## 二、配置 Firebase（只做一次）

1. Firebase 控制台 → 创建项目 → 关闭 Google Analytics 亦可。
2. 左侧 **构建 → Firestore Database** → **创建数据库** → 选「生产模式」或「测试模式」均可（随后用下面规则覆盖）。
3. 项目概览 → **向 Web 应用添加应用**（`</>` 图标）→ 注册应用 → 复制页面上的 **firebaseConfig** 对象。
4. 在本目录把 `firebase-config.example.js` **复制一份**为 `firebase-config.js`，把里面的字段改成控制台给你的值（可直接覆盖整个 `firebaseConfig`）。
5. Firebase 控制台 → **构建 → Firestore → 规则**，粘贴本目录 `firestore.rules` 的内容并**发布**。（此为活动用宽松规则，活动结束后建议删除项目或改严。）
6. Firebase 控制台 → **项目设置 → 已授权的网域**，添加你将来要用的地址，例如：
   - `localhost`（本地预览）
   - `你的用户名.github.io`（GitHub Pages）

---

## 三、部署到 GitHub Pages（推荐）

1. 新建 GitHub 仓库，把 **`live-web` 文件夹里的全部文件** 推到仓库**根目录**（或见下方「子目录」说明）。
2. 仓库 **Settings → Pages**：Source 选 **main** 分支、`/ (root)` 或 `/docs`（若你把文件放在 `docs/` 里）。
3. 等待几分钟，访问：  
   `https://<你的用户名>.github.io/<仓库名>/`  
   若页面空白，按 F12 看控制台；常见问题是 **firebase-config.js 未配置** 或 **未授权网域**。
4. **二维码**：用任意二维码生成器，把上面 **https 完整链接** 做成图片，投屏给同学扫。

### 若必须把页面放在子路径（例如 `/live-web/`）

把整个站点放在 `https://user.github.io/repo/live-web/` 也可以，只要 **`index.html`、`jobs.json`、`js/`、`firebase-config.js` 相对路径不变**（当前页面已用相对路径）。注意 Firebase 授权网域仍要包含 `user.github.io`。

---

## 四、本地预览（不发布也能测）

必须在 **http 服务**下打开（不要双击 `index.html` 用 `file://`，否则无法加载 `jobs.json` 与 ES 模块）。

在项目根目录执行其一：

```bash
cd live-web
npx --yes serve .
```

浏览器打开终端里提示的地址（如 `http://localhost:3000`）。

---

## 五、维护岗位 JD

编辑仓库里的 **`jobs.json`**（与 `index.html` 同级），提交并推送后，**刷新页面**即使用新岗位。无需后台服务器。

---

## 六、导出签到数据

本简化版**没有**管理后台导出 CSV。数据在 **Firebase → Firestore** 的 `checkins` 集合中，活动结束后由管理员在控制台手动导出或使用 Google 提供的导出方式。

---

## 七、与「完整 Node 版」的差异

| 功能           | live-web（本目录）     | `npm start` 完整版   |
|----------------|------------------------|----------------------|
| 安装 Node      | 不需要                 | 需要                 |
| 多人扫码共号   | 需要 Firebase          | 自带文件库           |
| 岗位管理后台   | 无（改 `jobs.json`）   | 有 `admin-jobs.html` |
| CSV 导出       | Firebase 控制台        | 有接口导出           |

---

## 八、故障排查

- **顶部黄条「单机演示模式」**：说明 `firebase-config.js` 仍为占位符或未通过校验；填好配置并刷新。
- **无法加载 jobs.json**：请用 `http://` 访问，不要用本地 `file://`。
- **Firestore Permission denied**：检查规则是否已发布；网域是否在 Firebase 授权列表中。
