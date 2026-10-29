// POST /api/lead — homepage "Free Mockup" form.
// 1) emails the lead to LEAD_TO (Reply-To = visitor)
// 2) sends the visitor the branded auto-reply from the same mailbox
//
// Vercel environment variables:
//   SMTP_PASS  (required) password of the mailbox below
//   SMTP_USER  (optional) default lead@flooringwebpros.com
//   LEAD_TO    (optional) where leads go, default = SMTP_USER
//   SMTP_HOST / SMTP_PORT (optional) default smtp.hostinger.com / 465
const nodemailer = require('nodemailer');
const reply = require('../lib/mockup-reply.js');

const FIELDS = {
  name: 'Name', business: 'Business', phone: 'Phone', email: 'Email',
  city: 'City / Service Area', trade: 'Trade', website: 'Current website',
};
const REQUIRED = ['name', 'business', 'phone', 'email', 'city', 'trade'];
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const fill = (tpl, vars) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const body = readBody(req);
  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (body._honey) return res.status(200).json({ success: true });

  const lead = {};
  for (const k of Object.keys(FIELDS)) lead[k] = clean(body[k], k === 'website' ? 300 : 120);
  const missing = REQUIRED.filter((k) => !lead[k]);
  if (missing.length || !EMAIL_RE.test(lead.email)) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields with a valid email.' });
  }

  const user = process.env.SMTP_USER || 'lead@flooringwebpros.com';
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
    `<td style="padding:8px 14px;border:1px solid #e4dacb;font:14px Arial,sans-serif;color:#1c1814">${esc(lead[k] || '—')}</td></tr>`).join('');
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
  const first = lead.name.split(/\s+/)[0];
  try {
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
