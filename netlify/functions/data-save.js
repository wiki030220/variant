/**
 * 异见 VARIANT · 后台数据保存接口
 * 通过 GitHub API 将 data/*.json 写回仓库，触发 Netlify 自动部署。
 * 请求需携带 Netlify Identity 的 JWT（Authorization: Bearer <jwt>）。
 */
const GH_REPO = process.env.GH_REPO || 'wiki030220/variant';
const GH_TOKEN = process.env.GH_TOKEN;

const FILES = {
  articles: 'data/articles.json',
  works: 'data/works.json',
  config: 'data/config.json'
};

exports.handler = async (event) => {
  // 1. 身份校验（本地联调时可通过 X-CMS-TEST 跳过）
  const id = event.context && event.context.clientContext && event.context.clientContext.identity;
  const testOk = event.headers && event.headers['x-cms-test'] === '1' && event.headers['x-cms-secret'] === process.env.CMS_TEST_SECRET;
  if (!testOk && (!id || !id.user)) {
    return json(401, { error: '未登录或登录已过期，请重新登录' });
  }
  if (!GH_TOKEN) {
    return json(500, { error: '服务器未配置 GITHUB_TOKEN' });
  }

  // 2. 解析参数
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: '请求体不是合法 JSON' }); }
  const file = body.file;
  const content = body.content;
  const path = FILES[file];
  if (!path) return json(400, { error: '未知的数据文件: ' + file });
  if (typeof content !== 'string' || content.length === 0) return json(400, { error: '内容为空' });

  // 3. 读取当前文件 sha（GitHub 要求写文件必须带 sha）
  const getRes = await gh(`/repos/${GH_REPO}/contents/${path}`, { method: 'GET' });
  if (!getRes.ok) return json(502, { error: '读取仓库文件失败', detail: await getRes.text() });
  const meta = await getRes.json();

  // 4. 写入新内容
  const putRes = await gh(`/repos/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: body.message || 'CMS: 更新内容',
      content: Buffer.from(content, 'utf8').toString('base64'),
      sha: meta.sha
    })
  });
  if (!putRes.ok) return json(502, { error: '写入仓库失败', detail: await putRes.text() });
  return json(200, { ok: true, path });
};

async function gh(url, opts) {
  return fetch(`https://api.github.com${url}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      'User-Agent': 'variant-cms',
      Accept: 'application/vnd.github+json',
      ...(opts.headers || {})
    }
  });
}

function json(status, obj) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(obj) };
}
