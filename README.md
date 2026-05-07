# NeuroNotes Prototype

一个移动端 / 平板 / 桌面都能用的知识图谱笔记前端原型。

## 现在已有的交互

- 知识点节点展示
- 节点自动连线视觉效果
- 点击节点打开内容面板
- 放大 / 缩小 / 重置视图
- 好吧我也不知道这个到底会变成什么样因为已经有一个超级牛逼的黑曜石了，但这是我第一个github项目我想继续做下去
- 鼠标滚轮缩放
- 拖动画布平移
- 标签筛选
- 手机和平板响应式布局
- 比obsidian更加轻便好用的
## 本地运行


##
- 本次更新：实现了一定的前后端关联功能
- 可以正常的增删改查文件
##
##
以下为工作方式
##
```bash
npm install
npm run dev
npm run api

```

然后打开终端里显示的本地地址，比如：

```bash
http://localhost:5173
```

## 下一步建议
说实话我还没想好
# NeuroNotes

NeuroNotes is a mobile-first knowledge graph note-taking app.

It turns notes, concepts, and tags into an interactive graph. Users can zoom, pan, and tap any node to view related content.

## Preview

NeuroNotes is currently an early frontend prototype.

Current prototype features:

- Interactive knowledge graph
- Mobile and tablet friendly layout
- Zoom and pan canvas
- Tap nodes to open note content
- Tag filtering
- Auto-connected concept relationships
- Dark futuristic UI

## Tech Stack

- React
- Vite
- TypeScript
- CSS

## Getting Started

Clone the project:

```bash
git clone https://github.com/Lanceashire/neuro-notes.git
cd neuro-notes
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open the local address shown in the terminal.

## Project Vision

NeuroNotes aims to become a visual note-taking tool where related knowledge points are automatically connected.

Instead of only writing notes in a list, users can explore their knowledge as a graph:

- Notes become nodes
- Related concepts become edges
- Tags become clusters
- Users can zoom, pan, and open each note from the graph

## Roadmap

- [x] Create frontend prototype
- [x] Display knowledge graph nodes
- [x] Add zoom and pan interaction
- [x] Open note content by clicking nodes
- [x] Add tag filtering
- [ ] Create new notes
- [ ] Edit notes
- [ ] Delete notes
- [ ] Save notes locally
- [ ] Support `[[double links]]`
- [ ] Generate graph from real notes
- [ ] Export notes as Markdown
- [ ] Add PWA support
- [ ] Add AI-powered semantic linking

## License

This project is currently under active development.
