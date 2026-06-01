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

type InfoFieldId =
  | 'burialLocation'
  | 'courseAudience'
  | 'courseDate'
  | 'courseLocation'
  | 'courseTitle'
  | 'deceasedName'
  | 'description'
  | 'familyDate'
  | 'familyLocation'
  | 'familyTitle'
  | 'janazaDate'
  | 'janazaLocation'
  | 'mosqueDate'
  | 'mosqueLocation'
  | 'mosqueTopic'
  | 'speaker'
  | 'solidarityDate'
  | 'solidarityLocation'
  | 'solidarityTitle';

type InfoField = {
  id: InfoFieldId;
  label: string;
  multiline?: boolean;
  placeholder: string;
  required?: boolean;
};

type InfoTypeConfig = {
  category: AnnouncementCategory;
  dateField: InfoFieldId;
  description: string;
  fields: InfoField[];
  forceImportant?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  importantDefault: boolean;
  locationField: InfoFieldId;
};

const infoTypeConfigs: InfoTypeConfig[] = [
  {
    category: 'Prières mortuaires',
    dateField: 'janazaDate',
    description: 'Nom, salat janaza, enterrement et détails utiles.',
    fields: [
      {
        id: 'deceasedName',
        label: 'Nom du défunt ou de la défunte',
        placeholder: 'Ex : Abdelkader B.',
        required: true,
      },
      {
        id: 'janazaDate',
        label: 'Date et heure de la salat janaza',
        placeholder: 'Ex : Aujourd’hui après Dhuhr',
        required: true,
      },
      {
        id: 'janazaLocation',
        label: 'Lieu de la salat janaza',
        placeholder: 'Ex : Mosquée Al-Fath',
        required: true,
      },
      {
        id: 'burialLocation',
        label: 'Lieu de l’enterrement',
        placeholder: 'Ex : Cimetière de La Salle',
        required: true,
      },
      {
        id: 'description',
        label: 'Description',
        multiline: true,
        placeholder: 'Informations utiles, accès, consignes...',
      },
    ],
    forceImportant: true,
    icon: 'moon',
    importantDefault: true,
    locationField: 'janazaLocation',
  },
  {
    category: 'Cours',
    dateField: 'courseDate',
    description: 'Type de cours, horaire, lieu, public et intervenant.',
    fields: [
      {
        id: 'courseTitle',
        label: 'Quel cours ?',
        placeholder: 'Ex : Cours de tajwid débutants',
        required: true,
      },
      {
        id: 'courseDate',
        label: 'Quand ?',
        placeholder: 'Ex : Samedi à 18h00',
        required: true,
      },
      {
        id: 'courseLocation',
        label: 'Où ?',
        placeholder: 'Ex : Mosquée de Bouzignac',
        required: true,
      },
      {
        id: 'speaker',
        label: 'Intervenant',
        placeholder: 'Ex : Imam, professeur, association...',
      },
      {
        id: 'courseAudience',
        label: 'Public concerné',
        placeholder: 'Ex : Adultes, femmes, enfants, débutants...',
      },
      {
        id: 'description',
        label: 'Description',
        multiline: true,
        placeholder: 'Programme, inscription, prix, matériel...',
      },
    ],
    icon: 'school',
    importantDefault: false,
    locationField: 'courseLocation',
  },
  {
    category: 'Mosquée',
    dateField: 'mosqueDate',
    description: 'Annonce liée à une mosquée, un horaire ou une organisation.',
    fields: [
      {
        id: 'mosqueTopic',
        label: 'Sujet de l’annonce',
        placeholder: 'Ex : Organisation de la prière du vendredi',
        required: true,
      },
      {
        id: 'mosqueDate',
        label: 'Date ou horaire',
        placeholder: 'Ex : Vendredi à 13h20',
        required: true,
      },
      {
        id: 'mosqueLocation',
        label: 'Mosquée ou lieu concerné',
        placeholder: 'Ex : Grande Mosquée de Tours',
        required: true,
      },
      {
        id: 'description',
        label: 'Description',
        multiline: true,
        placeholder: 'Accès, consignes, détails pratiques...',
      },
    ],
    icon: 'business',
    importantDefault: false,
    locationField: 'mosqueLocation',
  },
  {
    category: 'Solidarité',
    dateField: 'solidarityDate',
    description: 'Collecte, aide, appel à bénévoles ou action locale.',
    fields: [
      {
        id: 'solidarityTitle',
        label: 'Action solidaire',
        placeholder: 'Ex : Collecte alimentaire',
        required: true,
      },
      {
        id: 'solidarityDate',
        label: 'Quand ?',
        placeholder: 'Ex : Dimanche de 10h à 12h',
        required: true,
      },
      {
        id: 'solidarityLocation',
        label: 'Où ?',
        placeholder: 'Ex : Joué-lès-Tours',
        required: true,
      },
      {
        id: 'description',
        label: 'Description',
        multiline: true,
        placeholder: 'Besoins, contact, modalités, objets recherchés...',
      },
    ],
    icon: 'heart',
    importantDefault: false,
    locationField: 'solidarityLocation',
  },
  {
    category: 'Famille',
    dateField: 'familyDate',
    description: 'Activité, rencontre ou information pour les familles.',
    fields: [
      {
        id: 'familyTitle',
        label: 'Sujet',
        placeholder: 'Ex : Rencontre jeunes',
        required: true,
      },
      {
        id: 'familyDate',
        label: 'Quand ?',
        placeholder: 'Ex : Mercredi à 19h30',
        required: true,
      },
      {
        id: 'familyLocation',
        label: 'Où ?',
        placeholder: 'Ex : Tours nord',
        required: true,
      },
      {
        id: 'description',
        label: 'Description',
        multiline: true,
        placeholder: 'Âge, inscription, programme, informations utiles...',
      },
    ],
    icon: 'people',
    importantDefault: false,
    locationField: 'familyLocation',
  },
];

const defaultCategory: AnnouncementCategory = 'Prières mortuaires';
const configByCategory = Object.fromEntries(
  infoTypeConfigs.map((config) => [config.category, config]),
) as Record<AnnouncementCategory, InfoTypeConfig>;

const emptyFields: Record<InfoFieldId, string> = {
  burialLocation: '',
  courseAudience: '',
  courseDate: '',
  courseLocation: '',
  courseTitle: '',
  deceasedName: '',
  description: '',
  familyDate: '',
  familyLocation: '',
  familyTitle: '',
  janazaDate: '',
  janazaLocation: '',
  mosqueDate: '',
  mosqueLocation: '',
  mosqueTopic: '',
  speaker: '',
  solidarityDate: '',
  solidarityLocation: '',
  solidarityTitle: '',
};

type InfoForm = {
  category: AnnouncementCategory;
  contact: string;
  fields: Record<InfoFieldId, string>;
  isImportant: boolean;
};

const createEmptyForm = (): InfoForm => ({
  category: defaultCategory,
  contact: '',
  fields: { ...emptyFields },
  isImportant: configByCategory[defaultCategory].importantDefault,
});

type SelectedPhoto = FeedbackPhoto & {
  uri: string;
};

type SubmitInfoScreenProps = {
  onBack: () => void;
};

const getFieldValue = (form: InfoForm, id: InfoFieldId) => form.fields[id].trim();

const withOptionalLine = (label: string, value: string) =>
  value.trim() ? [`${label} : ${value.trim()}`] : [];

const buildTitle = (form: InfoForm) => {
  switch (form.category) {
    case 'Prières mortuaires':
      return `Prière mortuaire - ${getFieldValue(form, 'deceasedName')}`;
    case 'Cours':
      return getFieldValue(form, 'courseTitle');
    case 'Mosquée':
      return getFieldValue(form, 'mosqueTopic');
    case 'Solidarité':
      return getFieldValue(form, 'solidarityTitle');
    case 'Famille':
      return getFieldValue(form, 'familyTitle');
    default:
      return 'Proposition locale';
  }
};

const buildSummary = (form: InfoForm) => {
  switch (form.category) {
    case 'Prières mortuaires':
      return [
        `Nom du défunt : ${getFieldValue(form, 'deceasedName')}`,
        `Salat janaza : ${getFieldValue(form, 'janazaDate')} - ${getFieldValue(form, 'janazaLocation')}`,
        `Enterrement : ${getFieldValue(form, 'burialLocation')}`,
        ...withOptionalLine('Description', getFieldValue(form, 'description')),
      ].join('\n');
    case 'Cours':
      return [
        `Cours : ${getFieldValue(form, 'courseTitle')}`,
        `Date ou horaire : ${getFieldValue(form, 'courseDate')}`,
        `Lieu : ${getFieldValue(form, 'courseLocation')}`,
        ...withOptionalLine('Intervenant', getFieldValue(form, 'speaker')),
        ...withOptionalLine('Public concerné', getFieldValue(form, 'courseAudience')),
        ...withOptionalLine('Description', getFieldValue(form, 'description')),
      ].join('\n');
    case 'Mosquée':
      return [
        `Sujet : ${getFieldValue(form, 'mosqueTopic')}`,
        `Date ou horaire : ${getFieldValue(form, 'mosqueDate')}`,
        `Lieu : ${getFieldValue(form, 'mosqueLocation')}`,
        ...withOptionalLine('Description', getFieldValue(form, 'description')),
      ].join('\n');
    case 'Solidarité':
      return [
        `Action : ${getFieldValue(form, 'solidarityTitle')}`,
        `Date ou horaire : ${getFieldValue(form, 'solidarityDate')}`,
        `Lieu : ${getFieldValue(form, 'solidarityLocation')}`,
        ...withOptionalLine('Description', getFieldValue(form, 'description')),
      ].join('\n');
    case 'Famille':
      return [
        `Sujet : ${getFieldValue(form, 'familyTitle')}`,
        `Date ou horaire : ${getFieldValue(form, 'familyDate')}`,
        `Lieu : ${getFieldValue(form, 'familyLocation')}`,
        ...withOptionalLine('Description', getFieldValue(form, 'description')),
      ].join('\n');
    default:
      return getFieldValue(form, 'description') || 'Description non renseignée.';
  }
};

export function SubmitInfoScreen({ onBack }: SubmitInfoScreenProps) {
  useStyles();

  const [form, setForm] = useState<InfoForm>(() => createEmptyForm());
  const [photo, setPhoto] = useState<SelectedPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const currentConfig = configByCategory[form.category];
  const missingRequiredField = currentConfig.fields.find(
    (field) => field.required && !getFieldValue(form, field.id),
  );
  const canSubmit = isValidFeedbackEmail(form.contact) && !missingRequiredField;

  const updateField = (id: InfoFieldId, value: string) => {
    setForm((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [id]: value,
      },
    }));
  };

  const selectCategory = (category: AnnouncementCategory) => {
    const config = configByCategory[category];
    setForm((current) => ({
      ...current,
      category,
      isImportant: config.forceImportant ? true : config.importantDefault,
    }));
    setStatus(null);
  };

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
    if (!isValidFeedbackEmail(form.contact)) {
      setStatus('Ajoute une adresse mail valide pour que l’équipe puisse te répondre.');
      return;
    }

    if (missingRequiredField) {
      setStatus(`Renseigne le champ : ${missingRequiredField.label}.`);
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const date = getFieldValue(form, currentConfig.dateField);
      const location = getFieldValue(form, currentConfig.locationField);
      const isImportant = currentConfig.forceImportant ? true : form.isImportant;
      const message = [
        `Catégorie : ${form.category}`,
        `Date ou horaire : ${date}`,
        `Lieu : ${location}`,
        `Annonce importante : ${isImportant ? 'oui' : 'non'}`,
        '',
        buildSummary(form),
      ].join('\n');

      await submitFeedback({
        contact: form.contact,
        message,
        photo: photo ?? undefined,
        title: buildTitle(form),
        type: 'info',
      });

      setForm(createEmptyForm());
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
          Choisis d’abord le type d’information, puis complète les champs adaptés.
        </Text>

        <View style={styles.categoryGrid}>
          {infoTypeConfigs.map((config) => {
            const isActive = form.category === config.category;

            return (
              <Pressable
                key={config.category}
                onPress={() => selectCategory(config.category)}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
              >
                <Ionicons
                  color={isActive ? colors.textInverse : colors.primaryDark}
                  name={config.icon}
                  size={17}
                />
                <Text
                  style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}
                >
                  {config.category}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.typeSummary}>
          <Ionicons color={colors.secondary} name={currentConfig.icon} size={20} />
          <Text style={styles.typeSummaryText}>{currentConfig.description}</Text>
        </View>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={(contact) => setForm((current) => ({ ...current, contact }))}
          placeholder="Ton adresse mail"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={form.contact}
        />

        {currentConfig.fields.map((field) => (
          <View key={field.id} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required ? <Text style={styles.requiredMark}> *</Text> : null}
            </Text>
            <TextInput
              multiline={field.multiline}
              onChangeText={(value) => updateField(field.id, value)}
              placeholder={field.placeholder}
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.fieldInput, field.multiline && styles.textArea]}
              value={form.fields[field.id]}
            />
          </View>
        ))}

        {currentConfig.forceImportant ? (
          <View style={styles.importantRow}>
            <View style={styles.importantCopy}>
              <Text style={styles.importantTitle}>Annonce importante</Text>
              <Text style={styles.importantDescription}>
                Les prières mortuaires sont signalées comme importantes.
              </Text>
            </View>
            <Ionicons color={colors.accent} name="alert-circle" size={24} />
          </View>
        ) : (
          <View style={styles.importantRow}>
            <View style={styles.importantCopy}>
              <Text style={styles.importantTitle}>Annonce importante</Text>
              <Text style={styles.importantDescription}>À réserver aux urgences réelles.</Text>
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
        )}

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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryChip: {
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
  typeSummary: {
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  typeSummaryText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
  fieldBlock: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  requiredMark: {
    color: colors.danger,
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
  fieldInput: {
    marginTop: spacing.xs,
  },
  textArea: {
    minHeight: 132,
    textAlignVertical: 'top',
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
  importantCopy: {
    flex: 1,
    paddingRight: spacing.md,
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
    lineHeight: 17,
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
