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
  for (const note of graph.notes) {
    for (const tag of note.tags ?? []) {
      tagSet.add(tag);
    }
  }

  return {
    notes: graph.notes,
    edges: graph.edges,
    tags: ['全部', ...tagSet],
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function sendEmpty(response, statusCode = 204) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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
    tags: safeTags,
    x: Math.round((50 + Math.cos(angle) * 30) * 10) / 10,
    y: Math.round((48 + Math.sin(angle) * 25) * 10) / 10,
    size: type === 'detail' ? 58 : 68,
    content,
    links: payload.links && Array.isArray(payload.links) ? payload.links.map(String).slice(0, 8) : ['神经网络'],
  };

  graph.notes.push(note);

  const core = graph.notes.find((item) => item.id === 'nn');
  if (core && core.id !== note.id) {
    graph.edges.push([core.id, note.id, 0.52]);
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

    sendJson(response, 404, { error: '接口不存在' });
  } catch (error) {
    sendJson(response, 400, { error: error instanceof Error ? error.message : '请求处理失败' });
  }
});

server.listen(PORT, () => {
  console.log(`NeuroNotes API listening on http://127.0.0.1:${PORT}`);
});
