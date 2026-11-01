// POST /api/lead — homepage "Free Mockup" form.
// 1) emails the lead to LEAD_TO (Reply-To = visitor)
// 2) sends the visitor the branded auto-reply from the same mailbox
//
// Vercel environment variables:
//   SMTP_PASS  (required) password of the mailbox below
//   SMTP_USER  (optional) default info@flooringwebpros.com
//   LEAD_TO    (optional) where leads go, default = SMTP_USER
//   SMTP_HOST / SMTP_PORT (optional) default smtp.hostinger.com / 465
const nodemailer = require('nodemailer');
const reply = require('../lib/mockup-reply.js');

const FIELDS = {
  name: 'Name', business: 'Business', phone: 'Phone / WhatsApp', email: 'Email',
  city: 'City / Service Area', trade: 'Trade', website: 'Current website',
};
const REQUIRED = ['name', 'business', 'phone', 'email', 'city', 'trade'];
const TRADES = new Set(['Hardwood', 'Carpet', 'Tile & Stone', 'LVP/Laminate', 'Epoxy/Concrete', 'Refinishing', 'Showroom/Retail', 'Commercial', 'Other']);
const EMAIL_RE = /^[^\s@<>"(),;:\\[\]]+@[^\s@<>"(),;:\\[\]]+\.[^\s@<>"(),;:\\[\]]{2,}$/;
const MAX_BODY = 8 * 1024; // bytes; the real form sends well under 1 KB

// Only our own pages may post here (plus this project's Vercel preview deployments)
const ALLOWED_HOSTS = new Set(['www.flooringwebpros.com', 'flooringwebpros.com']);
const allowedOrigin = (value) => {
  try {
    const { protocol, hostname } = new URL(value);
    if (protocol !== 'https:' && hostname !== 'localhost') return false;
    return ALLOWED_HOSTS.has(hostname) || hostname === 'localhost' ||
      (hostname.endsWith('.vercel.app') && hostname.startsWith('flooring-web-pros'));
  } catch { return false; }
};

// Best-effort rate limits (per warm serverless instance): stop scripted floods and
// stop the form being used to send our auto-reply to someone repeatedly.
const hits = new Map();
const limited = (key, max, windowMs) => {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > 3600e3) hits.delete(k);
  return list.length > max;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Single line, no control characters, trimmed and length-capped
// eslint-disable-next-line no-control-regex
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F\u2028\u2029]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, max);
// wa.me link for the lead's WhatsApp number; 10-digit numbers are assumed to be US/Canada (+1).
const waLink = (num) => {
  let d = String(num).replace(/\D/g, '');
  if (d.length === 10) d = '1' + d;
  return d.length >= 8 && d.length <= 15 ? `https://wa.me/${d}` : '';
};
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

const fail = (res, status, message) => res.status(status).json({ success: false, message });

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return fail(res, 405, 'Method not allowed');
  }
  const origin = req.headers.origin || req.headers.referer || '';
  if (!allowedOrigin(origin)) return fail(res, 403, 'Forbidden');
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    return fail(res, 415, 'Unsupported content type');
  }

  const body = readBody(req);
  if (JSON.stringify(body).length > MAX_BODY) return fail(res, 413, 'Too large');
  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (body._honey) return res.status(200).json({ success: true });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (limited(`ip:${ip}`, 5, 10 * 60e3)) return fail(res, 429, 'Too many requests. Please try again in a few minutes.');

  const lead = {};
  for (const k of Object.keys(FIELDS)) lead[k] = clean(body[k], k === 'website' ? 300 : 120);
  const missing = REQUIRED.filter((k) => !lead[k]);
  if (missing.length || lead.email.length > 254 || !EMAIL_RE.test(lead.email) || !TRADES.has(lead.trade)) {
    return fail(res, 400, 'Please fill in all required fields with a valid email.');
  }
  if (lead.website && !/^https?:\/\//i.test(lead.website)) lead.website = `https://${lead.website}`;

  const user = process.env.SMTP_USER || 'info@flooringwebpros.com';
  const pass = process.env.SMTP_PASS;
  if (!pass) {
    console.error('[lead] SMTP_PASS is not set in Vercel environment variables');
    return res.status(500).json({ success: false, message: 'Email is not configured' });
  }
  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port, secure: port === 465, auth: { user, pass },
  });
  const to = process.env.LEAD_TO || user;

  // 1) Lead notification — this one must succeed.
  const rows = Object.entries(FIELDS).map(([k, label]) =>
    `<tr><td style="padding:8px 14px;border:1px solid #e4dacb;background:#f3ece1;font:700 14px Arial,sans-serif;color:#1c1814;white-space:nowrap">${label}</td>` +
    `<td style="padding:8px 14px;border:1px solid #e4dacb;font:14px Arial,sans-serif;color:#1c1814">${k === 'phone' && waLink(lead.phone) ? `<a href="${waLink(lead.phone)}" style="color:#c2551f">${esc(lead.phone)}</a> (tap to WhatsApp)` : esc(lead[k] || '—')}</td></tr>`).join('');
  try {
    await transporter.sendMail({
      from: { name: 'Flooring WebPros Website', address: user },
      to,
      replyTo: { name: lead.name, address: lead.email },
      subject: `New mockup request — ${lead.business} (${lead.city})`,
      text: Object.entries(FIELDS).map(([k, label]) => `${label}: ${lead[k] || '—'}`).join('\n'),
      html: `<p style="font:16px Arial,sans-serif;color:#1c1814">New free-mockup request from flooringwebpros.com. Hit <b>Reply</b> to answer ${esc(lead.name)} directly.</p>` +
            `<table cellspacing="0" cellpadding="0" style="border-collapse:collapse">${rows}</table>`,
    });
  } catch (err) {
    console.error('[lead] sending lead email failed:', err && err.message);
    return res.status(502).json({ success: false, message: 'Could not send' });
  }

  // 2) Auto-reply to the visitor — a failure here must not lose the lead.
  //    Capped per address so the form can't be used to flood someone's inbox.
  const first = lead.name.split(/\s+/)[0];
  if (!limited(`to:${lead.email.toLowerCase()}`, 2, 60 * 60e3)) try {
    await transporter.sendMail({
      from: { name: 'Flooring WebPros', address: user },
      to: { name: lead.name, address: lead.email },
      subject: `Your free mockup is in motion, ${first}`,
      html: fill(reply.html, { first_name: esc(first), business: esc(lead.business) }),
      text: fill(reply.text, { first_name: first, business: lead.business }),
    });
  } catch (err) {
    console.error('[lead] auto-reply failed (lead was delivered):', err && err.message);
  }

  return res.status(200).json({ success: true });
};
