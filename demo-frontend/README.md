<div align="center">

# 码途智辅 · AI 智能助教平台

**面向高职计算机教学的「AI + 教育」一体化学习平台**

Vue 3 · Vite 5 · Element Plus · Pinia · Vue Router · ECharts · 多模型一键切换

</div>

---

## 一、项目简介

「码途智辅」是一款面向高职院校计算机专业学生与教师的 AI 辅助教学平台。学生端提供智能答疑、学习诊断、技能训练（含五维能力评价）与考试辅导；教师端提供数据驱动的班级与作业管理。平台底层采用**多模型一键切换**架构，可在「智谱 GLM-4 / 豆包 Doubao / 本地 Qwen」之间自由切换。

> 本项目为「息壤杯 AI+ 教育与办公」参赛作品的前端演示工程。

### 核心功能

| 模块 | 角色 | 说明 |
| --- | --- | --- |
| AI 智能导师 | 学生 | 与大模型对话答疑，支持 Markdown 与代码高亮 |
| 学习诊断 | 学生 / 教师 | 生成学习画像，定位薄弱知识点 |
| 技能训练 | 学生 | 编程题库（150 道，简单/中等/困难各 50），AI 五维智能评价 |
| 考试辅导 | 学生 | 依据考试类型/水平生成个性化备考计划（真实 AI 生成） |
| 我的作业 | 学生 | 接收教师发布的作业 |
| 教师平台 | 教师 | 班级总览 / 学生管理 / 作业批改 / 教学效果分析 |

---

## 二、环境要求

- **Node.js ≥ 18**（推荐 18 LTS 或 20 LTS）
- **npm ≥ 9**（或使用 pnpm / yarn）
- 现代浏览器（Chrome / Edge 最新版）

检查版本：

```bash
node -v
npm -v
```

---

## 三、快速开始（三步跑起来）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（见第四节，复制模板并填写）
#    Windows:  copy .env.example .env
#    macOS/Linux:  cp .env.example .env

# 3. 启动开发服务器（默认 http://localhost:3000）
npm run dev
```

启动后，浏览器会自动打开 `http://localhost:3000`。

### 其他常用命令

```bash
npm run build     # 生产构建，产物输出到 dist/
npm run preview   # 本地预览已构建的产物
```

### 🔧 依赖丢了怎么恢复？（重要）

为了压缩体积、便于打包上传（**提交压缩包时必须删除 `node_modules`**），项目里一般不含 `node_modules` 目录。它**不需要手动下载**，只要执行一条命令即可根据 `package.json` 自动还原全部依赖：

```bash
npm install
```

> `npm install` 会自动读取项目里的 `package.json` / `package-lock.json`，从 npm 仓库把所有依赖下载回 `node_modules` 目录。装完后直接 `npm run dev` 即可运行。

如果网络较慢或安装失败，可改用国内镜像后再安装：

```bash
# 临时使用淘宝 npmmirror 镜像
npm install --registry=https://registry.npmmirror.com

# 或者先永久设置为默认镜像，再安装
npm config set registry https://registry.npmmirror.com
npm install
```

**彻底重装的兜底做法**（依赖损坏 / 版本冲突时）：

```bash
# Windows (PowerShell / CMD)
rmdir /s /q node_modules
del package-lock.json
npm install

# macOS / Linux
rm -rf node_modules package-lock.json
npm install
```

> 结论：**`node_modules` 永远不用手动下载，也不需要随代码一起提交**；只要有 `package.json`，一条 `npm install` 就能完全恢复。

### 演示账号

登录页可选择「学生」或「教师」入口，演示环境用户名任意填写、密码任意：

| 角色 | 演示账号 | 可访问功能 |
| --- | --- | --- |
| 学生 | 张三 | AI 导师、学习诊断、技能训练、考试辅导、我的作业 |
| 教师 | 李老师 | 学习诊断、教师平台（班级/作业/分析） |

---

## 四、环境变量配置（`.env`）

在项目根目录创建 `.env` 文件（可从 `.env.example` 复制）。**该文件含密钥，已被 `.gitignore` 忽略，请勿提交到 Git。**

### 4.1 运行模式

| 变量 | 说明 | 可选值 |
| --- | --- | --- |
| `VITE_API_MODE` | 运行模式 | `api`（调用真实大模型，默认）/ `demo`（本地模拟，不联网） |

### 4.2 多模型一键切换

平台支持三种大模型，可通过页面顶栏的模型徽标**一键切换**，选择结果自动保存到浏览器本地。只需配置你要用的模型即可：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_ACTIVE_MODEL` | 默认激活的模型 | `zhipu` |
| `VITE_ZHIPU_BASE_URL` | 智谱接口地址（经本地代理） | `/ai/api/paas/v4` |
| `VITE_ZHIPU_KEY` | 智谱 API Key | —（需填写） |
| `VITE_ZHIPU_MODEL` | 智谱模型名 | `glm-4` |
| `VITE_DOUBAO_BASE_URL` | 豆包接口地址（经本地代理） | `/db/api/v3` |
| `VITE_DOUBAO_KEY` | 火山方舟 API Key | —（可选） |
| `VITE_DOUBAO_MODEL` | 豆包接入点 / 模型 | `doubao-pro-32k` |
| `VITE_QWEN_BASE_URL` | 本地 Qwen 地址（经本地代理） | `/api/v1` |
| `VITE_QWEN_KEY` | 本地 Ollama 密钥 | `ollama` |
| `VITE_QWEN_MODEL` | 本地模型名 | `qwen2.5:7b` |

### 4.3 `.env` 示例

```dotenv
# 运行模式：api = 真接大模型；demo = 本地模拟
VITE_API_MODE=api

# 默认激活模型：zhipu / doubao / qwen
VITE_ACTIVE_MODEL=zhipu

# ① 智谱 GLM-4（默认，开箱可用）
VITE_ZHIPU_BASE_URL=/ai/api/paas/v4
VITE_ZHIPU_KEY=你的智谱APIKey
VITE_ZHIPU_MODEL=glm-4

# ② 豆包 Doubao（可选，需填火山方舟密钥）
VITE_DOUBAO_BASE_URL=/db/api/v3
VITE_DOUBAO_KEY=
VITE_DOUBAO_MODEL=doubao-pro-32k

# ③ 本地 Qwen2.5（可选，需本地 Ollama）
VITE_QWEN_BASE_URL=/api/v1
VITE_QWEN_KEY=ollama
VITE_QWEN_MODEL=qwen2.5:7b
```

> ⚠️ **重要**：修改 `.env` 后必须**重启开发服务器**（`Ctrl+C` 后重新 `npm run dev`），Vite 才会重新读取环境变量。

### 4.4 关于跨域（CORS）

浏览器直接请求大模型接口会被跨域策略拦截。项目已在 `vite.config.js` 中配置**本地代理转发**，前端只需请求同源路径，由本地服务器代理到上游：

| 前端前缀 | 目标地址 | 用途 |
| --- | --- | --- |
| `/ai/*` | `https://open.bigmodel.cn/*` | 智谱 GLM-4 |
| `/db/*` | `https://ark.cn-beijing.volces.com/*` | 豆包 Doubao |
| `/api/*` | `http://localhost:11434/*` | 本地 Qwen（Ollama） |

因此 `.env` 中的地址填**相对路径**（如 `/ai/api/paas/v4`）即可，无需填写完整域名。

### 4.5 可选：启用本地 Qwen

如需使用本地模型，请先安装 [Ollama](https://ollama.com) 并拉取模型：

```bash
ollama pull qwen2.5:7b
ollama serve   # 默认监听 http://localhost:11434
```

---

## 五、目录结构

```
demo-frontend/
├── public/                 # 静态资源
├── src/
│   ├── api/
│   │   ├── models.js       # 多模型注册表与一键切换逻辑
│   │   ├── request.js      # 统一请求封装（按当前模型路由）
│   │   └── ollama.js       # 流式对话与大模型调用
│   ├── assets/             # 全局样式
│   ├── data/
│   │   └── problems.js     # 技能训练题库（150 道）
│   ├── router/
│   │   └── index.js        # 路由与登录/角色权限守卫
│   ├── stores/
│   │   └── user.js         # 用户、通知、作业状态（Pinia）
│   ├── views/              # 页面
│   │   ├── LoginView.vue       # 登录（学生 / 教师）
│   │   ├── TutorView.vue       # AI 智能导师
│   │   ├── DiagnosisView.vue   # 学习诊断
│   │   ├── TrainingView.vue    # 技能训练
│   │   ├── ExamView.vue        # 考试辅导
│   │   ├── HomeworkView.vue    # 我的作业
│   │   └── TeacherView.vue     # 教师平台
│   ├── App.vue             # 布局外壳（顶栏 / 侧栏 / 多模型切换）
│   └── main.js             # 应用入口
├── .env                    # 环境变量（本地，含密钥，不提交）
├── .env.example            # 环境变量模板
├── index.html              # HTML 入口
├── package.json
├── vite.config.js          # Vite 配置（含多模型代理）
└── README.md
```

---

## 六、技术栈

| 分类 | 技术 |
| --- | --- |
| 框架 | Vue 3（组合式 API） |
| 构建 | Vite 5 |
| UI 组件 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| 图表 | ECharts / vue-echarts |
| 内容渲染 | marked（Markdown）、highlight.js（代码高亮） |
| 网络请求 | axios |

---

## 七、常见问题（FAQ）

**Q1：启动后页面空白 / 接口报错？**
A：确认已复制 `.env` 并填写有效的 API Key；确认网络可访问大模型服务；修改 `.env` 后需重启开发服务器。

**Q2：提示「跨域」或被浏览器拦截？**
A：请通过 `npm run dev` 启动（走 Vite 代理）。不要直接用 `file://` 双击打开 `dist/index.html` 调用在线接口。

**Q3：想切模型但顶栏只有默认模型？**
A：点击顶栏右上角的模型徽标即可展开「一键切换 AI 模型」菜单；相关模型的 Key 需先在 `.env` 中配置。

**Q4：端口 3000 被占用？**
A：修改 `vite.config.js` 中 `server.port`，或运行 `npm run dev -- --port 3001`。

**Q5：没有 API Key 也想看效果？**
A：将 `.env` 中 `VITE_API_MODE` 改为 `demo`，即可使用本地模拟数据离线演示。

**Q6：删掉了 `node_modules`，怎么下载回来？**
A：**不用手动下载**，在项目根目录执行 `npm install` 即可自动还原全部依赖（依据 `package.json`）。若安装慢，用镜像：`npm install --registry=https://registry.npmmirror.com`。详见第三节「依赖丢了怎么恢复？」。

**Q7：提交压缩包时需要删除 `node_modules` 吗？**
A：需要。`node_modules` 体积大（通常几百 MB），是代码提交/上传的常见「技术硬伤」。压缩前请删除 `node_modules`（可保留 `package-lock.json`）；评委解压后执行 `npm install` 即可还原，再 `npm run dev` 运行。

---

## 八、注意事项

- `.env` 含密钥，**请勿提交到 Git 仓库**或对外分享。
- 项目仅供教学演示与竞赛展示使用。

---

<div align="center">码途智辅 · AI 智能助教平台 · 让编程学习更高效</div>
