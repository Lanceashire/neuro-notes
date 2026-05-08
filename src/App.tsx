import { PointerEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';

type NoteType = 'core' | 'method' | 'concept' | 'detail';

type Note = {
  id: string;
  title: string;
  type: NoteType;
  category: string;
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
  categories: string[];
};

type EditorMode = 'edit' | 'preview';

type NoteForm = {
  title: string;
  type: NoteType;
  category: string;
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
    category: '神经网络',
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
const fallbackCategories = ['全部', '神经网络'];

const fallbackGraph: GraphPayload = {
  notes: fallbackNotes,
  edges: fallbackEdges,
  tags: fallbackTags,
  categories: fallbackCategories,
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
  category: '未分类',
  tags: '临时想法',
  content: '',
  links: '',
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

function categoriesFromNotes(notes: Note[]) {
  const categorySet = new Set<string>();
  for (const note of notes) {
    categorySet.add(note.category || '未分类');
  }
  return ['全部', ...categorySet];
}

function categoriesFromGraph(graph: GraphPayload) {
  const categorySet = new Set<string>();
  for (const category of graph.categories ?? []) {
    const safeCategory = category.trim();
    if (safeCategory && safeCategory !== '全部') categorySet.add(safeCategory);
  }
  for (const note of graph.notes) {
    categorySet.add(note.category || '未分类');
  }
  return ['全部', ...categorySet];
}

function graphWithTags(graph: GraphPayload): GraphPayload {
  return {
    ...graph,
    tags: tagsFromNotes(graph.notes),
    categories: categoriesFromGraph(graph),
  };
}

function noteToForm(note: Note): NoteForm {
  return {
    title: note.title,
    type: note.type,
    category: note.category,
    tags: joinList(note.tags),
    content: note.content,
    links: '',
  };
}

function isLinkedTo(note: Note, target: Note) {
  return note.links.includes(target.id) || note.links.includes(target.title);
}

function withSyncedEdges(graph: GraphPayload, noteId: string, nextLinks: string[]) {
  const notes = graph.notes.map((note) => (note.id === noteId ? { ...note, links: nextLinks } : note));
  const edges: Edge[] = [];
  const seen = new Set<string>();

  for (const source of notes) {
    for (const link of source.links) {
      const target = notes.find((note) => note.id === link || note.title === link);
      if (!target || target.id === source.id) continue;

      const edgeKey = [source.id, target.id].sort().join('::');
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        edges.push([source.id, target.id, 0.58]);
      }
    }
  }

  return {
    ...graph,
    edges,
    notes,
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
    trimmed.startsWith('$$') ||
    trimmed.startsWith('\\[') ||
    trimmed.startsWith('- ') ||
    /^\d+\.\s+/.test(trimmed) ||
    trimmed.startsWith('> ')
  );
}

function renderInlineMarkdown(text: string, blockKey: string) {
  const parts = text.split(/(\[\[[^\]]+\]\]|#[^\s#，。,.!?；;：:]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\\\(.+?\\\)|\$[^$\n]+\$)/g);

  return parts.map((part, index) => {
    const key = `${blockKey}-${index}`;
    if (!part) return null;
    if (part.startsWith('[[') && part.endsWith(']]')) return <span className="wikilink" key={key}>{part.slice(2, -2)}</span>;
    if (part.startsWith('#')) return <span className="inline-tag" key={key}>{part}</span>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={key}>{part.slice(1, -1)}</em>;
    if (part.startsWith('\\(') && part.endsWith('\\)')) return <span className="math-inline" key={key}>{part.slice(2, -2)}</span>;
    if (part.startsWith('$') && part.endsWith('$')) return <span className="math-inline" key={key}>{part.slice(1, -1)}</span>;
    return part;
  });
}

function renderMathBlock(formula: string, key: string) {
  return (
    <div className="math-block" key={key}>
      <span>LaTeX</span>
      <pre>{formula.trim()}</pre>
    </div>
  );
}

function renderListContent(item: string, key: string) {
  const task = item.match(/^\[([ xX])\]\s+(.*)$/);
  if (!task) return renderInlineMarkdown(item, key);

  return (
    <label className="task-preview">
      <input type="checkbox" checked={task[1].toLowerCase() === 'x'} readOnly />
      <span>{renderInlineMarkdown(task[2], key)}</span>
    </label>
  );
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

    if (trimmed.startsWith('$$')) {
      const formulaLines: string[] = [];
      const firstLine = trimmed.slice(2);

      if (firstLine.trim().endsWith('$$') && firstLine.trim().length > 2) {
        formulaLines.push(firstLine.trim().slice(0, -2));
        index += 1;
      } else {
        if (firstLine.trim()) formulaLines.push(firstLine);
        index += 1;
        while (index < lines.length && !lines[index].trim().endsWith('$$')) {
          formulaLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          const lastLine = lines[index].trim();
          const beforeClose = lastLine.slice(0, -2);
          if (beforeClose.trim()) formulaLines.push(beforeClose);
          index += 1;
        }
      }
      blocks.push(renderMathBlock(formulaLines.join('\n'), key));
      continue;
    }

    if (trimmed.startsWith('\\[')) {
      const formulaLines: string[] = [];
      const firstLine = trimmed.slice(2);

      if (firstLine.trim().endsWith('\\]') && firstLine.trim().length > 2) {
        formulaLines.push(firstLine.trim().slice(0, -2));
        index += 1;
      } else {
        if (firstLine.trim()) formulaLines.push(firstLine);
        index += 1;
        while (index < lines.length && !lines[index].trim().endsWith('\\]')) {
          formulaLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          const lastLine = lines[index].trim();
          const beforeClose = lastLine.slice(0, -2);
          if (beforeClose.trim()) formulaLines.push(beforeClose);
          index += 1;
        }
      }
      blocks.push(renderMathBlock(formulaLines.join('\n'), key));
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
            <li key={`${key}-${itemIndex}`}>{renderListContent(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push(
        <ol key={key}>
          {items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderListContent(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ol>
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
  const [selectedCategory, setSelectedCategory] = useState('全部');
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
  const [isLinking, setIsLinking] = useState(false);
  const [linkMessage, setLinkMessage] = useState('点击“开始连线”，再点选图谱节点');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryMessage, setCategoryMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const markdownEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const { notes, edges, categories } = graph;

  const selectedNote = notes.find((note) => note.id === selectedNoteId) ?? null;
  const selectedRelationCount = selectedNote?.links.length ?? 0;
  const renderedNote = useMemo(() => renderMarkdown(noteDraft), [noteDraft]);
  const noteMap = useMemo<Record<string, Note>>(() => Object.fromEntries(notes.map((note) => [note.id, note])), [notes]);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const categoryFolders = useMemo(() => (
    categories
      .filter((category) => category !== '全部')
      .map((category) => {
        const categoryMatches = category.toLowerCase().includes(normalizedSearch);
        const folderNotes = notes.filter((note) => {
          if (note.category !== category) return false;
          if (!normalizedSearch || categoryMatches) return true;
          return [
            note.title,
            note.content,
            note.category,
            ...note.tags,
          ].some((value) => value.toLowerCase().includes(normalizedSearch));
        });

        return { category, notes: folderNotes, matches: categoryMatches || folderNotes.length > 0 };
      })
      .filter((folder) => !normalizedSearch || folder.matches)
  ), [categories, notes, normalizedSearch]);

  const visibleIds = useMemo(() => {
    if (isLinking) return new Set(notes.map((note) => note.id));
    const visibleNotes = notes.filter((note) => {
      const inCategory = selectedCategory === '全部' || note.category === selectedCategory;
      if (!inCategory) return false;
      if (!normalizedSearch) return true;

      return [
        note.title,
        note.content,
        note.category,
        ...note.tags,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
    return new Set(visibleNotes.map((note) => note.id));
  }, [notes, selectedCategory, isLinking, normalizedSearch]);

  const visibleEdges = edges.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b));
  const visibleNoteCount = notes.filter((note) => visibleIds.has(note.id)).length;

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
        setSelectedCategory((current) => ((data.categories ?? categoriesFromNotes(data.notes)).includes(current) ? current : '全部'));
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
    setIsLinking(false);
    setLinkMessage('点击“开始连线”，再点选图谱节点');
    setExpandedCategories((current) => {
      if (current.has(selectedNote.category)) return current;
      const next = new Set(current);
      next.add(selectedNote.category);
      return next;
    });
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.category, selectedNote?.body, selectedNote?.content]);

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

  function openCreateModal(category = selectedCategory) {
    setCreateDraft({
      ...emptyNoteForm,
      category: category === '全部' ? emptyNoteForm.category : category,
    });
    setIsCreateOpen(true);
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
      category: payload.category.trim() || '未分类',
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
      links: localNote.links,
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
          category: createDraft.category,
          tags: splitList(createDraft.tags),
          content: createDraft.content,
          links: splitList(createDraft.links),
        }),
      });
      const data = (await response.json()) as { note?: Note; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.note || !data.graph) throw new Error(data.error ?? '保存失败');

      setGraph(data.graph);
      setSelectedNoteId(data.note.id);
      setSelectedCategory(data.note.category);
      setExpandedCategories((current) => new Set(current).add(data.note!.category));
      setIsPanelOpen(true);
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
      setSelectedCategory(note.category);
      setExpandedCategories((current) => new Set(current).add(note.category));
      setIsPanelOpen(true);
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
      category: detailsDraft.category.trim() || '未分类',
      tags: splitList(detailsDraft.tags).slice(0, 8),
      content: detailsDraft.content.trim() || '这个知识点还没有摘要。',
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
      setSelectedCategory(data.note.category);
      setExpandedCategories((current) => new Set(current).add(data.note!.category));
      setIsPanelOpen(true);
      setDetailsMessage('已保存到后端');
    } catch (error) {
      patchGraphNote(selectedNote.id, patch);
      setSelectedCategory(patch.category ?? selectedNote.category);
      setExpandedCategories((current) => new Set(current).add(patch.category ?? selectedNote.category));
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
      setSelectedCategory('全部');
      setIsPanelOpen(Boolean(data.graph.notes[0]));
      setApiMessage('已从后端删除');
    } catch (error) {
      setGraph((current) => graphWithTags({
        notes: current.notes.filter((note) => note.id !== selectedNote.id),
        edges: current.edges.filter(([source, target]) => source !== selectedNote.id && target !== selectedNote.id),
        tags: current.tags,
        categories: current.categories,
      }));
      setSelectedNoteId(fallbackSelection);
      setSelectedCategory('全部');
      setIsPanelOpen(Boolean(fallbackSelection));
      setApiMessage(error instanceof Error ? `${error.message}，已从当前页面移除` : '已从当前页面移除');
    }
  }

  async function saveLinks(noteId: string, nextLinks: string[], message: string) {
    setGraph((current) => graphWithTags(withSyncedEdges(current, noteId, nextLinks)));
    setLinkMessage(message);

    try {
      const response = await fetch(`${API_BASE}/notes/${encodeURIComponent(noteId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: nextLinks }),
      });
      const data = (await response.json()) as { note?: Note; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.note || !data.graph) throw new Error(data.error ?? '连线保存失败');

      setGraph(data.graph);
      setLinkMessage('连线已保存到后端');
    } catch (error) {
      setLinkMessage(error instanceof Error ? `${error.message}，已暂存在当前页面` : '已暂存在当前页面');
    }
  }

  function toggleLinkTo(target: Note) {
    if (!selectedNote) return;
    if (target.id === selectedNote.id) {
      setLinkMessage('请选择另一个知识点来连线');
      return;
    }

    const exists = isLinkedTo(selectedNote, target);
    const nextLinks = exists
      ? selectedNote.links.filter((link) => link !== target.id && link !== target.title)
      : [...selectedNote.links, target.title];

    saveLinks(
      selectedNote.id,
      Array.from(new Set(nextLinks)).slice(0, 12),
      exists ? `已取消与「${target.title}」的连线` : `已连接到「${target.title}」`
    );
  }

  function handleNodeClick(note: Note) {
    if (isLinking && selectedNote) {
      toggleLinkTo(note);
      return;
    }

    setSelectedNoteId(note.id);
    setIsPanelOpen(true);
  }

  function enterLinkMode() {
    if (!selectedNote) return;
    setIsLinking(true);
    setLinkMessage('编辑面板已隐藏，现在点击其它知识点小球来连线或取消');
  }

  function exitLinkMode() {
    setIsLinking(false);
    setLinkMessage('已退出点选连线模式');
  }

  function replaceMarkdownRange(start: number, end: number, text: string, cursorOffset = text.length) {
    const nextDraft = `${noteDraft.slice(0, start)}${text}${noteDraft.slice(end)}`;
    const nextCursor = start + cursorOffset;

    setNoteDraft(nextDraft);
    setSaveMessage('有未保存修改');
    requestAnimationFrame(() => {
      markdownEditorRef.current?.focus();
      markdownEditorRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function wrapMarkdownSelection(left: string, right = left) {
    const textarea = markdownEditorRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = noteDraft.slice(selectionStart, selectionEnd);
    const wrapped = `${left}${selectedText}${right}`;
    replaceMarkdownRange(selectionStart, selectionEnd, wrapped, selectedText ? wrapped.length : left.length);
  }

  function handleMarkdownKeyDown(event: {
    key: string;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
    currentTarget: HTMLTextAreaElement;
  }) {
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd } = textarea;
    const lineStart = noteDraft.lastIndexOf('\n', selectionStart - 1) + 1;
    const currentLine = noteDraft.slice(lineStart, selectionStart);
    const commandKey = event.ctrlKey || event.metaKey;

    if (commandKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      wrapMarkdownSelection('**');
      return;
    }

    if (commandKey && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      wrapMarkdownSelection('*');
      return;
    }

    if (event.key === '$' && selectionStart !== selectionEnd) {
      event.preventDefault();
      wrapMarkdownSelection('$');
      return;
    }

    if (event.key === '`' && selectionStart !== selectionEnd) {
      event.preventDefault();
      wrapMarkdownSelection('`');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        const line = noteDraft.slice(lineStart);
        const removeCount = line.startsWith('  ') ? 2 : line.startsWith('\t') ? 1 : 0;
        if (removeCount > 0) {
          replaceMarkdownRange(lineStart, lineStart + removeCount, '', Math.max(0, selectionStart - lineStart - removeCount));
        }
      } else {
        replaceMarkdownRange(selectionStart, selectionEnd, '  ', 2);
      }
      return;
    }

    if (event.key === 'Enter') {
      const emptyList = currentLine.match(/^(\s*)([-*+]\s+|- \[[ xX]\]\s+|\d+\.\s+)$/);
      if (emptyList) {
        event.preventDefault();
        replaceMarkdownRange(lineStart, selectionStart, '', 0);
        return;
      }

      const task = currentLine.match(/^(\s*)- \[[ xX]\]\s+.+/);
      const bullet = currentLine.match(/^(\s*)[-*+]\s+.+/);
      const ordered = currentLine.match(/^(\s*)(\d+)\.\s+.+/);
      const nextPrefix = task
        ? `${task[1]}- [ ] `
        : bullet
          ? `${bullet[1]}- `
          : ordered
            ? `${ordered[1]}${Number(ordered[2]) + 1}. `
            : '';

      if (nextPrefix) {
        event.preventDefault();
        replaceMarkdownRange(selectionStart, selectionEnd, `\n${nextPrefix}`, nextPrefix.length + 1);
      }
    }
  }

  function toggleCategoryFolder(category: string) {
    setSelectedCategory(category);
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function openNoteFromSidebar(note: Note) {
    setSelectedNoteId(note.id);
    setSelectedCategory(note.category);
    setEditorMode('edit');
    setIsLinking(false);
    setIsPanelOpen(true);
    setExpandedCategories((current) => {
      const next = new Set(current);
      next.add(note.category);
      return next;
    });
  }

  async function createCategoryFolder() {
    const category = newCategoryName.trim();
    if (!category) {
      setCategoryMessage('请输入大类名称');
      return;
    }
    if (categories.includes(category)) {
      setSelectedCategory(category);
      setExpandedCategories((current) => new Set(current).add(category));
      setNewCategoryName('');
      setCategoryMessage('这个大类已经存在');
      return;
    }

    setGraph((current) => graphWithTags({
      ...current,
      categories: [...current.categories, category],
    }));
    setSelectedCategory(category);
    setExpandedCategories((current) => new Set(current).add(category));
    setNewCategoryName('');
    setCategoryMessage('正在保存大类...');

    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: category }),
      });
      const data = (await response.json()) as { category?: string; graph?: GraphPayload; error?: string };
      if (!response.ok || !data.category || !data.graph) throw new Error(data.error ?? '大类保存失败');

      setGraph(data.graph);
      setSelectedCategory(data.category);
      setExpandedCategories((current) => new Set(current).add(data.category!));
      setCategoryMessage('大类已创建');
    } catch (error) {
      setCategoryMessage(error instanceof Error ? `${error.message}，已暂存在当前页面` : '已暂存在当前页面');
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
      <datalist id="category-options">
        {categories.filter((category) => category !== '全部').map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🧠</div>
          <div>
            <h1>NeuroNotes</h1>
            <p>知识自动连成图</p>
          </div>
        </div>

        <button className="primary-button" onClick={() => openCreateModal()}>＋ 新建知识点</button>

        <label className="search-box">
          <span>⌕</span>
          <input
            value={searchQuery}
            placeholder="搜索笔记 / 概念"
            onChange={(event: { target: HTMLInputElement }) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className="sidebar-title">大类文件夹</div>
        <div className="category-create">
          <input
            value={newCategoryName}
            placeholder="新建大类，比如：牛顿力学"
            onChange={(event: { target: HTMLInputElement }) => {
              setNewCategoryName(event.target.value);
              setCategoryMessage('');
            }}
            onKeyDown={(event: { key: string; preventDefault: () => void }) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                createCategoryFolder();
              }
            }}
          />
          <button onClick={createCategoryFolder}>新建</button>
          {categoryMessage && <small>{categoryMessage}</small>}
        </div>
        <div className="tag-list">
          <button
            className={selectedCategory === '全部' ? 'tag-button active' : 'tag-button'}
            onClick={() => setSelectedCategory('全部')}
          >
            <span>全部知识点</span>
            <small>{notes.length}</small>
          </button>

          {categoryFolders.map(({ category, notes: folderNotes }) => (
            <div className="category-folder" key={category}>
              <button
                className={selectedCategory === category ? 'tag-button folder-button active' : 'tag-button folder-button'}
                onClick={() => toggleCategoryFolder(category)}
              >
                <span>{expandedCategories.has(category) ? '▾' : '▸'} {category}</span>
                <small>{folderNotes.length}</small>
              </button>
              {expandedCategories.has(category) && (
                <div className="folder-note-list">
                  {folderNotes.length > 0 ? folderNotes.map((note) => (
                    <button
                      key={note.id}
                      className={selectedNoteId === note.id ? 'folder-note active' : 'folder-note'}
                      onClick={() => openNoteFromSidebar(note)}
                    >
                      <span>{note.title}</span>
                      <small>{noteTypeLabels[note.type]}</small>
                    </button>
                  )) : (
                    <div className="folder-empty">
                      <span>{normalizedSearch ? '没有匹配的知识点' : '这个大类还没有知识点'}</span>
                      {!normalizedSearch && <button onClick={() => openCreateModal(category)}>在此新建</button>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {categoryFolders.length === 0 && (
            <div className="sidebar-empty">没有找到匹配的大类或知识点</div>
          )}
        </div>

        <div className="ai-card">
          <strong>手动连线</strong>
          <p>打开一个知识点，点击“开始连线”，再点选图谱中的其它节点即可建立或取消连线。</p>
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
            <input
              value={searchQuery}
              placeholder="搜索知识点，比如：反向传播"
              onChange={(event: { target: HTMLInputElement }) => setSearchQuery(event.target.value)}
            />
          </label>

          <div className="graph-summary">
            <span>{visibleNoteCount}/{notes.length} 个知识点</span>
            <span>{visibleEdges.length}/{edges.length} 条手动连线</span>
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
              const linkedTarget = selectedNote && note.id !== selectedNote.id ? isLinkedTo(selectedNote, note) : false;
              return (
                <button
                  key={note.id}
                  className={`node node-${note.type} ${selected ? 'selected' : ''} ${!visible ? 'hidden-node' : ''} ${selectedNoteId && !selected && !related && !isLinking ? 'dim-node' : ''} ${isLinking && !selected ? 'link-pick-node' : ''} ${linkedTarget ? 'linked-target' : ''}`}
                  style={{
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    width: note.size,
                    height: note.size,
                  }}
                  onPointerDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}
                  onClick={() => handleNodeClick(note)}
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

          {isLinking && selectedNote && (
            <div className="linking-toolbar" onPointerDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}>
              <div>
                <strong>正在为「{selectedNote.title}」连线</strong>
                <span>{linkMessage}</span>
              </div>
              <button onClick={exitLinkMode}>结束连线</button>
            </div>
          )}
        </div>

        {selectedNote && !isLinking && !isPanelOpen && (
          <div className="selected-note-dock">
            <div>
              <strong>{selectedNote.title}</strong>
              <span>{selectedNote.category} · {selectedRelationCount} 条连线</span>
            </div>
            <button onClick={() => setIsPanelOpen(true)}>打开编辑</button>
          </div>
        )}

        {selectedNote && !isLinking && isPanelOpen && (
          <article className="note-panel">
            <div className="panel-header">
              <div>
                <p>已打开知识点</p>
                <h2>{selectedNote.title}</h2>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="round-button">−</button>
            </div>

            <div className="tag-row">
              {selectedNote.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>

            <div className="note-stats">
              <span>
                <b>{selectedNote.category}</b>
                <small>大类</small>
              </span>
              <span>
                <b>{noteTypeLabels[selectedNote.type]}</b>
                <small>类型</small>
              </span>
              <span>
                <b>{selectedRelationCount}</b>
                <small>手动连线</small>
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
                  <span>大类文件夹</span>
                  <input
                    value={detailsDraft.category}
                    placeholder="比如：牛顿力学"
                    list="category-options"
                    onChange={(event: { target: HTMLInputElement }) => updateDetailsDraft('category', event.target.value)}
                  />
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
              </div>

              <div className="editor-actions compact-actions">
                <span>大类像文件夹名一样可自定义；连线请在下方开启点选模式</span>
                <button className="open-note-button" onClick={saveNoteDetails}>保存信息</button>
              </div>
            </section>

            <p className="note-content">{selectedNote.content}</p>

            <section className="note-editor">
              <div className="editor-header">
                <div>
                  <strong>Markdown 笔记</strong>
                  <small>{saveMessage}；像 Obsidian 一样直接写 Markdown、[[双链]]、$...$ 和 $$...$$</small>
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
                  ref={markdownEditorRef}
                  className="markdown-editor"
                  value={noteDraft}
                  spellCheck={false}
                  onChange={(event: { target: HTMLTextAreaElement }) => {
                    setNoteDraft(event.target.value);
                    setSaveMessage('有未保存修改');
                  }}
                  onKeyDown={handleMarkdownKeyDown}
                />
              ) : (
                <div className="markdown-preview">{renderedNote}</div>
              )}

              <div className="editor-actions">
                <span>直接输入 Obsidian 常用语法：$行内公式$、$$块级公式$$、```代码块```、- [ ] 任务、[[双链]]。</span>
                <button className="open-note-button" onClick={saveNoteBody}>保存笔记</button>
              </div>
            </section>

            <div className="relation-box">
              <div className="relation-header">
                <div>
                  <strong>点选式连线</strong>
                  <small>{linkMessage}</small>
                </div>
                <button
                  className={isLinking ? 'link-mode-button active' : 'link-mode-button'}
                  onClick={isLinking ? exitLinkMode : enterLinkMode}
                >
                  {isLinking ? '结束连线' : '开始连线'}
                </button>
              </div>
              <div className="relation-list">
                {selectedNote.links.length > 0
                  ? selectedNote.links.map((link) => (
                    <button
                      key={link}
                      onClick={() => {
                        const target = notes.find((note) => note.id === link || note.title === link);
                        if (target) toggleLinkTo(target);
                      }}
                    >
                      {link} ×
                    </button>
                  ))
                  : <span className="empty-relations">还没有手动连线</span>}
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
                <span>大类文件夹</span>
                <input
                  value={createDraft.category}
                  placeholder="比如：牛顿力学"
                  list="category-options"
                  onChange={(event: { target: HTMLInputElement }) => updateCreateDraft('category', event.target.value)}
                />
              </label>
              <label className="wide-field">
                <span>标签</span>
                <input
                  value={createDraft.tags}
                  placeholder="力学，定律"
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
            </div>

            <div className="editor-actions modal-actions">
              <span>大类可自命名；创建后可通过点选图谱节点来建立连线</span>
              <button className="open-note-button" onClick={createNote}>创建知识点</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
