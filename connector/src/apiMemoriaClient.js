import 'dotenv/config';

const BASE_URL = process.env.API_BASE_URL;
const USERNAME = process.env.API_USERNAME;
const PASSWORD = process.env.API_PASSWORD;

let session = null; // { accessToken, validoAteMs }

// valido_ate vem como "DD/MM/AAAA HH:mm" (formato BR). O construtor Date()
// do JS interpretaria isso como MM/DD, dando data errada sem erro nenhum.
function parseValidoAte(validoAte) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(validoAte);
  if (!match) return 0;
  const [, dd, mm, yyyy, hh, min] = match;
  return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`).getTime();
}

function isSessionValid() {
  return !!session && session.validoAteMs > Date.now();
}

async function parseResponseBody(response) {
  if (response.status === 204) return null;
  const raw = await response.text();
  if (!raw) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

// Erros de servidor web vem como pagina HTML, nao JSON.
function extractErrorDetail(body) {
  if (body == null) return '(sem corpo)';
  if (typeof body !== 'string') return JSON.stringify(body);
  const match = /<h2[^>]*>(.*?)<\/h2>/is.exec(body);
  return (match ? match[1].replace(/<[^>]+>/g, '').trim() : body).slice(0, 300);
}

async function login() {
  if (!BASE_URL || !USERNAME || !PASSWORD) {
    throw new Error('API_BASE_URL/API_USERNAME/API_PASSWORD nao configurados (veja .env.example).');
  }

  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const body = await parseResponseBody(response);

  // 401 aqui (sem token envolvido) = usuario/senha errados.
  if (response.status === 401) {
    throw new Error('Login na ApiMemoria falhou: usuario ou senha invalidos.');
  }
  if (!response.ok) {
    throw new Error(`Falha ao logar na ApiMemoria (HTTP ${response.status}): ${extractErrorDetail(body)}`);
  }

  session = { accessToken: body.access_token, validoAteMs: parseValidoAte(body.valido_ate) };
  return session;
}

async function ensureSession() {
  if (!isSessionValid()) await login();
  return session;
}

function normalizeRows(data, scalarKey) {
  if (!Array.isArray(data) || data.length === 0) return data ?? [];
  // 1 coluna projetada -> array de valores escalares (o alias eh ignorado pela API).
  // Normaliza pra objeto aqui pra quem chama nao precisar tratar os dois formatos.
  const isScalarRow = (row) => row === null || typeof row !== 'object';
  if (data.every(isScalarRow)) {
    const key = scalarKey || 'VALUE';
    return data.map((value) => ({ [key]: value }));
  }
  return data;
}

async function rawConsulta(sql, params, { limit, offset } = {}) {
  const body = { sql, Params: [params || {}] };
  if (limit !== undefined) body.limit = limit;
  if (offset !== undefined) body.offset = offset;

  const response = await fetch(`${BASE_URL}/consulta`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify(body),
  });
  return { response, parsed: await parseResponseBody(response) };
}

/**
 * Executa uma consulta SQL (somente SELECT) via /consulta.
 *
 * Regras do guia da ApiMemoria que este metodo ja aplica por baixo dos panos:
 * - params: objeto simples, ex. { SINI: '2026-01-01', ICOD: 42 }. A chave deve
 *   ser o nome do parametro do SQL (:sIni, :iCOD) TODO EM MAIUSCULAS, prefixo
 *   incluido. Prefixo 's' = string/ISO (use sempre para datas), 'i' = inteiro.
 *   Nunca use prefixo 'd' para datas (a API tenta converter sozinha e falha).
 * - scalarKey: nome a usar quando o SQL projeta 1 coluna so (a API devolve
 *   array de valores soltos nesse caso, sem o alias).
 */
async function consulta(sql, params = {}, { limit, offset, scalarKey } = {}) {
  await ensureSession();
  let { response, parsed } = await rawConsulta(sql, params, { limit, offset });

  // 401 com token em maos = sessao expirou/invalidou, nao credencial errada.
  if (response.status === 401) {
    session = null;
    await ensureSession();
    ({ response, parsed } = await rawConsulta(sql, params, { limit, offset }));
  }

  if (!response.ok) {
    throw new Error(`Consulta falhou (HTTP ${response.status}): ${extractErrorDetail(parsed)}`);
  }
  if (!parsed) return { rows: [], records: 0 };
  if (parsed.error) {
    throw new Error(`Consulta retornou erro logico da API: ${parsed.error}`);
  }

  return { rows: normalizeRows(parsed.data, scalarKey), records: parsed.records };
}

/**
 * Busca todas as paginas de uma consulta. Quando `records` vem -1 (contagem
 * indisponivel por causa de CTE/subselect/"from" em expressao no SQL), pagina
 * pelo tamanho da pagina retornada em vez de confiar no total.
 */
async function consultaTodasPaginas(sql, params = {}, { pageSize = 200, scalarKey } = {}) {
  const linhas = [];
  let offset = 0;
  for (;;) {
    const { rows } = await consulta(sql, params, { limit: pageSize, offset, scalarKey });
    linhas.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return linhas;
}

export { login, consulta, consultaTodasPaginas };
