# NeuroNotes

一个知识图谱式笔记应用。  
现在这个仓库已经包含：

- 前端主界面
- 轻量级本地 Node API
- 离线本地存储兜底
- Android Capacitor 壳工程

用户可以在图谱里创建大类、创建知识点、点击节点查看笔记、进入编辑页写 Markdown / 代码块 / LaTeX 公式，并手动点选连线。

## 现在能做什么

- 左侧按大类文件夹展开知识点
- 图谱节点点击查看笔记
- 编辑知识点标题、分类、标签、摘要
- 编辑完整 Markdown 笔记
- 支持代码块
- 支持 `$...$`、`$$...$$`、`\(...\)`、`\[...\]` 数学公式
- 支持 `[[双链]]` 风格内容
- 手动点选知识点建立连线
- 后端可用时保存到 `server/data/graph.json`
- 后端不可用时自动退回浏览器本地存储
- 已接入 Android 打包工程

## 目录说明

- `src/`：前端 React + TypeScript 页面
- `server/`：轻量级本地 API 与示例数据
- `public/`：PWA 资源
- `android/`：Capacitor Android 工程
- `dist/`：前端构建产物

## 环境要求

### Web / 本地开发

- Node.js 18+
- npm

### Android 打包

- JDK 21
- Android SDK
- Windows 下建议把项目放在纯英文路径

如果项目路径里有中文，Android Gradle 可能报 `non-ASCII characters`。  
临时绕过方式是在 `android/gradle.properties` 里加入：

```properties
android.overridePathCheck=true
```

## 本地开发

先安装依赖：

```bash
npm install
```

### 方式 1：前端 + 本地 API

开两个终端。

终端 1：

```bash
npm run dev
```

终端 2：

```bash
npm run api
```

然后打开终端里显示的地址，默认一般是：

```bash
http://localhost:5173
```

这种方式下，数据会保存到：

```text
server/data/graph.json
```

### 方式 2：只跑前端

```bash
npm run dev
```

如果本地 API 没启动，应用会自动切到浏览器本地存储模式，依然可以创建、编辑、删除笔记，只是数据不会写回 `server/data/graph.json`。

## 平板 / 局域网访问

如果你想让同一局域网里的平板或手机访问开发环境：

前端：

```bash
npm run dev:tablet
```

后端：

```bash
npm run dev:api
```

然后用你电脑的局域网 IP 打开：

```text
http://你的局域网IP:5173
```

后端默认在：

```text
http://你的局域网IP:8787
```

## 构建前端

```bash
npm run build
```

构建完成后产物在：

```text
dist/
```

本地预览：

```bash
npm run preview
```

## Android 打包

仓库已经接入 Capacitor，相关命令如下：

```bash
npm run android:copy
npm run android:sync
npm run android:open
```

### 首次生成或同步 Android 工程

如果 `android/` 已存在，通常只需要：

```bash
npm run build
npm run android:sync
```

### Windows 下命令行打 debug APK

PowerShell 里先设置环境变量：

```powershell
$env:JAVA_HOME="C:\Program Files\Microsoft\jdk-21.0.9.10-hotspot"
$env:ANDROID_HOME="C:\Users\lenovo\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:GRADLE_USER_HOME="$PWD\.gradle-cache"
```

然后进入 Android 工程：

```powershell
cd android
.\gradlew.bat assembleDebug
```

生成后的 APK 默认在：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## 当前仓库里你最常用的命令

```bash
npm install
npm run dev
npm run api
npm run build
npm run android:sync
```

## 已知事项

- Android 打包时请优先使用 JDK 21，不要用 JDK 25
- Windows 中文路径可能导致 Android 构建失败
- `node_modules/`、`.gradle-cache/`、`.npm-cache/`、`android/app/build/` 这类目录不建议提交

## 当前状态

这不是一个只停留在静态原型的仓库了。  
它现在已经可以作为一个轻量级知识图谱笔记系统继续开发和使用。
