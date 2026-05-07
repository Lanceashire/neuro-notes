import { PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';

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
  body?: string;
  links: string[];
};

type Edge = [string, string, number];

type GraphPayload = {
  notes: Note[];
  edges: Edge[];
  tags: string[];
};

type EditorMode = 'edit' | 'preview';

type NoteForm = {
  title: string;
  type: NoteType;
  tags: string;
  content: string;
  links: string;
};

const API_BASE = 'http://127.0.0.1:8787/api';

const fallbackNotes: Note[] = [
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

const fallbackEdges: Edge[] = [
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

const fallbackTags = ['全部', 'AI', '训练', '优化', '模型结构', '超参数', '函数', '语义关联'];

const fallbackGraph: GraphPayload = {
  notes: fallbackNotes,
  edges: fallbackEdges,
  tags: fallbackTags,
};

const noteTypeLabels: Record<NoteType, string> = {
  core: '核心概念',
  method: '方法',
  concept: '概念',
  detail: '细节',
};

const noteTypeOptions: NoteType[] = ['core', 'method', 'concept', 'detail'];

const emptyNoteForm: NoteForm = {
  title: '',
  type: 'concept',
  tags: '临时想法',
  content: '',
  links: '神经网络',
};

function splitList(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]) {
  return value.join('，');
}

function tagsFromNotes(notes: Note[]) {
  const tagSet = new Set<string>();
  for (const note of notes) {
    for (const tag of note.tags) tagSet.add(tag);
  }
  return ['全部', ...tagSet];
}

function graphWithTags(graph: GraphPayload): GraphPayload {
  return {
    ...graph,
    tags: tagsFromNotes(graph.notes),
  };
}

function noteToForm(note: Note): NoteForm {
  return {
    title: note.title,
    type: note.type,
    tags: joinList(note.tags),
    content: note.content,
    links: joinList(note.links),
  };
}

function createMarkdownTemplate(note: Note) {
  return [
    `# ${note.title}`,
    '',
    note.content,
    '',
    '## 代码片段',
    '',
    '```ts',
    `const topic = "${note.title}";`,
    'console.log(topic);',
    '```',
    '',
    '## 公式',
    '',
    '$$',
    'L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2',
    '$$',
  ].join('\n');
}

function getNoteBody(note: Note) {
  return note.body?.trim() ? note.body : createMarkdownTemplate(note);
}

function isSpecialMarkdownLine(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('#') ||
    trimmed.startsWith('```') ||
    trimmed === '$$' ||
    trimmed.startsWith('- ') ||
    trimmed.startsWith('> ')
  );
}

function renderInlineMarkdown(text: string, blockKey: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\$[^$\n]+\$)/g);

  return parts.map((part, index) => {
    const key = `${blockKey}-${index}`;
    if (!part) return null;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>;
    if (part.startsWith('$') && part.endsWith('$')) return <span className="math-inline" key={key}>{part.slice(1, -1)}</span>;
    return part;
  });
}

function renderMarkdown(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: JSX.Element[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    const key = `md-${index}`;

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <figure className="markdown-code" key={key}>
          {language && <figcaption>{language}</figcaption>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </figure>
      );
      continue;
    }

    if (trimmed === '$$') {
      const formulaLines: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== '$$') {
        formulaLines.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(<div className="math-block" key={key}>{formulaLines.join('\n')}</div>);
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const content = renderInlineMarkdown(heading[2], key);
      if (level === 1) blocks.push(<h1 key={key}>{content}</h1>);
      if (level === 2) blocks.push(<h2 key={key}>{content}</h2>);
      if (level === 3) blocks.push(<h3 key={key}>{content}</h3>);
      index += 1;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={key}>
          {items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderInlineMarkdown(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(<blockquote key={key}>{renderInlineMarkdown(quoteLines.join(' '), key)}</blockquote>);
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isSpecialMarkdownLine(lines[index])) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={key}>{renderInlineMarkdown(paragraphLines.join(' '), key)}</p>);
  }

  return blocks.length > 0 ? blocks : [<p key="empty">开始写这个知识点的详细笔记吧。</p>];
}

function App() {
  const [graph, setGraph] = useState<GraphPayload>(fallbackGraph);
  const [selectedNoteId, setSelectedNoteId] = useState('nn');
  const [selectedTag, setSelectedTag] = useState('全部');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [apiMessage, setApiMessage] = useState('正在连接后端...');
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [noteDraft, setNoteDraft] = useState('');
  const [saveMessage, setSaveMessage] = useState('支持 Markdown、代码块和 LaTeX');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<NoteForm>(emptyNoteForm);
  const [detailsDraft, setDetailsDraft] = useState<NoteForm>(emptyNoteForm);
  const [detailsMessage, setDetailsMessage] = useState('基础信息可编辑');
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const { notes, edges, tags } = graph;

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;
  const selectedRelationCount = selectedNote?.links.length ?? 0;
  const renderedNote = useMemo(() => renderMarkdown(noteDraft), [noteDraft]);
  const noteMap = useMemo<Record<string, Note>>(() => Object.fromEntries(notes.map((note) => [note.id, note])), [notes]);

  const visibleIds = useMemo(() => {
    if (selectedTag === '全部') return new Set(notes.map((note) => note.id));
    return new Set(notes.filter((note) => note.tags.includes(selectedTag)).map((note) => note.id));
  }, [notes, selectedTag]);

  const visibleEdges = edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b));

  useEffect(() => {
    let ignored = false;

    async function loadGraph() {
      try {
        const response = await fetch(`${API_BASE}/graph`);
        if (!response.ok) throw new Error(`后端返回 ${response.status}`);
        const data = (await response.json()) as GraphPayload;
        if (ignored) return;

        setGraph(data);
        setSelectedNoteId((current) => (data.notes.some((note) => note.id === current) ? current : data.notes[0]?.id ?? ''));
        setSelectedTag((current) => (data.tags.includes(current) ? current : '全部'));
        setApiMessage('后端已连接');
      } catch {
        if (!ignored) {
          setApiMessage('后端未启动，正在使用本地示例数据');
        }
      }
    }

    loadGraph();

    return () => {
      ignored = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedNote) return;
    setNoteDraft(getNoteBody(selectedNote));
    setDetailsDraft(noteToForm(selectedNote));
    setSaveMessage('支持 Markdown、代码块和 LaTeX');
    setDetailsMessage('基础信息可编辑');
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.body, selectedNote?.content]);

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

  function makeLocalNote(payload: NoteForm): Note {
    const index = notes.length;
    const angle = (index / Math.max(notes.length, 1)) * Math.PI * 2;
    const title = payload.title.trim();
    const content = payload.content.trim() || '新的知识点，可以继续补充摘要和 Markdown 笔记。';
    const localNote: Note = {
      id: `local-${Date.now().toString(36)}`,
      title,
      type: payload.type,
      tags: splitList(payload.tags).slice(0, 8),
      x: Math.round((50 + Math.cos(angle) * 30) * 10) / 10,
      y: Math.round((48 + Math.sin(angle) * 25) * 10) / 10,
      size: payload.type === 'detail' ? 58 : 68,
      content,
      body: createMarkdownTemplate({ ...fallbackNotes[0], title, content }),
      links: splitList(payload.links).slice(0, 12),
    };

    return {
      ...localNote,
      tags: localNote.tags.length > 0 ? localNote.tags : ['临时想法'],
      links: localNote.links.length > 0 ? localNote.links : ['神经网络'],
    };
  }

  async function createNote() {
    if (!createDraft.title.trim()) {
      setApiMessage('请先填写知识点标题');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createDraft.title,
          type: createDraft.type,
          tags: splitList(createDraft.tags),
          content: createDraft.content,
          links: splitList(createDraft.links),
        }),
      });
      const data = (await response.json()) as { note?: Note; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.note || !data.graph) throw new Error(data.error ?? '保存失败');

      setGraph(data.graph);
      setSelectedNoteId(data.note.id);
      setSelectedTag('全部');
      setEditorMode('edit');
      setApiMessage('已保存到后端');
      setCreateDraft(emptyNoteForm);
      setIsCreateOpen(false);
    } catch (error) {
      const note = makeLocalNote(createDraft);
      setGraph((current) => graphWithTags({
        ...current,
        notes: [...current.notes, note],
      }));
      setSelectedNoteId(note.id);
      setSelectedTag('全部');
      setEditorMode('edit');
      setCreateDraft(emptyNoteForm);
      setIsCreateOpen(false);
      setApiMessage(error instanceof Error ? `${error.message}，已暂存在当前页面` : '已暂存在当前页面');
    }
  }

  function patchNoteLocally(noteId: string, patch: Partial<Note>) {
    setGraph((current) => graphWithTags({
      ...current,
      notes: current.notes.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    }));
  }

  function patchGraphNote(noteId: string, patch: Partial<Note>) {
    setGraph((current) => graphWithTags({
      ...current,
      notes: current.notes.map((note) => (note.id === noteId ? { ...note, ...patch } : note)),
    }));
  }

  async function saveNoteDetails() {
    if (!selectedNote) return;
    if (!detailsDraft.title.trim()) {
      setDetailsMessage('标题不能为空');
      return;
    }

    const patch: Partial<Note> = {
      title: detailsDraft.title.trim(),
      type: detailsDraft.type,
      tags: splitList(detailsDraft.tags).slice(0, 8),
      content: detailsDraft.content.trim() || '这个知识点还没有摘要。',
      links: splitList(detailsDraft.links).slice(0, 12),
    };

    try {
      setDetailsMessage('正在保存...');
      const response = await fetch(`${API_BASE}/notes/${encodeURIComponent(selectedNote.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = (await response.json()) as { note?: Note; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.note || !data.graph) throw new Error(data.error ?? '保存失败');

      setGraph(data.graph);
      setSelectedNoteId(data.note.id);
      setDetailsMessage('已保存到后端');
    } catch (error) {
      patchGraphNote(selectedNote.id, patch);
      setDetailsMessage(error instanceof Error ? `${error.message}，已暂存在当前页面` : '已暂存在当前页面');
    }
  }

  async function saveNoteBody() {
    if (!selectedNote) return;

    try {
      setSaveMessage('正在保存...');
      const response = await fetch(`${API_BASE}/notes/${encodeURIComponent(selectedNote.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteDraft }),
      });
      const data = (await response.json()) as { note?: Note; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.note || !data.graph) throw new Error(data.error ?? '保存失败');

      setGraph(data.graph);
      setSelectedNoteId(data.note.id);
      setSaveMessage('已保存到后端');
    } catch (error) {
      patchNoteLocally(selectedNote.id, { body: noteDraft });
      setSaveMessage(error instanceof Error ? `${error.message}，已暂存在当前页面` : '已暂存在当前页面');
    }
  }

  async function deleteSelectedNote() {
    if (!selectedNote) return;
    const ok = window.confirm(`确认删除「${selectedNote.title}」吗？这个操作会移除相关连线。`);
    if (!ok) return;

    const fallbackSelection = notes.find((note) => note.id !== selectedNote.id)?.id ?? '';

    try {
      const response = await fetch(`${API_BASE}/notes/${encodeURIComponent(selectedNote.id)}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as { graph?: GraphPayload; error?: string };
      if (!response.ok || !data.graph) throw new Error(data.error ?? '删除失败');

      setGraph(data.graph);
      setSelectedNoteId(data.graph.notes[0]?.id ?? '');
      setSelectedTag('全部');
      setApiMessage('已从后端删除');
    } catch (error) {
      setGraph((current) => graphWithTags({
        notes: current.notes.filter((note) => note.id !== selectedNote.id),
        edges: current.edges.filter(([source, target]) => source !== selectedNote.id && target !== selectedNote.id),
        tags: current.tags,
      }));
      setSelectedNoteId(fallbackSelection);
      setSelectedTag('全部');
      setApiMessage(error instanceof Error ? `${error.message}，已从当前页面移除` : '已从当前页面移除');
    }
  }

  function updateCreateDraft(field: keyof NoteForm, value: string) {
    setCreateDraft((current) => ({
      ...current,
      [field]: field === 'type' ? value as NoteType : value,
    }));
  }

  function updateDetailsDraft(field: keyof NoteForm, value: string) {
    setDetailsDraft((current) => ({
      ...current,
      [field]: field === 'type' ? value as NoteType : value,
    }));
    setDetailsMessage('有未保存修改');
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

        <button className="primary-button" onClick={() => setIsCreateOpen(true)}>＋ 新建知识点</button>

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
          <p className="api-status">{apiMessage}</p>
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

            <section className="details-editor">
              <div className="editor-header">
                <div>
                  <strong>基础信息</strong>
                  <small>{detailsMessage}</small>
                </div>
                <button className="danger-button" onClick={deleteSelectedNote}>删除</button>
              </div>

              <div className="form-grid">
                <label>
                  <span>标题</span>
                  <input
                    value={detailsDraft.title}
                    onChange={(event: { target: HTMLInputElement }) => updateDetailsDraft('title', event.target.value)}
                  />
                </label>
                <label>
                  <span>类型</span>
                  <select
                    value={detailsDraft.type}
                    onChange={(event: { target: HTMLSelectElement }) => updateDetailsDraft('type', event.target.value)}
                  >
                    {noteTypeOptions.map((type) => (
                      <option key={type} value={type}>{noteTypeLabels[type]}</option>
                    ))}
                  </select>
                </label>
                <label className="wide-field">
                  <span>标签</span>
                  <input
                    value={detailsDraft.tags}
                    onChange={(event: { target: HTMLInputElement }) => updateDetailsDraft('tags', event.target.value)}
                  />
                </label>
                <label className="wide-field">
                  <span>摘要</span>
                  <textarea
                    value={detailsDraft.content}
                    onChange={(event: { target: HTMLTextAreaElement }) => updateDetailsDraft('content', event.target.value)}
                  />
                </label>
                <label className="wide-field">
                  <span>关联</span>
                  <input
                    value={detailsDraft.links}
                    onChange={(event: { target: HTMLInputElement }) => updateDetailsDraft('links', event.target.value)}
                  />
                </label>
              </div>

              <div className="editor-actions compact-actions">
                <span>标签和关联可以用中文逗号或英文逗号分隔</span>
                <button className="open-note-button" onClick={saveNoteDetails}>保存信息</button>
              </div>
            </section>

            <p className="note-content">{selectedNote.content}</p>

            <section className="note-editor">
              <div className="editor-header">
                <div>
                  <strong>Markdown 笔记</strong>
                  <small>{saveMessage}</small>
                </div>
                <div className="editor-tabs">
                  <button
                    className={editorMode === 'edit' ? 'active' : ''}
                    onClick={() => setEditorMode('edit')}
                  >
                    编辑
                  </button>
                  <button
                    className={editorMode === 'preview' ? 'active' : ''}
                    onClick={() => setEditorMode('preview')}
                  >
                    预览
                  </button>
                </div>
              </div>

              {editorMode === 'edit' ? (
                <textarea
                  className="markdown-editor"
                  value={noteDraft}
                  spellCheck={false}
                  onChange={(event: { target: HTMLTextAreaElement }) => {
                    setNoteDraft(event.target.value);
                    setSaveMessage('有未保存修改');
                  }}
                />
              ) : (
                <div className="markdown-preview">{renderedNote}</div>
              )}

              <div className="editor-actions">
                <span>代码块用 ```，公式用 $...$ 或 $$...$$</span>
                <button className="open-note-button" onClick={saveNoteBody}>保存笔记</button>
              </div>
            </section>

            <div className="relation-box">
              <strong>🔗 自动关联</strong>
              <div>
                {selectedNote.links.map((link) => (
                  <button key={link}>{link}</button>
                ))}
              </div>
            </div>

          </article>
        )}
      </section>

      {isCreateOpen && (
        <div className="modal-backdrop">
          <section className="create-modal">
            <div className="panel-header">
              <div>
                <p>创建知识点</p>
                <h2>新的笔记节点</h2>
              </div>
              <button
                className="round-button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreateDraft(emptyNoteForm);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-grid">
              <label className="wide-field">
                <span>标题</span>
                <input
                  autoFocus
                  value={createDraft.title}
                  placeholder="比如：Transformer"
                  onChange={(event: { target: HTMLInputElement }) => updateCreateDraft('title', event.target.value)}
                />
              </label>
              <label>
                <span>类型</span>
                <select
                  value={createDraft.type}
                  onChange={(event: { target: HTMLSelectElement }) => updateCreateDraft('type', event.target.value)}
                >
                  {noteTypeOptions.map((type) => (
                    <option key={type} value={type}>{noteTypeLabels[type]}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>标签</span>
                <input
                  value={createDraft.tags}
                  placeholder="AI，模型结构"
                  onChange={(event: { target: HTMLInputElement }) => updateCreateDraft('tags', event.target.value)}
                />
              </label>
              <label className="wide-field">
                <span>摘要</span>
                <textarea
                  value={createDraft.content}
                  placeholder="先写一句话描述这个知识点"
                  onChange={(event: { target: HTMLTextAreaElement }) => updateCreateDraft('content', event.target.value)}
                />
              </label>
              <label className="wide-field">
                <span>关联</span>
                <input
                  value={createDraft.links}
                  placeholder="神经网络，Embedding"
                  onChange={(event: { target: HTMLInputElement }) => updateCreateDraft('links', event.target.value)}
                />
              </label>
            </div>

            <div className="editor-actions modal-actions">
              <span>创建后可以继续写 Markdown 正文和公式</span>
              <button className="open-note-button" onClick={createNote}>创建知识点</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
