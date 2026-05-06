import { PointerEvent, WheelEvent, useMemo, useRef, useState } from 'react';

type NoteType = 'core' | 'method' | 'concept' | 'detail';

type Note = {
  id: string;
  title: string;
  type: NoteType;
  tags: string[];
  x: number;
  y: number;
  size: number;
  content: string;
  links: string[];
};

type Edge = [string, string, number];

const notes: Note[] = [
  {
    id: 'nn',
    title: '神经网络',
    type: 'core',
    tags: ['AI', '深度学习'],
    x: 50,
    y: 42,
    size: 98,
    content: '神经网络是一种模仿生物神经系统的计算模型。它由输入层、隐藏层和输出层组成，通过权重、偏置和激活函数学习数据中的模式。',
    links: ['反向传播', '梯度下降', '激活函数', '损失函数'],
  },
  {
    id: 'bp',
    title: '反向传播',
    type: 'method',
    tags: ['训练', '算法'],
    x: 72,
    y: 30,
    size: 76,
    content: '反向传播用于计算损失函数对各层权重的梯度。它从输出层开始，把误差信号逐层传回，从而更新模型参数。',
    links: ['损失函数', '梯度下降', '神经网络'],
  },
  {
    id: 'gd',
    title: '梯度下降',
    type: 'method',
    tags: ['优化', '训练'],
    x: 69,
    y: 65,
    size: 82,
    content: '梯度下降是一种优化方法。它沿着损失函数下降最快的方向更新参数，使模型逐渐接近更优解。',
    links: ['反向传播', '学习率', '损失函数'],
  },
  {
    id: 'act',
    title: '激活函数',
    type: 'concept',
    tags: ['模型结构'],
    x: 29,
    y: 29,
    size: 72,
    content: '激活函数为神经网络引入非线性能力。常见函数包括 ReLU、Sigmoid、Tanh 和 GELU。',
    links: ['神经网络', 'ReLU'],
  },
  {
    id: 'loss',
    title: '损失函数',
    type: 'concept',
    tags: ['评估', '训练'],
    x: 34,
    y: 69,
    size: 76,
    content: '损失函数衡量模型预测和真实答案之间的差距。训练的目标就是不断降低损失。',
    links: ['梯度下降', '反向传播'],
  },
  {
    id: 'lr',
    title: '学习率',
    type: 'detail',
    tags: ['超参数'],
    x: 84,
    y: 78,
    size: 58,
    content: '学习率控制每次参数更新的步长。太大可能震荡，太小会训练缓慢。',
    links: ['梯度下降'],
  },
  {
    id: 'relu',
    title: 'ReLU',
    type: 'detail',
    tags: ['函数'],
    x: 16,
    y: 49,
    size: 56,
    content: 'ReLU 是常见激活函数，形式为 max(0, x)。它简单、高效，并且能缓解梯度消失问题。',
    links: ['激活函数'],
  },
  {
    id: 'emb',
    title: 'Embedding',
    type: 'concept',
    tags: ['AI', '语义关联'],
    x: 51,
    y: 18,
    size: 68,
    content: 'Embedding 可以把文字变成向量。以后可以用它判断两篇笔记在语义上是否接近，并自动生成知识连线。',
    links: ['神经网络', '语义关联'],
  },
];

const edges: Edge[] = [
  ['nn', 'bp', 0.95],
  ['nn', 'gd', 0.88],
  ['nn', 'act', 0.9],
  ['nn', 'loss', 0.72],
  ['nn', 'emb', 0.62],
  ['bp', 'gd', 0.9],
  ['bp', 'loss', 0.82],
  ['gd', 'loss', 0.86],
  ['gd', 'lr', 0.7],
  ['act', 'relu', 0.78],
  ['act', 'loss', 0.45],
];

const tags = ['全部', 'AI', '训练', '优化', '模型结构', '超参数', '函数', '语义关联'];

const noteTypeLabels: Record<NoteType, string> = {
  core: '核心概念',
  method: '方法',
  concept: '概念',
  detail: '细节',
};

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState('nn');
  const [selectedTag, setSelectedTag] = useState('全部');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;
  const selectedRelationCount = selectedNote?.links.length ?? 0;
  const noteMap = useMemo(() => Object.fromEntries(notes.map((note) => [note.id, note])), []);

  const visibleIds = useMemo(() => {
    if (selectedTag === '全部') return new Set(notes.map((note) => note.id));
    return new Set(notes.filter((note) => note.tags.includes(selectedTag)).map((note) => note.id));
  }, [selectedTag]);

  const visibleEdges = edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b));

  function zoomIn() {
    setZoom((value) => Math.min(1.6, Number((value + 0.12).toFixed(2))));
  }

  function zoomOut() {
    setZoom((value) => Math.max(0.55, Number((value - 0.12).toFixed(2))));
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    setZoom((value) => Math.max(0.55, Math.min(1.6, Number((value + direction).toFixed(2)))));
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;

    setDragging(true);
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + event.clientX - dragStart.current.x,
      y: dragStart.current.panY + event.clientY - dragStart.current.y,
    });
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🧠</div>
          <div>
            <h1>NeuroNotes</h1>
            <p>知识自动连成图</p>
          </div>
        </div>

        <button className="primary-button">＋ 新建知识点</button>

        <label className="search-box">
          <span>⌕</span>
          <input placeholder="搜索笔记 / 概念" />
        </label>

        <div className="sidebar-title">标签</div>
        <div className="tag-list">
          {tags.map((tag) => (
            <button
              key={tag}
              className={selectedTag === tag ? 'tag-button active' : 'tag-button'}
              onClick={() => setSelectedTag(tag)}
            >
              <span>{tag}</span>
              <small>{tag === '全部' ? notes.length : notes.filter((note) => note.tags.includes(tag)).length}</small>
            </button>
          ))}
        </div>

        <div className="ai-card">
          <strong>✨ 自动关联</strong>
          <p>第一版可以用 [[双链]]、标签和关键词匹配生成连线，后续再加入 embedding 做语义关联。</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <button className="round-button">☰</button>
            <div>
              <strong>NeuroNotes</strong>
              <span>知识图谱笔记</span>
            </div>
          </div>

          <label className="top-search">
            <span>⌕</span>
            <input placeholder="搜索知识点，比如：反向传播" />
          </label>

          <div className="graph-summary">
            <span>{notes.length} 个知识点</span>
            <span>{edges.length} 条关联</span>
          </div>

          <div className="zoom-tools">
            <span className="zoom-label">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomOut} className="round-button">−</button>
            <button onClick={zoomIn} className="round-button">＋</button>
            <button onClick={resetView} className="reset-button">重置</button>
          </div>
        </header>

        <div
          className={dragging ? 'graph-area dragging' : 'graph-area'}
          onWheel={handleWheel}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          <div className="grid-bg" />
          <div
            className="graph-canvas"
            style={{
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
            }}
          >
            <svg className="edges" viewBox="0 0 1000 760" preserveAspectRatio="none">
              <defs>
                <linearGradient id="edge" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(34,211,238,.88)" />
                  <stop offset="100%" stopColor="rgba(168,85,247,.88)" />
                </linearGradient>
              </defs>
              {visibleEdges.map(([source, target, weight]) => {
                const a = noteMap[source];
                const b = noteMap[target];
                const selected = selectedNoteId === source || selectedNoteId === target;
                return (
                  <line
                    key={`${source}-${target}`}
                    x1={a.x * 10}
                    y1={a.y * 7.6}
                    x2={b.x * 10}
                    y2={b.y * 7.6}
                    stroke="url(#edge)"
                    strokeWidth={1.5 + weight * 3}
                    opacity={selectedNoteId ? (selected ? 0.9 : 0.16) : 0.48}
                  />
                );
              })}
            </svg>

            {notes.map((note) => {
              const visible = visibleIds.has(note.id);
              const selected = selectedNoteId === note.id;
              const related = selectedNoteId
                ? edges.some(([a, b]) => (a === selectedNoteId && b === note.id) || (b === selectedNoteId && a === note.id))
                : false;
              return (
                <button
                  key={note.id}
                  className={`node node-${note.type} ${selected ? 'selected' : ''} ${!visible ? 'hidden-node' : ''} ${selectedNoteId && !selected && !related ? 'dim-node' : ''}`}
                  style={{
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    width: note.size,
                    height: note.size,
                  }}
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <span>{note.title}</span>
                </button>
              );
            })}
          </div>

          <div className="legend">
            <span><i className="dot core" />核心概念</span>
            <span><i className="dot method" />方法</span>
            <span><i className="dot concept" />概念</span>
            <span><i className="dot detail" />细节</span>
          </div>
        </div>

        {selectedNote && (
          <article className="note-panel">
            <div className="panel-header">
              <div>
                <p>已打开知识点</p>
                <h2>{selectedNote.title}</h2>
              </div>
              <button onClick={() => setSelectedNoteId('')} className="round-button">×</button>
            </div>

            <div className="tag-row">
              {selectedNote.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>

            <div className="note-stats">
              <span>
                <b>{noteTypeLabels[selectedNote.type]}</b>
                <small>类型</small>
              </span>
              <span>
                <b>{selectedRelationCount}</b>
                <small>自动关联</small>
              </span>
              <span>
                <b>{selectedNote.tags.length}</b>
                <small>标签</small>
              </span>
            </div>

            <p className="note-content">{selectedNote.content}</p>

            <div className="relation-box">
              <strong>🔗 自动关联</strong>
              <div>
                {selectedNote.links.map((link) => (
                  <button key={link}>{link}</button>
                ))}
              </div>
            </div>

            <button className="open-note-button">打开完整笔记</button>
          </article>
        )}
      </section>
    </main>
  );
}

export default App;
