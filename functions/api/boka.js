/* Cloudflare Pages Function: POST /api/boka
   Tar emot bokningar och kontaktmeddelanden från sajten, skickar
   1) ett mejl till Sweden City Service (info@ + Gmail) och
   2) en bekräftelse till kunden, via Brevo (transaktionsmejl).
   Bokningsnummer räknas upp i KV-lagret SCS_BOOKINGS (nyckel "next"). */

const SENDER = { name: 'Sweden City Service', email: 'info@swedencityservice.se' };
const TO = [{ email: 'info@swedencityservice.se', name: 'Sweden City Service' }, { email: 'swedencitys@gmail.com', name: 'Sweden City Service' }];
const PHONE = '070-028 38 39';
const NAVY = '#141E66';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clip = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

function shell(inner, en) {
  return `<!doctype html><html lang="sv"><body style="margin:0;padding:0;background:#F3F1ED;font-family:Helvetica,Arial,sans-serif;color:#1C1C1E;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F1ED;"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#fff;border-radius:14px;overflow:hidden;">
<tr><td style="background:${NAVY};padding:18px 28px;color:#fff;font-size:15px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;">Sweden City Service</td></tr>
<tr><td style="padding:28px;">${inner}</td></tr>
<tr><td style="padding:16px 28px 22px;border-top:1px solid #ECE7DF;font-size:12px;line-height:1.6;color:#6B6B70;">Sweden City Service AB<br>${en ? 'Contact' : 'Kontakt'} ${PHONE} · info@swedencityservice.se</td></tr>
</table></td></tr></table></body></html>`;
}

function rowsTable(rows) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:15px;line-height:1.5;">${rows.map(([k, v]) =>
    `<tr><td style="padding:9px 0;border-bottom:1px solid #ECE7DF;color:#6B6B70;width:38%;vertical-align:top;">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid #ECE7DF;vertical-align:top;">${esc(v).replace(/\n/g, '<br>')}</td></tr>`).join('')}</table>`;
}

function ownerMail(p, number) {
  const booking = p.kind === 'booking';
  const title = booking ? `Ny bokning nr ${number}` : 'Nytt meddelande via kontaktformuläret';
  const weekend = p.weekend ? `<p style="margin:0 0 16px;padding:10px 14px;background:#FFF4DF;border-radius:8px;font-size:14px;"><strong>Helgbokning.</strong> Helgpris bekräftas i offerten.</p>` : '';
  const english = p.lang === 'en' ? `<p style="margin:0 0 16px;padding:10px 14px;background:#E8EDF8;border-radius:8px;font-size:14px;"><strong>Engelsktalande kund.</strong> Kunden använde den engelska sidan och har fått sin bekräftelse på engelska.</p>` : '';
  const inner = `<h1 style="margin:0 0 6px;font-size:22px;font-weight:700;">${esc(title)}</h1>
<p style="margin:0 0 18px;color:#6B6B70;font-size:14px;">${esc(p.service || p.subject || '')}</p>${weekend}${english}${rowsTable(p.rows)}
<p style="margin:22px 0 0;"><a href="mailto:${esc(p.customer.email)}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-size:14px;font-weight:700;">Svara ${esc(p.customer.name.split(' ')[0])}</a>
&nbsp; <a href="tel:${esc(p.customer.phone.replace(/[^\d+]/g, ''))}" style="display:inline-block;color:${NAVY};text-decoration:none;padding:12px 8px;font-size:14px;font-weight:700;">Ring ${esc(p.customer.phone)}</a></p>
<p style="margin:18px 0 0;font-size:12px;color:#6B6B70;">Skickat från ${esc(p.page || 'scs.isacfaldt.se')}</p>`;
  const text = `${title}\n${p.service || p.subject || ''}\n${p.weekend ? 'HELGBOKNING, helgpris bekräftas i offerten\n' : ''}${p.lang === 'en' ? 'ENGELSKTALANDE KUND\n' : ''}\n` + p.rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nSkickat från ${p.page || ''}`;
  const subject = booking
    ? `Bokning nr ${number}: ${p.service}${p.weekend ? ' (helg)' : ''}`
    : `Kontakt: ${p.subject || 'Meddelande'} från ${p.customer.name}`;
  return { subject, html: shell(inner), text };
}

function customerMail(p, number) {
  const en = p.lang === 'en';
  if (p.kind !== 'booking') {
    const inner = en
      ? `<h1 style="margin:0 0 12px;font-size:22px;">Thank you for your message</h1><p style="margin:0 0 10px;font-size:15px;line-height:1.6;">We have received your message and will get back to you within 24 hours.</p><p style="margin:0;font-size:15px;line-height:1.6;">If anything is urgent, call us on ${PHONE}.</p>`
      : `<h1 style="margin:0 0 12px;font-size:22px;">Tack för ditt meddelande</h1><p style="margin:0 0 10px;font-size:15px;line-height:1.6;">Vi har tagit emot ditt meddelande och hör av oss inom 24 timmar.</p><p style="margin:0;font-size:15px;line-height:1.6;">Är det bråttom når du oss på ${PHONE}.</p>`;
    const text = en ? `Thank you for your message. We have received it and will get back to you within 24 hours. If anything is urgent, call us on ${PHONE}.\n\nSweden City Service` : `Tack för ditt meddelande. Vi har tagit emot det och hör av oss inom 24 timmar. Är det bråttom når du oss på ${PHONE}.\n\nSweden City Service`;
    return { subject: en ? 'We have received your message' : 'Vi har tagit emot ditt meddelande', html: shell(inner, en), text };
  }
  /* Bokningsbekräftelse, formatet Farzin visade */
  const L = en
    ? { h: 'Booking confirmation', no: 'Booking no', name: 'Name', email: 'Email', phone: 'Phone', svc: 'Booked service', when: 'Date & time', thanks: 'Thank you for choosing us!', contact: 'Contact' }
    : { h: 'Bokningsbekräftelse', no: 'Bokningsnr', name: 'Namn', email: 'E-post', phone: 'Telefon', svc: 'Bokad tjänst', when: 'Datum & tid', thanks: 'Tack för att du valde oss!', contact: 'Kontakt' };
  const rows = [[L.no, String(number)], [L.name, p.customer.name], [L.email, p.customer.email], [L.phone, p.customer.phone], [L.svc, p.service], [L.when, p.when || '']];
  const inner = `<h1 style="margin:0 0 18px;font-size:24px;font-weight:700;">${L.h}</h1>${rowsTable(rows)}
<p style="margin:24px 0 4px;font-size:17px;font-weight:700;">${L.thanks}</p>
<p style="margin:0;font-size:15px;line-height:1.6;">Sweden City Service<br>${L.contact} 0700283839</p>`;
  const text = `${L.h}\n\n` + rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${L.thanks}\nSweden City Service\n${L.contact} 0700283839`;
  return { subject: `${L.h} ${L.no.toLowerCase()} ${number}`, html: shell(inner, en), text };
}

async function brevo(key, msg) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(msg)
  });
  if (!res.ok) throw new Error('Brevo ' + res.status + ': ' + (await res.text()).slice(0, 300));
  return res.json();
}

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch (e) { return json({ ok: false, error: 'bad json' }, 400); }
  if (body.website) return json({ ok: true, number: 0 }); /* honeypot */
  const kind = body.kind === 'contact' ? 'contact' : 'booking';
  const c = body.customer || {};
  const p = {
    kind,
    lang: body.lang === 'en' ? 'en' : 'sv',
    service: clip(body.service, 80),
    subject: clip(body.subject, 80),
    when: clip(body.when, 120),
    weekend: !!body.weekend,
    page: clip(body.page, 200),
    customer: { name: clip(c.name, 80), email: clip(c.email, 120), phone: clip(c.phone, 40) },
    rows: Array.isArray(body.rows) ? body.rows.slice(0, 30).map(r => [clip(r[0], 60), String(r[1] == null ? '' : r[1]).trim().slice(0, 2000)]).filter(r => r[0]) : []
  };
  if (!p.customer.name || !EMAIL_RE.test(p.customer.email)) return json({ ok: false, error: 'missing name or email' }, 400);
  if (kind === 'booking' && !p.service) return json({ ok: false, error: 'missing service' }, 400);
  if (!env.BREVO_KEY) return json({ ok: false, error: 'mailer not configured' }, 500);

  let number = 0;
  if (kind === 'booking' && env.SCS_BOOKINGS) {
    number = parseInt(await env.SCS_BOOKINGS.get('next'), 10) || 1;
    await env.SCS_BOOKINGS.put('next', String(number + 1));
    await env.SCS_BOOKINGS.put('b:' + String(number).padStart(6, '0'), JSON.stringify({ at: new Date().toISOString(), ...p }));
  }

  const o = ownerMail(p, number), k = customerMail(p, number);
  try {
    await brevo(env.BREVO_KEY, { sender: SENDER, to: TO, replyTo: { email: p.customer.email, name: p.customer.name }, subject: o.subject, htmlContent: o.html, textContent: o.text });
  } catch (e) { return json({ ok: false, error: String(e.message || e) }, 502); }
  let confirmed = true;
  try {
    await brevo(env.BREVO_KEY, { sender: SENDER, to: [{ email: p.customer.email, name: p.customer.name }], replyTo: SENDER, subject: k.subject, htmlContent: k.html, textContent: k.text });
  } catch (e) { confirmed = false; }
  return json({ ok: true, number, confirmed });
}

export function onRequest() { return json({ ok: false, error: 'POST only' }, 405); }
