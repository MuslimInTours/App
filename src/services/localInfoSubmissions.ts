import AsyncStorage from '@react-native-async-storage/async-storage';

export type LocalInfoSubmissionStatus = 'archived' | 'new' | 'reviewed';

export type LocalInfoSubmission = {
  contact: string;
  createdAt: string;
  id: string;
  message: string;
  status: LocalInfoSubmissionStatus;
  title: string;
  type: 'info';
};

const localInfoSubmissionsStorageKey = 'muslimin:local-info-submissions:v1';

const isLocalInfoSubmissionStatus = (value: unknown): value is LocalInfoSubmissionStatus =>
  value === 'archived' || value === 'new' || value === 'reviewed';

const mapLocalInfoSubmission = (value: unknown): LocalInfoSubmission | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<LocalInfoSubmission>;

  if (
    typeof candidate.contact !== 'string' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.id !== 'string' ||
    typeof candidate.message !== 'string' ||
    !isLocalInfoSubmissionStatus(candidate.status) ||
    typeof candidate.title !== 'string' ||
    candidate.type !== 'info'
  ) {
    return null;
  }

  return {
    contact: candidate.contact,
    createdAt: candidate.createdAt,
    id: candidate.id,
    message: candidate.message,
    status: candidate.status,
    title: candidate.title,
    type: 'info',
  };
};

export async function loadLocalInfoSubmissions() {
  const value = await AsyncStorage.getItem(localInfoSubmissionsStorageKey);

  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.flatMap((item) => {
          const submission = mapLocalInfoSubmission(item);
          return submission ? [submission] : [];
        })
      : [];
  } catch {
    return [];
  }
}

async function saveLocalInfoSubmissions(submissions: LocalInfoSubmission[]) {
  await AsyncStorage.setItem(localInfoSubmissionsStorageKey, JSON.stringify(submissions));
}

export async function addLocalInfoSubmission(input: {
  contact: string;
  message: string;
  title: string;
}) {
  const submissions = await loadLocalInfoSubmissions();
  const submission: LocalInfoSubmission = {
    contact: input.contact.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    id: `local-info-${Date.now()}`,
    message: input.message.trim(),
    status: 'new',
    title: input.title.trim(),
    type: 'info',
  };

  await saveLocalInfoSubmissions([submission, ...submissions]);
  return submission;
}

export async function updateLocalInfoSubmissionStatus(
  submissionId: string,
  status: LocalInfoSubmissionStatus,
) {
  const submissions = await loadLocalInfoSubmissions();
  await saveLocalInfoSubmissions(
    submissions.map((submission) =>
      submission.id === submissionId ? { ...submission, status } : submission,
    ),
  );
}
