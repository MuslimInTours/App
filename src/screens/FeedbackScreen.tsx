import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { FeedbackType, isValidFeedbackEmail, submitFeedback } from '../services/feedbackService';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

const feedbackTypes: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  id: FeedbackType;
  label: string;
}> = [
  { icon: 'alert-circle', id: 'erreur', label: 'Signaler une erreur' },
  { icon: 'bulb', id: 'amelioration', label: 'Suggérer une amélioration' },
  { icon: 'mail', id: 'contact', label: 'Contact' },
];

type FeedbackScreenProps = {
  onBack: () => void;
};

export function FeedbackScreen({ onBack }: FeedbackScreenProps) {
  useStyles();

  const [type, setType] = useState<FeedbackType>('erreur');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const canSubmit = isValidFeedbackEmail(contact) && Boolean(title.trim() && message.trim());

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      setStatus('Ajoute une adresse mail, un objet et un message avant d’envoyer.');
      return;
    }

    if (!isValidFeedbackEmail(contact)) {
      setStatus('Ajoute une adresse mail valide pour que l’équipe puisse te répondre.');
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await submitFeedback({ contact, message, title, type });
      setTitle('');
      setMessage('');
      setContact('');
      setStatus('Merci, ta demande a bien été envoyée à l’équipe.');
    } catch {
      setStatus('Envoi impossible pour le moment. Vérifie la configuration Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      headerIcon="chatbox-ellipses"
      title="Contacter"
      subtitle="Signaler une erreur, suggérer une amélioration ou écrire à l’équipe."
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.textInverse} name="chevron-back" size={18} />
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>

      <Card>
        <View style={styles.typeGrid}>
          {feedbackTypes.map((feedbackType) => {
            const isActive = feedbackType.id === type;

            return (
              <Pressable
                key={feedbackType.id}
                onPress={() => setType(feedbackType.id)}
                style={[styles.typeChip, isActive && styles.typeChipActive]}
              >
                <Ionicons
                  color={isActive ? colors.textInverse : colors.primaryDark}
                  name={feedbackType.icon}
                  size={18}
                />
                <Text style={[styles.typeChipText, isActive && styles.typeChipTextActive]}>
                  {feedbackType.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setContact}
          placeholder="Adresse mail"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={contact}
        />
        <TextInput
          onChangeText={setTitle}
          placeholder="Objet"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <TextInput
          multiline
          onChangeText={setMessage}
          placeholder="Message"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.textArea]}
          value={message}
        />

        <Pressable
          disabled={isSubmitting || !canSubmit}
          onPress={send}
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
          </Text>
        </Pressable>
      </Card>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeChip: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  typeChipTextActive: {
    color: colors.textInverse,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
  },
  textArea: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '900',
  },
  status: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
