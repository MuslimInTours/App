import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { AnnouncementCategory } from '../data/announcements';
import {
  FeedbackPhoto,
  isValidFeedbackEmail,
  submitFeedback,
} from '../services/feedbackService';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

const categories: AnnouncementCategory[] = [
  'Mosquée',
  'Cours',
  'Solidarité',
  'Famille',
  'Prières mortuaires',
];

const emptyForm = {
  category: 'Mosquée' as AnnouncementCategory,
  contact: '',
  date: '',
  isImportant: false,
  location: '',
  summary: '',
  title: '',
};

type SelectedPhoto = FeedbackPhoto & {
  uri: string;
};

type SubmitInfoScreenProps = {
  onBack: () => void;
};

export function SubmitInfoScreen({ onBack }: SubmitInfoScreenProps) {
  useStyles();

  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const canSubmit =
    isValidFeedbackEmail(form.contact) &&
    Boolean(form.title.trim() && form.date.trim() && form.location.trim());

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setStatus('Autorise l’accès aux photos pour joindre une image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      base64: true,
      mediaTypes: ['images'],
      quality: 0.55,
    });

    if (result.canceled) {
      return;
    }

    const [asset] = result.assets;

    if (!asset.base64) {
      setStatus('Impossible de lire cette photo. Essaie une autre image.');
      return;
    }

    setPhoto({
      base64: asset.base64,
      name: asset.fileName ?? `photo-info-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
      uri: asset.uri,
    });
    setStatus(null);
  };

  const send = async () => {
    if (!canSubmit) {
      setStatus('Ajoute une adresse mail valide, un titre, une date ou horaire et un lieu.');
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const message = [
        `Catégorie : ${form.category}`,
        `Date ou horaire : ${form.date.trim()}`,
        `Lieu : ${form.location.trim()}`,
        `Annonce importante : ${form.isImportant ? 'oui' : 'non'}`,
        '',
        form.summary.trim(),
      ].join('\n');

      await submitFeedback({
        contact: form.contact,
        message,
        photo: photo ?? undefined,
        title: form.title,
        type: 'info',
      });

      setForm(emptyForm);
      setPhoto(null);
      setStatus('Merci, ta proposition a bien été envoyée à l’équipe.');
    } catch {
      setStatus('Envoi impossible pour le moment. Vérifie la configuration Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      headerIcon="send"
      title="Proposer une info"
      subtitle="Transmettre une annonce locale à relire avant publication."
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.textInverse} name="chevron-back" size={18} />
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>

      <Card>
        <Text style={styles.cardTitle}>Nouvelle proposition</Text>
        <Text style={styles.cardText}>
          Ces champs correspondent à ceux de l’espace administrateur.
        </Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={(contact) => setForm((current) => ({ ...current, contact }))}
          placeholder="Adresse mail"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={form.contact}
        />
        <TextInput
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
          placeholder="Titre"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={form.title}
        />
        <TextInput
          onChangeText={(date) => setForm((current) => ({ ...current, date }))}
          placeholder="Date ou horaire"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={form.date}
        />
        <TextInput
          onChangeText={(location) => setForm((current) => ({ ...current, location }))}
          placeholder="Lieu"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={form.location}
        />
        <TextInput
          multiline
          onChangeText={(summary) => setForm((current) => ({ ...current, summary }))}
          placeholder="Description (facultative)"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.textArea]}
          value={form.summary}
        />

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const isActive = form.category === category;

            return (
              <Pressable
                key={category}
                onPress={() => setForm((current) => ({ ...current, category }))}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Text
                  style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.importantRow}>
          <View>
            <Text style={styles.importantTitle}>Annonce importante</Text>
            <Text style={styles.importantDescription}>À réserver aux urgences et janaza.</Text>
          </View>
          <Switch
            ios_backgroundColor={colors.borderStrong}
            onValueChange={() =>
              setForm((current) => ({ ...current, isImportant: !current.isImportant }))
            }
            thumbColor={form.isImportant ? colors.accent : colors.surface}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={form.isImportant}
          />
        </View>

        <Pressable onPress={pickPhoto} style={styles.photoButton}>
          <Ionicons color={colors.secondary} name="image-outline" size={20} />
          <Text style={styles.photoButtonText}>
            {photo ? 'Changer la photo' : 'Ajouter une photo'}
          </Text>
        </Pressable>

        {photo ? (
          <View style={styles.photoPreviewRow}>
            <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            <View style={styles.photoCopy}>
              <Text numberOfLines={1} style={styles.photoName}>{photo.name}</Text>
              <Pressable onPress={() => setPhoto(null)}>
                <Text style={styles.removePhotoText}>Retirer</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable
          disabled={isSubmitting || !canSubmit}
          onPress={send}
          style={[styles.primaryButton, !canSubmit && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? 'Envoi...' : 'Envoyer la proposition'}
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
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cardText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  importantRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  importantTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  importantDescription: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  photoButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  photoButtonText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  photoPreviewRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  photoPreview: {
    borderRadius: radius.sm,
    height: 56,
    width: 56,
  },
  photoCopy: {
    flex: 1,
  },
  photoName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  removePhotoText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.xs,
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
