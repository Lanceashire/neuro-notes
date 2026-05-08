import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';

const PORT = Number(process.env.PORT ?? 8787);
const DATA_FILE = new URL('./data/graph.json', import.meta.url);
const VALID_TYPES = new Set(['core', 'method', 'concept', 'detail']);

async function readGraph() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const graph = JSON.parse(raw);
  return withTags(graph);
}

async function writeGraph(graph) {
  await writeFile(DATA_FILE, `${JSON.stringify({ notes: graph.notes, edges: graph.edges }, null, 2)}\n`, 'utf8');
}

function withTags(graph) {
  const tagSet = new Set();
  const categorySet = new Set();
  const notes = graph.notes.map((note) => ({
    ...note,
    category: note.category ?? '神经网络',
    body: note.body ?? createDefaultBody(note),
  }));

  for (const note of notes) {
    categorySet.add(note.category);
    for (const tag of note.tags ?? []) {
      tagSet.add(tag);
    }
  }

  return {
    notes,
    edges: graph.edges,
    tags: ['全部', ...tagSet],
    categories: ['全部', ...categorySet],
  };
}

function createDefaultBody(note) {
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

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, statusCode = 204) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  });
  response.end();
}

async function readBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1024 * 1024) {
      throw new Error('请求体太大');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function createNote(payload, graph) {
  const title = String(payload.title ?? '').trim();
  if (!title) {
    throw new Error('标题不能为空');
  }

  const type = VALID_TYPES.has(payload.type) ? payload.type : 'concept';
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
    : ['临时想法'];
  const safeTags = tags.length > 0 ? tags : ['临时想法'];
  const category = String(payload.category ?? '未分类').trim() || '未分类';
  const content = String(payload.content ?? '新的知识点已经保存到后端，可以继续补充正文和关联。').trim();
  const index = graph.notes.length;
  const idBase = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
  const id = `${idBase || 'note'}-${Date.now().toString(36)}`;
  const angle = (index / Math.max(graph.notes.length, 1)) * Math.PI * 2;

  const note = {
    id,
    title,
    type,
    category,
    tags: safeTags,
    x: Math.round((50 + Math.cos(angle) * 30) * 10) / 10,
    y: Math.round((48 + Math.sin(angle) * 25) * 10) / 10,
    size: Number(payload.size) || (type === 'detail' ? 58 : 68),
    content,
    body: String(payload.body ?? createDefaultBody({ title, content })).trim(),
    links: Array.isArray(payload.links) ? payload.links.map(String).map((link) => link.trim()).filter(Boolean).slice(0, 8) : [],
  };

  graph.notes.push(note);
  syncEdgesForNote(note, graph);

  return note;
}

function updateNote(noteId, payload, graph) {
  const note = graph.notes.find((item) => item.id === noteId);
  if (!note) return null;

  if (Object.hasOwn(payload, 'title')) {
    const title = String(payload.title ?? '').trim();
    if (!title) throw new Error('标题不能为空');
    note.title = title.slice(0, 80);
  }

  if (Object.hasOwn(payload, 'type') && VALID_TYPES.has(payload.type)) {
    note.type = payload.type;
    note.size = payload.type === 'detail' ? Math.min(note.size, 64) : Math.max(note.size, 68);
  }

  if (Object.hasOwn(payload, 'category')) {
    note.category = String(payload.category ?? '').trim().slice(0, 48) || '未分类';
  }

  if (Object.hasOwn(payload, 'body')) {
    note.body = String(payload.body ?? '').slice(0, 200000);
  }

  if (Object.hasOwn(payload, 'content')) {
    note.content = String(payload.content ?? '').slice(0, 2000);
  }

  if (Array.isArray(payload.tags)) {
    const tags = payload.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 8);
    note.tags = tags.length > 0 ? tags : note.tags;
  }

  if (Array.isArray(payload.links)) {
    note.links = payload.links.map((link) => String(link).trim()).filter(Boolean).slice(0, 12);
    syncEdgesForNote(note, graph);
  }

  return note;
}

function syncEdgesForNote(_note, graph) {
  graph.edges = buildEdgesFromLinks(graph.notes);
}

function buildEdgesFromLinks(notes) {
  const edges = [];
  const seen = new Set();

  for (const source of notes) {
    for (const link of source.links ?? []) {
      const target = notes.find((note) => note.id === link || note.title === link);
      if (!target || target.id === source.id) continue;

      const edgeKey = [source.id, target.id].sort().join('::');
      if (!seen.has(edgeKey)) {
        seen.add(edgeKey);
        edges.push([source.id, target.id, 0.58]);
      }
    }
  }

  return edges;
}

function deleteNote(noteId, graph) {
  const note = graph.notes.find((item) => item.id === noteId);
  if (!note) return null;

  graph.notes = graph.notes.filter((item) => item.id !== noteId);
  graph.edges = graph.edges.filter(([source, target]) => source !== noteId && target !== noteId);
  for (const item of graph.notes) {
    item.links = (item.links ?? []).filter((link) => link !== note.id && link !== note.title);
  }

  return note;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    if (request.method === 'OPTIONS') {
      sendEmpty(response);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { ok: true, service: 'neuro-notes-api' });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/graph') {
      sendJson(response, 200, await readGraph());
      return;
    }

    if (request.method === 'GET' && url.pathname.startsWith('/api/notes/')) {
      const graph = await readGraph();
      const noteId = decodeURIComponent(url.pathname.replace('/api/notes/', ''));
      const note = graph.notes.find((item) => item.id === noteId);
      sendJson(response, note ? 200 : 404, note ? { note } : { error: '知识点不存在' });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/notes') {
      const graph = await readGraph();
      const note = createNote(await readBody(request), graph);
      await writeGraph(graph);
      sendJson(response, 201, { note, graph: withTags(graph) });
      return;
    }

    if (request.method === 'PATCH' && url.pathname.startsWith('/api/notes/')) {
      const graph = await readGraph();
      const noteId = decodeURIComponent(url.pathname.replace('/api/notes/', ''));
      const note = updateNote(noteId, await readBody(request), graph);
      if (!note) {
        sendJson(response, 404, { error: '知识点不存在' });
        return;
      }

      await writeGraph(graph);
      sendJson(response, 200, { note, graph: withTags(graph) });
      return;
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/notes/')) {
      const graph = await readGraph();
      const noteId = decodeURIComponent(url.pathname.replace('/api/notes/', ''));
      const note = deleteNote(noteId, graph);
      if (!note) {
        sendJson(response, 404, { error: '知识点不存在' });
        return;
      }

      await writeGraph(graph);
      sendJson(response, 200, { deletedId: noteId, graph: withTags(graph) });
      return;
    }

    sendJson(response, 404, { error: '接口不存在' });
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : '请求处理失败' });
  }
});

server.listen(PORT, () => {
  console.log(`NeuroNotes API listening on http://127.0.0.1:${PORT}`);
});
