'use strict';

/**
 * A small no-dependency HTTP server for a records-management teaching prototype.
 * Sign-in is intentionally simulated on the client, so do not store sensitive data.
 */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DEFAULT_DATA_FILE = path.join(ROOT, 'data', 'books.json');
const MAX_BODY_SIZE = 16 * 1024;
const CATEGORIES = ['Fiction', 'Non-fiction', 'Science', 'History', 'Technology', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair'];

function sendJson(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function apiError(res, code, message) { sendJson(res, code, { error: message }); }

async function getBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      const error = new Error('Request too large.');
      error.status = 413;
      throw error;
    }
  }
  try { return JSON.parse(body); }
  catch {
    const error = new Error('The request must contain valid JSON.');
    error.status = 400;
    throw error;
  }
}

function textField(v) { return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : ''; }
function validDate(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const date = new Date(v + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === v;
}

function validateBook(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid book information.' };
  const title = textField(input.title);
  const author = textField(input.author);
  const category = textField(input.category);
  const condition = textField(input.condition);
  const status = textField(input.status);
  const borrower = textField(input.borrower);
  const dueDate = textField(input.dueDate);
  const referenceOnly = input.referenceOnly === true;
  if (title.length < 2 || title.length > 100) return { error: 'Title must be 2 to 100 characters.' };
  if (author.length < 2 || author.length > 80) return { error: 'Author must be 2 to 80 characters.' };
  if (!CATEGORIES.includes(category)) return { error: 'Choose a valid category.' };
  if (!CONDITIONS.includes(condition)) return { error: 'Choose a valid condition.' };
  if (!['available', 'loaned'].includes(status)) return { error: 'Choose a valid loan status.' };
  if (referenceOnly && status === 'loaned') return { error: 'Reference-only books cannot be on loan.' };
  if (status === 'loaned' && (borrower.length < 2 || borrower.length > 80)) return { error: 'Borrower name must be 2 to 80 characters.' };
  if (status === 'loaned' && !validDate(dueDate)) return { error: 'Provide a valid due date for an active loan.' };
  return {
    value: {
      title, author, category, condition, status, referenceOnly,
      borrower: status === 'loaned' ? borrower : '',
      dueDate: status === 'loaned' ? dueDate : ''
    }
  };
}

function createBookStore(dataFile) {
  let writeQueue = Promise.resolve();
  async function readBooks() {
    try {
      const books = JSON.parse(await fs.readFile(dataFile, 'utf8'));
      if (!Array.isArray(books)) throw new Error('Invalid records data file.');
      return books;
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]\n', { flag: 'wx' }).catch(e => {
        if (e.code !== 'EEXIST') throw e;
      });
      return JSON.parse(await fs.readFile(dataFile, 'utf8'));
    }
  }
  async function saveBooks(books) {
    const tempfile = `${dataFile}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    try {
      await fs.writeFile(tempfile, JSON.stringify(books, null, 2) + '\n', 'utf8');
      await fs.rename(tempfile, dataFile);
    } finally {
      await fs.rm(tempfile, { force: true }).catch(() => {});
    }
  }
  function transaction(callback) {
    const job = writeQueue.then(async () => {
      const books = await readBooks();
      const result = callback(books);
      if (result.changed) await saveBooks(books);
      return result;
    });
    writeQueue = job.catch(() => {});
    return job;
  }
  return { readBooks, transaction };
}

function createAppServer({ dataFile = process.env.DATA_FILE || DEFAULT_DATA_FILE } = {}) {
  const store = createBookStore(dataFile);
  const routes = {
    '/': ['index.html', 'text/html; charset=utf-8'],
    '/index.html': ['index.html', 'text/html; charset=utf-8'],
    '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
    '/app.js': ['app.js', 'text/javascript; charset=utf-8']
  };

  return http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && pathname === '/api/health') {
        return sendJson(res, 200, { ok: true });
      }
      if (pathname === '/api/books') {
        if (req.method === 'GET') {
          const books = await store.readBooks();
          return sendJson(res, 200, { books });
        }
        if (req.method === 'POST') {
          const input = await getBody(req);
          const parsed = validateBook(input);
          if (parsed.error) return apiError(res, 400, parsed.error);
          const result = await store.transaction(books => {
            const book = {
              id: crypto.randomUUID(),
              ...parsed.value,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            books.unshift(book);
            return { changed: true, book };
          });
          return sendJson(res, 201, { book: result.book });
        }
        return apiError(res, 405, 'Method not allowed.');
      }
      const match = pathname.match(/^\/api\/books\/([a-f0-9-]{36})$/i);
      if (match && req.method === 'PATCH') {
        const input = await getBody(req);
        if (!input || !['available', 'loaned'].includes(input.status)) return apiError(res, 400, 'Invalid status.');
        const result = await store.transaction(books => {
          const book = books.find(item => item.id === match[1]);
          if (!book) return { changed: false, missing: true };
          const parsed = validateBook({ ...book, ...input });
          if (parsed.error) return { changed: false, error: parsed.error };
          Object.assign(book, parsed.value, { updatedAt: new Date().toISOString() });
          return { changed: true, book };
        });
        if (result.missing) return apiError(res, 404, 'Book not found.');
        if (result.error) return apiError(res, 400, result.error);
        return sendJson(res, 200, { book: result.book });
      }
      if (req.method === 'GET' && Object.hasOwn(routes, pathname)) {
        const [filename, mime] = routes[pathname];
        const file = await fs.readFile(path.join(PUBLIC, filename));
        res.writeHead(200, {
          'Content-Type': mime,
          'Content-Length': file.length,
          'X-Content-Type-Options': 'nosniff',
          'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'"
        });
        return res.end(file);
      }
      return apiError(res, 404, 'Page not found.');
    } catch (err) {
      if (err.status && err.status < 500) return apiError(res, err.status, err.message);
      console.error('Server request failed:', err);
      return apiError(res, 500, 'Something went wrong on the server. Please try again.');
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  const server = createAppServer();
  server.listen(port, '0.0.0.0', () => {
    console.log(`ShelfDesk is running at http://localhost:${port}`);
  });
}

module.exports = { createAppServer, validateBook };
