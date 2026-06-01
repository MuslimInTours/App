import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const checks = [];
const env = {};

function addCheck(name, ok, detail) {
  checks.push({ detail, name, ok });
}

function commandOutput(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    return error.stderr?.toString().trim() || error.stdout?.toString().trim() || error.message;
  }
}

if (!existsSync('.env')) {
  addCheck('.env', false, 'Créer .env à partir de .env.example avec les clés Supabase.');
} else {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2].trim();
    }
  });
  addCheck(
    'EXPO_PUBLIC_SUPABASE_URL',
    Boolean(env.EXPO_PUBLIC_SUPABASE_URL?.startsWith('https://')),
    'URL Supabase manquante ou placeholder.',
  );
  addCheck(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    Boolean(env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key',
    'Clé anon Supabase manquante ou placeholder.',
  );
}

const supabaseProjects = commandOutput('npx', ['supabase', 'projects', 'list', '--output', 'json']);
addCheck(
  'Supabase login',
  !supabaseProjects.includes('Access token not provided'),
  'Lancer npm run supabase:login.',
);

const easUser = commandOutput('npx', ['eas-cli', 'whoami']);
addCheck('EAS login', !easUser.includes('Not logged in'), 'Lancer npm run eas:login.');

const supabaseSecrets = commandOutput('npx', ['supabase', 'secrets', 'list']);
const requiredEdgeSecrets = ['RESEND_API_KEY', 'FEEDBACK_EMAIL_TO', 'FEEDBACK_EMAIL_FROM'];
const missingEdgeSecrets = requiredEdgeSecrets.filter((secret) => !supabaseSecrets.includes(secret));
addCheck(
  'Supabase email secrets',
  missingEdgeSecrets.length === 0,
  `Secrets manquants : ${missingEdgeSecrets.join(', ')}.`,
);

async function checkSupabaseTables() {
  if (!env.EXPO_PUBLIC_SUPABASE_URL || !env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return;
  }

  const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  const requiredTables = ['announcements', 'mosques', 'device_tokens', 'feedback_submissions'];

  await Promise.all(
    requiredTables.map(async (table) => {
      const { error } = await supabase.from(table).select('*').limit(1);
      addCheck(
        `Supabase table ${table}`,
        !error,
        error?.code === 'PGRST205'
          ? `Table manquante. Appliquer docs/supabase-schema.sql ou supabase/migrations/*.sql.`
          : error?.message ?? 'Table inaccessible.',
      );
    }),
  );

  const { error: pushError } = await supabase.functions.invoke('send-push', { body: {} });
  addCheck(
    'Supabase function send-push',
    pushError?.context?.status !== 404,
    'Fonction Edge non déployée. Lancer npm run supabase:deploy:push après login Supabase.',
  );

  const feedbackResponse = await fetch(`${env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/send-feedback`, {
    body: JSON.stringify({}),
    headers: {
      Authorization: `Bearer ${env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      apikey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    method: 'POST',
  }).catch(() => null);
  const feedbackBody = feedbackResponse ? await feedbackResponse.text().catch(() => '') : '';
  addCheck(
    'Supabase function send-feedback',
    Boolean(feedbackResponse && feedbackResponse.status !== 404 && !feedbackBody.includes('Missing email environment')),
    feedbackResponse?.status === 404
      ? 'Fonction Edge non déployée. Lancer npm run supabase:deploy:feedback après login Supabase.'
      : missingEdgeSecrets.length > 0
        ? `Secrets manquants : ${missingEdgeSecrets.join(', ')}.`
        : 'Fonction accessible, mais la validation complète demande un envoi réel depuis l’app.',
  );
}

await checkSupabaseTables();

console.log("\nMuslim'in setup check\n");
for (const check of checks) {
  console.log(`${check.ok ? 'OK ' : 'NO '} ${check.name} - ${check.ok ? 'prêt' : check.detail}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  process.exitCode = 1;
}
