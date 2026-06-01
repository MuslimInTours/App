import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

type Announcement = {
  category: string;
  date: string;
  id: string;
  location: string;
  summary: string;
  title: string;
};

type DeviceToken = {
  token: string;
};

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase environment.' }, 500);
    }

    const authorization = request.headers.get('Authorization');
    const token = authorization?.replace('Bearer ', '');

    if (!token) {
      return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid admin session.' }, 401);
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userData.user.id)
      .single();

    if (!admin) {
      return jsonResponse({ error: 'Admin access required.' }, 403);
    }

    const payload = await request.json().catch(() => ({}));
    const announcementId = typeof payload.announcementId === 'string' ? payload.announcementId : '';

    if (!announcementId) {
      return jsonResponse({ error: 'announcementId is required.' }, 400);
    }

    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('id,title,category,date,location,summary')
      .eq('id', announcementId)
      .single<Announcement>();

    if (announcementError || !announcement) {
      return jsonResponse({ error: 'Announcement not found.' }, 404);
    }

    const { data: devices, error: devicesError } = await supabase
      .from('device_tokens')
      .select('token')
      .eq('enabled', true)
      .returns<DeviceToken[]>();

    if (devicesError) {
      return jsonResponse({ error: 'Unable to read device tokens.' }, 500);
    }

    const messages = (devices ?? []).map((device) => ({
      body: `${announcement.date} · ${announcement.location}`,
      data: { announcementId: announcement.id, category: announcement.category },
      sound: 'default',
      title: announcement.title,
      to: device.token,
    }));

    if (messages.length === 0) {
      return jsonResponse({ sent: 0, tickets: [] });
    }

    const tickets = [];

    for (const messageChunk of chunk(messages, 100)) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        body: JSON.stringify(messageChunk),
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const result = await response.json();
      tickets.push(result);
    }

    return jsonResponse({ sent: messages.length, tickets });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});
