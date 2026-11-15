// صافي: مراقب واتساب — يستلم بس، ما يدز ولا يقرا (ما يطلع "تمت القراءة")
// يبلغ موقع صافي بكل رسالة جديدة حتى الكاشير يطلع إنذار
const fs = require('fs');
const path = require('path');
const B = require('@whiskeysockets/baileys');
const makeWASocket = B.default || B.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = B;

const DIR = __dirname;
const AUTH = path.join(DIR, 'auth');
const URL_ = process.env.SAFI_URL || 'https://basraview.net/safi/wa.php';
const KEY = (process.env.WA_KEY || (fs.existsSync(path.join(DIR, '.wakey')) ? fs.readFileSync(path.join(DIR, '.wakey'), 'utf8') : '')).trim();
const silent = { level: 'silent', child() { return silent }, trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {} };

// ---- حفظ الربط على موقع صافي (ملفات السيرفر المجاني تنمسح) ----
async function authRestore() {
  try {
    const r = await fetch(URL_ + '?a=auth', { headers: { 'X-WA-Key': KEY } });
    const j = await r.json();
    const f = (j && j.files) || {};
    const names = Object.keys(f);
    if (!names.length) return;
    fs.mkdirSync(AUTH, { recursive: true });
    for (const n of names) if (/^[\w.\-]+$/.test(n)) fs.writeFileSync(path.join(AUTH, n), f[n]);
    console.log('auth restored', names.length);
  } catch (e) { console.log('auth restore err', e.message); }
}
let authT = null, authLast = '';
function authSoon() { clearTimeout(authT); authT = setTimeout(authSave, 8000); }
async function authSave(clear) {
  try {
    const files = {};
    if (!clear && fs.existsSync(AUTH)) for (const n of fs.readdirSync(AUTH)) files[n] = fs.readFileSync(path.join(AUTH, n), 'utf8');
    const body = JSON.stringify(files);
    if (body === authLast) return;
    const r = await fetch(URL_ + '?a=auth', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WA-Key': KEY }, body });
    if (r.ok) authLast = body;
  } catch (e) { console.log('auth save err', e.message); }
}

let sock = null, status = 'starting', qr = null, me = '', queue = [], busy = false, retry = 0;

async function push(extra) {
  if (busy) return; busy = true;
  const msgs = queue.splice(0, 40);
  const body = { status, qr: qr || '', me, msgs, ...(extra || {}) };
  try {
    const r = await fetch(URL_ + '?a=push', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WA-Key': KEY }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { queue.unshift(...msgs); console.log('push fail', r.status, j.err || ''); }
    else if (j.cmd === 'relink') relink();
  } catch (e) { queue.unshift(...msgs); console.log('push err', e.message); }
  busy = false;
  if (queue.length) setTimeout(push, 1000);
}

function textOf(m) {
  if (!m) return '';
  if (m.ephemeralMessage) m = m.ephemeralMessage.message;
  if (m.viewOnceMessage) m = m.viewOnceMessage.message;
  if (m.viewOnceMessageV2) m = m.viewOnceMessageV2.message;
  if (!m) return '';
  if (m.conversation) return m.conversation;
  if (m.extendedTextMessage) return m.extendedTextMessage.text || '';
  if (m.imageMessage) return '📷 صورة' + (m.imageMessage.caption ? ': ' + m.imageMessage.caption : '');
  if (m.videoMessage) return '🎥 فديو' + (m.videoMessage.caption ? ': ' + m.videoMessage.caption : '');
  if (m.audioMessage) return '🎤 بصمة صوت';
  if (m.documentMessage || m.documentWithCaptionMessage) return '📄 ملف';
  if (m.locationMessage || m.liveLocationMessage) return '📍 موقع';
  if (m.contactMessage || m.contactsArrayMessage) return '👤 جهة اتصال';
  if (m.stickerMessage) return 'ملصق';
  if (m.reactionMessage || m.protocolMessage || m.senderKeyDistributionMessage) return null; // مو رسالة جديدة
  return 'رسالة';
}
function num(jid) { return String(jid || '').split('@')[0].split(':')[0] }

async function relink() {
  console.log('relink requested');
  try { if (sock) await sock.logout() } catch (e) {}
  try { fs.rmSync(AUTH, { recursive: true, force: true }) } catch (e) {}
  await authSave(true);
  status = 'relink'; qr = null; me = ''; push();
  setTimeout(start, 2000);
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH);
  let version;
  try { version = (await fetchLatestBaileysVersion()).version } catch (e) {}
  sock = makeWASocket({
    version, auth: state, logger: silent, printQRInTerminal: false,
    browser: Browsers.macOS('Safi POS'),
    markOnlineOnConnect: false,          // حتى التلفون يبقى يطلع إشعارات عادي
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    generateHighQualityLinkPreview: false,
    getMessage: async () => undefined
  });
  sock.ev.on('creds.update', async () => { await saveCreds(); authSoon(); });
  sock.ev.on('connection.update', (u) => {
    if (u.qr) { qr = u.qr; status = 'qr'; push(); }
    if (u.connection === 'open') {
      status = 'open'; qr = null; retry = 0;
      me = num(sock.user && sock.user.id); console.log('connected', me); push(); authSoon();
    }
    if (u.connection === 'close') {
      const code = u.lastDisconnect && u.lastDisconnect.error && u.lastDisconnect.error.output ? u.lastDisconnect.error.output.statusCode : 0;
      console.log('closed', code);
      if (code === DisconnectReason.loggedOut) {
        try { fs.rmSync(AUTH, { recursive: true, force: true }) } catch (e) {}
        authSave(true);
        status = 'loggedout'; qr = null; me = ''; push();
        setTimeout(start, 3000);
      } else {
        status = 'reconnecting'; push();
        retry++; setTimeout(start, Math.min(60000, 2000 * retry));
      }
    }
  });
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      const k = m.key || {};
      if (k.fromMe) continue;
      const jid = k.remoteJid || '';
      if (jid.endsWith('@g.us') || jid === 'status@broadcast' || jid.endsWith('@newsletter') || jid.endsWith('@broadcast')) continue;
      const t = textOf(m.message);
      if (t === null) continue;
      const pn = k.remoteJidAlt || k.senderPn || (jid.endsWith('@s.whatsapp.net') ? jid : '');
      queue.push({ id: k.id, from: num(pn || jid), name: m.pushName || '', text: t, ts: Number(m.messageTimestamp) || Math.floor(Date.now() / 1000) });
    }
    if (queue.length) push();
  });
}

if (!KEY) { console.log('WA_KEY missing'); process.exit(1); }
// صفحة صغيرة حتى الاستضافة تعرف البرنامج حي
require('http').createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/plain' }); r.end('safi-wa ' + status); }).listen(process.env.PORT || 10000);
// يطرق على نفسه كل 10 دقايق حتى ما ينام بالاستضافة المجانية
const SELF = process.env.RENDER_EXTERNAL_URL;
if (SELF) setInterval(() => fetch(SELF).catch(() => {}), 10 * 60 * 1000);
setInterval(() => push(), 20000); // نبضة: الكاشير يعرف البرنامج شغال
setInterval(() => authSave(), 5 * 60 * 1000); // مفاتيح الجلسة تتغير ويا الرسائل
authRestore().then(start).catch((e) => { console.log('start err', e); process.exit(1); });
process.on('SIGTERM', async () => { await authSave(); process.exit(0); });
process.on('unhandledRejection', (e) => console.log('unhandled', e && e.message));
