# NeuroNotes 平板使用说明

## 一键启动

1. 确保电脑和平板连接同一个 Wi-Fi。
2. 如果是第一次在一台新电脑上使用，确保电脑已安装 Node.js；脚本会自动安装项目依赖。
3. 在电脑上双击 `start-tablet.cmd`。
4. 等它显示电脑的 IPv4 地址。
5. 在平板浏览器打开：

```text
http://电脑IPv4地址:4173
```

例如：

```text
http://192.168.1.23:4173
```

## 安装到桌面

- iPad：用 Safari 打开页面，点分享按钮，选择“添加到主屏幕”。
- Android 平板：用 Chrome 打开页面，选择“安装应用”或“添加到主屏幕”。

## 使用时要保持运行

平板只是访问电脑上的服务，所以使用时电脑上这两个窗口要保持打开：

- `NeuroNotes API`
- `NeuroNotes Tablet Web`

## 如果平板打不开

1. 检查电脑和平板是否在同一个 Wi-Fi。
2. 检查地址是否写成 `http://电脑IPv4地址:4173`。
3. Windows 防火墙如果弹窗，允许 Node.js 访问专用网络。
4. 如果公式没有渲染，确认平板能访问网络，因为 MathJax 公式渲染器会从 CDN 加载。

## 手动启动

也可以不用脚本，手动运行：

```bash
npm.cmd run build
npm.cmd run dev:api
npm.cmd run preview:tablet -- --port 4173
```
