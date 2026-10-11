'use strict';

const IMAGE_LIMIT = 10 * 1024 * 1024;
const fields = {
  contact: { name: [100, true], email: [150, true], phone: [20], subject: [200], message: [2000, true] },
  review: { name: [80, true], role: [100], title: [100, true], comment: [700, true], category: [50] },
  event: { title: [200, true], date: [100, true], time: [100], venue: [200], category: [100], description: [2000], coverImage: [IMAGE_LIMIT] },
  photo: { title: [200, true], caption: [500], imageUrl: [IMAGE_LIMIT, true], category: [100], size: [10] },
  chairman: { name: [100, true], role: [200, true], image: [IMAGE_LIMIT, true] }
};

function invalid(message) {
  throw new Error(message);
}

function text(value, name, max, required = false) {
  if (typeof value !== 'string') invalid(`${name} must be a string.`);
  const normalized = value.trim();
  if (normalized.length > max) invalid(`${name} must be at most ${max} characters.`);
  if (required && !normalized) invalid(`${name} is required.`);
  return normalized;
}

function bodyFields(body, kind, partial = false) {
  const result = {};
  for (const [key, [max, required]] of Object.entries(fields[kind])) {
    if (body[key] !== undefined) result[key] = text(body[key], key, max, required);
    else if (required && !partial) invalid(`${key} is required.`);
  }
  return result;
}

function integer(value, name, min, max) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    invalid(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateRequest(req, res, next) {
  try {
    // Express routes are case-insensitive and accept a trailing slash by default.
    const path = req.path.toLowerCase().replace(/\/+$/, '');
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) invalid('A JSON object is required.');
      const body = req.body;
      if (path === '/api/contact') {
        req.body = bodyFields(body, 'contact');
        req.body.email = req.body.email.toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) invalid('Please enter a valid email address.');
      } else if (path === '/api/reviews') {
        req.body = bodyFields(body, 'review');
        req.body.rating = integer(body.rating, 'rating', 1, 5);
      } else if (path === '/api/admin/login') {
        req.body = { username: text(body.username, 'username', 100, true), password: body.password };
        if (typeof body.password !== 'string' || !body.password.length || body.password.length > 1024) invalid('A password of at most 1024 characters is required.');
      } else if (/^\/api\/admin\/events(?:\/[^/]+)?$/.test(path)) {
        req.body = bodyFields(body, 'event', req.method !== 'POST');
        for (const key of ['featured', 'published']) {
          if (body[key] !== undefined) {
            if (typeof body[key] !== 'boolean') invalid(`${key} must be a boolean.`);
            req.body[key] = body[key];
          }
        }
        if (body.gallery !== undefined) {
          if (!Array.isArray(body.gallery) || body.gallery.length > 50) invalid('gallery must be an array of at most 50 images.');
          req.body.gallery = body.gallery.map(value => text(value, 'gallery image', IMAGE_LIMIT, true));
        }
      } else if (/^\/api\/admin\/events\/[^/]+\/toggle$/.test(path)) {
        if (!['featured', 'published'].includes(body.field)) invalid('field must be featured or published.');
      } else if (path === '/api/admin/gallery/reorder') {
        if (!Array.isArray(body.orders) || body.orders.length > 1000) invalid('orders must be an array of at most 1000 items.');
        const seen = new Set();
        req.body = { orders: body.orders.map(item => {
          if (!item || typeof item !== 'object' || Array.isArray(item)) invalid('Each order must be an object.');
          const id = text(item.id, 'id', 100, true);
          if (seen.has(id)) invalid('Duplicate photo id.');
          seen.add(id);
          return { id, order: integer(item.order, 'order', 0, 1000000) };
        }) };
      } else if (/^\/api\/admin\/gallery(?:\/[^/]+)?$/.test(path)) {
        req.body = bodyFields(body, 'photo', req.method !== 'POST');
        if (body.category !== undefined && !req.body.category) invalid('category must not be empty.');
        if (body.size !== undefined && !['normal', 'large'].includes(req.body.size)) invalid('size must be normal or large.');
        if (body.order !== undefined) req.body.order = integer(body.order, 'order', 0, 1000000);
      } else if (path === '/api/admin/chairman') {
        req.body = bodyFields(body, 'chairman', true);
        if (!Object.keys(req.body).length) invalid('At least one chairman field is required.');
      }
    }

    if (/^\/api\/admin\/(messages|reviews)\/[^/]+(?:\/(read|approve))?$/.test(path)) {
      const id = path.split('/')[4];
      if (!/^[a-f\d]{24}$/i.test(id)) invalid('Invalid record id.');
    }
    if (req.method === 'GET') {
      const query = req.query;
      for (const key of ['search', 'category', 'status', 'dateFrom', 'dateTo', 'page', 'limit', 'rating']) {
        if (query[key] !== undefined) query[key] = text(query[key], key, key === 'search' ? 200 : 100);
      }
      if (query.search) query.search = escapeRegex(query.search);
      for (const key of ['page', 'limit']) {
        if (query[key] !== undefined && (!/^\d+$/.test(query[key]) || !Number.isSafeInteger(Number(query[key])) || Number(query[key]) < 1)) invalid(`${key} must be a positive integer.`);
      }
      if (query.page && Number(query.page) > Math.floor(Number.MAX_SAFE_INTEGER / 100)) invalid('page is too large.');
      if (query.rating && !/^[1-5]$/.test(query.rating)) invalid('rating must be 1–5.');
      if (query.status && !['all', 'read', 'unread'].includes(query.status)) invalid('Invalid message status.');
      for (const key of ['dateFrom', 'dateTo']) {
        if (query[key] && (!/^\d{4}-\d{2}-\d{2}$/.test(query[key]) || !Number.isFinite(Date.parse(query[key])) || new Date(query[key]).toISOString().slice(0, 10) !== query[key])) invalid(`${key} must be a valid YYYY-MM-DD date.`);
      }
      if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) invalid('dateFrom must not be after dateTo.');
    }
    next();
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { validateRequest, escapeRegex };
