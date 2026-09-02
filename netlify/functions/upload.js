/**
 * 异见 VARIANT · 后台图片上传接口
 * 将 base64 图片写入 GitHub 仓库 assets/uploads，返回可直接访问的 URL。
 * 请求：{ filename: "xxx.jpg", data: "<base64>" }
 */
const GH_REPO = process.env.GH_REPO || 'wiki030220/variant';
const GH_TOKEN = process.env.GH_TOKEN;
const MAX_BYTES = 6 * 1024 * 1024; // 6MB

exports.handler = async (event) => {
  const id = event.context && event.context.clientContext && event.context.clientContext.identity;
  const testOk = event.headers && event.headers['x-cms-test'] === '1' && event.headers['x-cms-secret'] === process.env.CMS_TEST_SECRET;
  if (!testOk && (!id || !id.user)) {
    return json(401, { error: '未登录或登录已过期，请重新登录' });
  }
  if (!GH_TOKEN) return json(500, { error: '服务器未配置 GITHUB_TOKEN' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: '请求体不是合法 JSON' }); }

  const filename = (body.filename || '').trim();
  const data = body.data || ''; // base64
  if (!filename || !data) return json(400, { error: '缺少文件名或图片内容' });
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) return json(400, { error: '文件名不合法' });
  if (data.length > MAX_BYTES * 1.4) return json(400, { error: '图片过大（上限 6MB）' });

  const path = `assets/uploads/${filename}`;

  // 已存在则取 sha，否则新增
  const getRes = await gh(`/repos/${GH_REPO}/contents/${path}`, { method: 'GET' });
  let sha;
  if (getRes.ok) { const m = await getRes.json(); sha = m.sha; }
  else if (getRes.status !== 404) { return json(502, { error: '检查图片失败' }); }

  const putRes = await gh(`/repos/${GH_REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `CMS: 上传图片 ${filename}`,
      content: data,
      sha
    })
  });
  if (!putRes.ok) return json(502, { error: '上传图片失败', detail: await putRes.text() });

  const rawUrl = `https://raw.githubusercontent.com/${GH_REPO}/main/${path}`;
  const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${GH_REPO}@main/${path}`;
  return json(200, { ok: true, raw: rawUrl, url: jsdelivrUrl, path: `/assets/uploads/${filename}` });
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
