type FeedbackType = 'amelioration' | 'contact' | 'erreur' | 'info';

type FeedbackPayload = {
  contact?: unknown;
  message?: unknown;
  photo?: unknown;
  title?: unknown;
  type?: unknown;
};

type FeedbackPhoto = {
  base64: string;
  name: string;
  type: string;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

const feedbackTypeLabels: Record<FeedbackType, string> = {
  amelioration: 'Amelioration',
  contact: 'Contact',
  erreur: 'Erreur',
  info: 'Information locale',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function isFeedbackType(value: unknown): value is FeedbackType {
  return (
    value === 'amelioration' || value === 'contact' || value === 'erreur' || value === 'info'
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizePhoto(value: unknown): FeedbackPhoto | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<FeedbackPhoto>;
  const base64 = typeof candidate.base64 === 'string' ? candidate.base64 : '';
  const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
  const type = typeof candidate.type === 'string' ? candidate.type.trim() : '';

  if (!base64 || !name || !type.startsWith('image/')) {
    return null;
  }

  if (base64.length > 8_000_000) {
    throw new Error('Photo attachment is too large.');
  }

  return { base64, name, type };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const emailTo = Deno.env.get('FEEDBACK_EMAIL_TO');
    const emailFrom = Deno.env.get('FEEDBACK_EMAIL_FROM') ?? "Muslim'in <onboarding@resend.dev>";

    if (!resendApiKey || !emailTo) {
      return jsonResponse({ error: 'Missing email environment.' }, 500);
    }

    const payload = (await request.json().catch(() => ({}))) as FeedbackPayload;
    const type = isFeedbackType(payload.type) ? payload.type : null;
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    const contact =
      typeof payload.contact === 'string' ? payload.contact.trim().toLowerCase() : '';
    let photo: FeedbackPhoto | null = null;
    try {
      photo = normalizePhoto(payload.photo);
    } catch {
      return jsonResponse({ error: 'Photo attachment is too large.' }, 400);
    }

    if (!type || !title || !message || !isValidEmail(contact)) {
      return jsonResponse({ error: 'Invalid feedback payload.' }, 400);
    }

    const typeLabel = feedbackTypeLabels[type];
    const subject = `[Muslim'in] ${typeLabel} - ${title}`;
    const text = [
      `Type: ${typeLabel}`,
      `Titre: ${title}`,
      `Contact: ${contact}`,
      '',
      message,
    ].join('\n');
    const html = `
      <h2>${escapeHtml(typeLabel)} - ${escapeHtml(title)}</h2>
      <p><strong>Contact :</strong> ${escapeHtml(contact)}</p>
      <p><strong>Type :</strong> ${escapeHtml(typeLabel)}</p>
      ${photo ? `<p><strong>Photo :</strong> ${escapeHtml(photo.name)}</p>` : ''}
      <hr />
      <p>${escapeHtml(message).replaceAll('\n', '<br />')}</p>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from: emailFrom,
        html,
        attachments: photo
          ? [{ content: photo.base64, content_type: photo.type, filename: photo.name }]
          : undefined,
        reply_to: contact,
        subject,
        text,
        to: emailTo,
      }),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse({ error: 'Email provider rejected the message.', result }, 502);
    }

    return jsonResponse({ sent: true, result });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});
