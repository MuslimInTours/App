import { addLocalInfoSubmission } from './localInfoSubmissions';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type FeedbackType = 'amelioration' | 'contact' | 'erreur' | 'info';

export type FeedbackInput = {
  contact: string;
  message: string;
  photo?: FeedbackPhoto;
  title: string;
  type: FeedbackType;
};

export type FeedbackPhoto = {
  base64: string;
  name: string;
  type: string;
};

export const feedbackTypeLabels: Record<FeedbackType, string> = {
  amelioration: 'Amélioration',
  contact: 'Contact',
  erreur: 'Erreur',
  info: 'Information locale',
};

export function isValidFeedbackEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function submitFeedback(input: FeedbackInput) {
  const payload = {
    contact: input.contact.trim().toLowerCase(),
    message: input.message.trim(),
    photo: input.photo,
    title: input.title.trim(),
    type: input.type,
  };

  if (!isSupabaseConfigured || !supabase) {
    if (payload.type === 'info') {
      await addLocalInfoSubmission(payload);
      return;
    }

    throw new Error('Supabase n’est pas configuré.');
  }

  const storedMessage = payload.photo
    ? `${payload.message}\n\nPhoto jointe : ${payload.photo.name}`
    : payload.message;

  const { error: insertError } = await supabase.from('feedback_submissions').insert({
    contact: payload.contact,
    message: storedMessage,
    status: 'new',
    title: payload.title,
    type: payload.type,
  });

  if (insertError) {
    if (payload.type === 'info') {
      await addLocalInfoSubmission({ ...payload, message: storedMessage });
      return;
    }

    throw insertError;
  }

  const { error: functionError } = await supabase.functions.invoke('send-feedback', {
    body: payload,
  });

  if (functionError) {
    if (payload.type === 'info') {
      return;
    }

    throw functionError;
  }
}
