export function formatUpdateTime(value?: string) {
  if (!value) {
    return 'mise à jour inconnue';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'mise à jour inconnue';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
  }).format(date);
}
