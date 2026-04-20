# 不装 Node，把 live-web 部署到 Firebase Hosting

Firebase 托管静态网页**通常要用命令行工具 `firebase`**。若你**不想在自己电脑上装 Node**，可以用下面两种方式之一。

---

## 方式 A：用浏览器里的「Cloud Shell」部署（推荐，约 10 分钟）

你的电脑**不用装任何东西**，只在浏览器里操作。

### 1. 把 `live-web` 里的文件放到网上

任选其一：

- 用 **GitHub**：新建仓库，把 `live-web` 文件夹里的全部文件上传上去（网页版 GitHub 支持拖拽上传）；或  
- 把 `live-web` 打成 **zip**，下一步在 Shell 里上传。

### 2. 打开 Google Cloud Shell

1. 打开：[https://shell.cloud.google.com/](https://shell.cloud.google.com/)  
2. 用 **你的 Google 账号** 登录（与 Firebase 同一个账号最省事）。  
3. 第一次会选项目：选择与 Firebase 项目 **`slb-open-day`** 关联的 Google Cloud 项目（一般同名或可在 Firebase 控制台「项目设置」里看到 **项目 ID**）。

### 3. 在 Shell 里拿到代码

**若代码在 GitHub：**

```bash
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库名
```

若你把 `live-web` 放在仓库子目录里，再 `cd live-web`。

**若你用 zip：** 在 Cloud Shell 点右上角 **「上传」**（三个点菜单里），上传 zip，然后：

```bash
unzip 你的文件.zip -d app && cd app
```

（请按你实际 zip 名称、解压后的文件夹名调整。）

### 4. 安装 Firebase CLI 并登录

```bash
npm install -g firebase-tools
firebase login
```

`firebase login` 会给你一个链接，在浏览器里点一下完成授权，回到 Shell 回车。

### 5. 确认当前目录里有这些文件

`index.html`、`firebase.json`、`.firebaserc`、`js/`、`firebase-config.js` 等应在**同一层**（本仓库的 `live-web` 就是这样）。

### 6. 部署

```bash
firebase use slb-open-day
firebase deploy --only hosting
```

成功后会显示 **Hosting URL**，例如：

`https://slb-open-day.web.app` 或 `https://slb-open-day.firebaseapp.com`

这就是给同学扫码的 **https 地址**。把它做成二维码即可。

---

## 方式 B：Firebase 控制台关联 GitHub（自动部署）

适合希望以后**改代码就自动更新**的情况。

1. 打开 [Firebase 控制台](https://console.firebase.google.com/) → 选项目 **slb-open-day**。  
2. 左侧 **构建 → Hosting**。  
3. 若看到 **「关联 GitHub」** / **Get started with GitHub**，按向导连接你的仓库并选择分支。  
4. 按官方提示完成（可能需要向 GitHub 授权）。

具体菜单名可能随版本变化，以控制台为准。官方说明：  
[https://firebase.google.com/docs/hosting/github-integration](https://firebase.google.com/docs/hosting/github-integration)

---

## 部署后必做：已授权网域

一般 **Firebase Hosting 默认域名**（`*.web.app`）已可用。若你还用 **自定义域名**，在：

**Firebase → 项目设置 → 常规 → 已授权网域** 里添加你的域名。

---

## 与本项目文件的关系

- `firebase.json`：声明网站根目录就是当前文件夹（静态文件直接部署）。  
- `.firebaserc`：默认项目 ID 为 `slb-open-day`。  
- `firebase-config.js`：会随网页一起部署；客户端配置可公开，安全靠 **Firestore 规则**。

---

## 若 `firebase deploy` 报错

- **Permission denied**：确认 Cloud Shell 登录的 Google 账号对该 Firebase 项目有权限。  
- **Hosting not enabled**：在 Firebase 控制台 **Hosting** 里先点一次「开始使用」。  
- **Wrong directory**：必须在包含 `index.html` 和 `firebase.json` 的 `live-web` 目录下执行命令。
