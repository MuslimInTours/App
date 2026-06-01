import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { AnnouncementCategory } from '../data/announcements';
import {
  AdminAnnouncement,
  AdminInfoSubmission,
  AdminMosque,
  createAnnouncement,
  createJanazaAnnouncement,
  deleteAnnouncement,
  deleteMosque,
  fetchAdminAnnouncements,
  fetchAdminInfoSubmissions,
  fetchAdminMosques,
  getCurrentAdminUser,
  infoSubmissionToAnnouncementInput,
  signInAdmin,
  signOutAdmin,
  sendAnnouncementPush,
  updateAnnouncement,
  updateInfoSubmissionStatus,
  upsertMosque,
} from '../services/adminService';
import { loadRememberAdmin, saveRememberAdmin } from '../services/adminPreferences';
import { isSupabaseConfigured } from '../services/supabaseClient';
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
  date: '',
  isImportant: false,
  location: '',
  summary: '',
  title: '',
};

const emptyJanazaForm = {
  date: '',
  deceasedName: '',
  location: '',
  notes: '',
  prayerTime: '',
};

const emptyMosqueForm = {
  address: '',
  city: 'Tours',
  id: '',
  isVisible: true,
  latitude: '',
  longitude: '',
  mawaqitId: '',
  mawaqitUrl: '',
  name: '',
};

type AdminSection = 'announcements' | 'janaza' | 'mosques' | 'submissions';

const adminSections: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  id: AdminSection;
  label: string;
}> = [
  { icon: 'mail-unread', id: 'submissions', label: 'Propositions' },
  { icon: 'megaphone', id: 'announcements', label: 'Annonces' },
  { icon: 'moon', id: 'janaza', label: 'Janaza' },
  { icon: 'business', id: 'mosques', label: 'Mosquées' },
];

const submissionStatusLabels = {
  archived: 'Refusée',
  new: 'À traiter',
  reviewed: 'Acceptée',
};

type AdminScreenProps = {
  onBack: () => void;
};

export function AdminScreen({ onBack }: AdminScreenProps) {
  useStyles();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [janazaForm, setJanazaForm] = useState(emptyJanazaForm);
  const [mosqueForm, setMosqueForm] = useState(emptyMosqueForm);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [infoSubmissions, setInfoSubmissions] = useState<AdminInfoSubmission[]>([]);
  const [mosques, setMosques] = useState<AdminMosque[]>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingMosqueId, setEditingMosqueId] = useState<string | null>(null);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('announcements');
  const [rememberAdmin, setRememberAdmin] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    loadRememberAdmin()
      .then((remember) => {
        setRememberAdmin(remember);
        if (!remember) {
          return signOutAdmin().then(() => null);
        }

        return getCurrentAdminUser();
      })
      .then((user) => {
        setIsAuthenticated(Boolean(user));
        if (user) {
          loadAnnouncements();
          loadInfoSubmissions();
          loadMosques();
        }
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  const toggleRememberAdmin = (value: boolean) => {
    setRememberAdmin(value);
    saveRememberAdmin(value).catch(() => undefined);
  };

  const loadAnnouncements = async () => {
    try {
      const nextAnnouncements = await fetchAdminAnnouncements();
      setAnnouncements(nextAnnouncements);
    } catch {
      setMessage('Impossible de charger les annonces admin.');
    }
  };

  const loadInfoSubmissions = async () => {
    try {
      const nextSubmissions = await fetchAdminInfoSubmissions();
      setInfoSubmissions(nextSubmissions);
    } catch {
      setMessage('Impossible de charger les propositions.');
    }
  };

  const loadMosques = async () => {
    try {
      const nextMosques = await fetchAdminMosques();
      setMosques(nextMosques);
    } catch {
      setMessage('Impossible de charger les mosquées admin.');
    }
  };

  const login = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await signInAdmin(email.trim(), password);
      await saveRememberAdmin(rememberAdmin);
      setIsAuthenticated(true);
      setPassword('');
      setMessage('Connexion admin réussie.');
      await loadAnnouncements();
      await loadInfoSubmissions();
      await loadMosques();
    } catch {
      setMessage('Connexion impossible. Vérifie l’email, le mot de passe et Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOutAdmin();
    setIsAuthenticated(false);
    setAnnouncements([]);
    setInfoSubmissions([]);
    setMosques([]);
    setEditingAnnouncementId(null);
    setEditingMosqueId(null);
    setReviewingSubmissionId(null);
    setMessage('Session admin fermée.');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingAnnouncementId(null);
    setReviewingSubmissionId(null);
  };

  const resetMosqueForm = () => {
    setMosqueForm(emptyMosqueForm);
    setEditingMosqueId(null);
  };

  const startEditingAnnouncement = (announcement: AdminAnnouncement) => {
    setEditingAnnouncementId(announcement.id);
    setReviewingSubmissionId(null);
    setForm({
      category: announcement.category,
      date: announcement.date,
      isImportant: Boolean(announcement.isImportant),
      location: announcement.location,
      summary: announcement.summary,
      title: announcement.title,
    });
    setMessage('Annonce chargée dans le formulaire.');
  };

  const saveAnnouncement = async () => {
    if (!form.title.trim() || !form.date.trim() || !form.location.trim() || !form.summary.trim()) {
      setMessage('Remplis tous les champs avant de publier.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const submissionId = reviewingSubmissionId;
      const payload = {
        category: form.category,
        date: form.date.trim(),
        isImportant: form.isImportant,
        location: form.location.trim(),
        summary: form.summary.trim(),
        title: form.title.trim(),
      };

      if (editingAnnouncementId) {
        await updateAnnouncement(editingAnnouncementId, payload);
        setMessage('Annonce mise à jour.');
      } else {
        await createAnnouncement(payload);
        if (submissionId) {
          await updateInfoSubmissionStatus(submissionId, 'reviewed');
          setMessage('Proposition acceptée avec modifications et publiée.');
        } else {
          setMessage('Annonce publiée. Elle apparaîtra dans Infos locales.');
        }
      }

      resetForm();
      await loadAnnouncements();
      if (submissionId) {
        await loadInfoSubmissions();
      }
    } catch {
      setMessage('Enregistrement impossible. Vérifie les droits admin et la table Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublished = async (announcement: AdminAnnouncement) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateAnnouncement(announcement.id, {
        category: announcement.category,
        date: announcement.date,
        isImportant: Boolean(announcement.isImportant),
        location: announcement.location,
        published: !announcement.published,
        summary: announcement.summary,
        title: announcement.title,
      });
      await loadAnnouncements();
      setMessage(announcement.published ? 'Annonce masquée.' : 'Annonce republiée.');
    } catch {
      setMessage('Impossible de modifier la publication.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAnnouncement = async (announcementId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await deleteAnnouncement(announcementId);
      await loadAnnouncements();
      if (editingAnnouncementId === announcementId) {
        resetForm();
      }
      setMessage('Annonce supprimée.');
    } catch {
      setMessage('Suppression impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInfoSubmission = async (submission: AdminInfoSubmission) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await createAnnouncement(infoSubmissionToAnnouncementInput(submission));
      await updateInfoSubmissionStatus(submission.id, 'reviewed');
      await loadAnnouncements();
      await loadInfoSubmissions();
      setMessage('Proposition acceptée et publiée dans Infos locales.');
    } catch {
      setMessage('Impossible d’accepter cette proposition.');
    } finally {
      setIsLoading(false);
    }
  };

  const rejectInfoSubmission = async (submissionId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateInfoSubmissionStatus(submissionId, 'archived');
      await loadInfoSubmissions();
      if (reviewingSubmissionId === submissionId) {
        resetForm();
      }
      setMessage('Proposition refusée.');
    } catch {
      setMessage('Impossible de refuser cette proposition.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInfoSubmissionForEdit = (submission: AdminInfoSubmission) => {
    const proposal = infoSubmissionToAnnouncementInput(submission);
    setForm({ ...proposal, isImportant: Boolean(proposal.isImportant) });
    setEditingAnnouncementId(null);
    setReviewingSubmissionId(submission.id);
    setActiveSection('announcements');
    setMessage('Proposition chargée. Modifie puis publie pour l’accepter.');
  };

  const confirmAction = (title: string, description: string, onConfirm: () => void) => {
    Alert.alert(title, description, [
      { style: 'cancel', text: 'Annuler' },
      { onPress: onConfirm, style: 'destructive', text: 'Confirmer' },
    ]);
  };

  const publishJanaza = async () => {
    if (
      !janazaForm.date.trim() ||
      !janazaForm.location.trim() ||
      !janazaForm.notes.trim() ||
      !janazaForm.prayerTime.trim()
    ) {
      setMessage('Remplis la date, l’horaire, le lieu et les notes janaza.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await createJanazaAnnouncement({
        date: janazaForm.date,
        deceasedName: janazaForm.deceasedName,
        location: janazaForm.location,
        notes: janazaForm.notes,
        prayerTime: janazaForm.prayerTime,
      });
      setJanazaForm(emptyJanazaForm);
      await loadAnnouncements();
      setMessage('Prière mortuaire publiée dans Infos locales.');
    } catch {
      setMessage('Publication janaza impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingMosque = (mosque: AdminMosque) => {
    setEditingMosqueId(mosque.id);
    setMosqueForm({
      address: mosque.address,
      city: mosque.city,
      id: mosque.id,
      isVisible: mosque.isVisible,
      latitude: String(mosque.latitude),
      longitude: String(mosque.longitude),
      mawaqitId: mosque.mawaqitId ? String(mosque.mawaqitId) : '',
      mawaqitUrl: mosque.mawaqitUrl ?? '',
      name: mosque.name,
    });
    setMessage('Mosquée chargée dans le formulaire.');
  };

  const saveMosque = async () => {
    const latitude = Number(mosqueForm.latitude.replace(',', '.'));
    const longitude = Number(mosqueForm.longitude.replace(',', '.'));
    const mawaqitId = mosqueForm.mawaqitId.trim() ? Number(mosqueForm.mawaqitId) : undefined;

    if (
      !mosqueForm.id.trim() ||
      !mosqueForm.name.trim() ||
      !mosqueForm.city.trim() ||
      !mosqueForm.address.trim() ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      (mosqueForm.mawaqitId.trim() && !Number.isFinite(mawaqitId))
    ) {
      setMessage('Vérifie les champs de la mosquée et les coordonnées.');
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await upsertMosque({
        address: mosqueForm.address.trim(),
        city: mosqueForm.city.trim(),
        id: mosqueForm.id.trim(),
        isVisible: mosqueForm.isVisible,
        latitude,
        longitude,
        mawaqitId,
        mawaqitUrl: mosqueForm.mawaqitUrl.trim(),
        name: mosqueForm.name.trim(),
      });
      resetMosqueForm();
      await loadMosques();
      setMessage(editingMosqueId ? 'Mosquée mise à jour.' : 'Mosquée ajoutée.');
    } catch {
      setMessage('Enregistrement de la mosquée impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeMosque = async (mosqueId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await deleteMosque(mosqueId);
      await loadMosques();
      if (editingMosqueId === mosqueId) {
        resetMosqueForm();
      }
      setMessage('Mosquée supprimée.');
    } catch {
      setMessage('Suppression de la mosquée impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPush = async (announcementId: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await sendAnnouncementPush(announcementId);
      setMessage('Notification envoyée aux appareils enregistrés.');
    } catch {
      setMessage('Envoi push impossible. Vérifie la fonction Supabase send-push.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen
      headerIcon="shield-checkmark"
      title="Administration"
      subtitle="Publier les annonces locales et prières mortuaires depuis un accès privé."
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.textInverse} name="chevron-back" size={18} />
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>

      {!isSupabaseConfigured ? (
        <Card tone="accent">
          <Text style={styles.cardTitle}>Supabase à configurer</Text>
          <Text style={styles.cardText}>
            Ajoute `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` dans `.env`,
            puis relance Expo pour activer l’administration.
          </Text>
        </Card>
      ) : null}

      {isSupabaseConfigured && !isAuthenticated ? (
        <Card>
          <Text style={styles.cardTitle}>Connexion admin</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email admin"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <View style={styles.rememberRow}>
            <View style={styles.rememberCopy}>
              <Text style={styles.rememberTitle}>Rester connecté sur cet appareil</Text>
              <Text style={styles.rememberDescription}>
                Pratique sur ton téléphone personnel, à éviter sur un appareil partagé.
              </Text>
            </View>
            <Switch
              ios_backgroundColor={colors.borderStrong}
              onValueChange={toggleRememberAdmin}
              thumbColor={rememberAdmin ? colors.accent : colors.surface}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              value={rememberAdmin}
            />
          </View>
          <Pressable disabled={isLoading} onPress={login} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </Pressable>
        </Card>
      ) : null}

      {isSupabaseConfigured && isAuthenticated ? (
        <>
          <View style={styles.adminTabs}>
            {adminSections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <Pressable
                  key={section.id}
                  onPress={() => setActiveSection(section.id)}
                  style={[styles.adminTab, isActive && styles.adminTabActive]}
                >
                  <Ionicons
                    color={isActive ? colors.primaryDark : colors.mutedInverse}
                    name={section.icon}
                    size={19}
                  />
                  <Text style={[styles.adminTabText, isActive && styles.adminTabTextActive]}>
                    {section.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.adminStats}>
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatValue}>{announcements.length}</Text>
              <Text style={styles.adminStatLabel}>annonces</Text>
            </View>
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatValue}>{mosques.length}</Text>
              <Text style={styles.adminStatLabel}>mosquées</Text>
            </View>
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatValue}>
                {infoSubmissions.filter((submission) => submission.status === 'new').length}
              </Text>
              <Text style={styles.adminStatLabel}>à valider</Text>
            </View>
            <View style={styles.adminStatItem}>
              <Text style={styles.adminStatValue}>
                {announcements.filter((announcement) => !announcement.published).length}
              </Text>
              <Text style={styles.adminStatLabel}>masquées</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingBanner}>
              <Ionicons color={colors.secondary} name="sync" size={17} />
              <Text style={styles.loadingText}>Action en cours...</Text>
            </View>
          ) : null}

          {activeSection === 'submissions' ? (
            <Card>
              <View style={styles.adminHeader}>
                <View>
                  <Text style={styles.cardTitle}>Propositions reçues</Text>
                  <Text style={styles.cardText}>
                    Accepter, refuser ou modifier avant publication dans Infos locales.
                  </Text>
                </View>
                <Pressable disabled={isLoading} onPress={loadInfoSubmissions} style={styles.logoutButton}>
                  <Ionicons color={colors.secondary} name="refresh" size={20} />
                </Pressable>
              </View>

              <View style={styles.announcementList}>
                {infoSubmissions.length === 0 ? (
                  <Text style={styles.emptyText}>Aucune proposition pour le moment.</Text>
                ) : null}

                {infoSubmissions.map((submission) => {
                  const proposal = infoSubmissionToAnnouncementInput(submission);
                  const isPending = submission.status === 'new';

                  return (
                    <View key={submission.id} style={styles.submissionItem}>
                      <View style={styles.announcementTitleRow}>
                        <Text style={styles.announcementTitle}>{proposal.title}</Text>
                        <Text
                          style={[
                            styles.draftBadge,
                            submission.status === 'archived' && styles.rejectedBadge,
                          ]}
                        >
                          {submissionStatusLabels[submission.status]}
                        </Text>
                      </View>
                      <Text style={styles.announcementMeta}>
                        {proposal.category} · {proposal.date} · {proposal.location}
                      </Text>
                      <Text style={styles.submissionContact}>{submission.contact}</Text>
                      <Text style={styles.announcementSummary}>{proposal.summary}</Text>

                      {isPending ? (
                        <View style={styles.submissionActions}>
                          <Pressable
                            disabled={isLoading}
                            onPress={() => acceptInfoSubmission(submission)}
                            style={[styles.submissionActionButton, styles.acceptButton]}
                          >
                            <Ionicons color={colors.textInverse} name="checkmark" size={18} />
                            <Text style={styles.submissionActionText}>Accepter</Text>
                          </Pressable>
                          <Pressable
                            disabled={isLoading}
                            onPress={() => loadInfoSubmissionForEdit(submission)}
                            style={styles.submissionActionButton}
                          >
                            <Ionicons color={colors.secondary} name="create-outline" size={18} />
                            <Text style={styles.submissionActionTextDark}>Modifier puis accepter</Text>
                          </Pressable>
                          <Pressable
                            disabled={isLoading}
                            onPress={() =>
                              confirmAction(
                                'Refuser cette proposition ?',
                                'Elle restera archivée dans les propositions.',
                                () => rejectInfoSubmission(submission.id),
                              )
                            }
                            style={[styles.submissionActionButton, styles.rejectButton]}
                          >
                            <Ionicons color={colors.danger} name="close" size={18} />
                            <Text style={styles.rejectActionText}>Refuser</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </Card>
          ) : null}

          {activeSection === 'announcements' ? (
            <>
          <Card>
            <View style={styles.adminHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  {editingAnnouncementId
                    ? 'Modifier l’annonce'
                    : reviewingSubmissionId
                      ? 'Accepter avec modifications'
                      : 'Nouvelle annonce'}
                </Text>
                <Text style={styles.cardText}>
                  {editingAnnouncementId
                    ? 'Les changements seront visibles après enregistrement.'
                    : reviewingSubmissionId
                      ? 'Ajuste la proposition puis publie-la dans Infos locales.'
                      : 'Publier dans le fil Infos locales.'}
                </Text>
              </View>
              <Pressable onPress={logout} style={styles.logoutButton}>
                <Ionicons color={colors.secondary} name="log-out-outline" size={20} />
              </Pressable>
            </View>

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
              placeholder="Description"
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
                      style={[
                        styles.categoryChipText,
                        isActive && styles.categoryChipTextActive,
                      ]}
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
                <Text style={styles.importantDescription}>À utiliser pour janaza et urgences.</Text>
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

            <Pressable
              disabled={isLoading}
              onPress={saveAnnouncement}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading
                  ? 'Enregistrement...'
                  : editingAnnouncementId
                    ? 'Mettre à jour'
                    : reviewingSubmissionId
                      ? 'Publier et accepter'
                      : 'Publier'}
              </Text>
            </Pressable>

            {editingAnnouncementId || reviewingSubmissionId ? (
              <Pressable onPress={resetForm} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>
                  {reviewingSubmissionId ? 'Annuler la proposition' : 'Annuler la modification'}
                </Text>
              </Pressable>
            ) : null}
          </Card>

          <Card>
            <View style={styles.adminHeader}>
              <View>
                <Text style={styles.cardTitle}>Annonces publiées</Text>
                <Text style={styles.cardText}>
                  Modifier, masquer ou supprimer les informations locales.
                </Text>
              </View>
              <Pressable disabled={isLoading} onPress={loadAnnouncements} style={styles.logoutButton}>
                <Ionicons color={colors.secondary} name="refresh" size={20} />
              </Pressable>
            </View>

            <View style={styles.announcementList}>
              {announcements.length === 0 ? (
                <Text style={styles.emptyText}>Aucune annonce Supabase pour le moment.</Text>
              ) : null}

              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementItem}>
                  <Pressable
                    onPress={() => startEditingAnnouncement(announcement)}
                    style={styles.announcementText}
                  >
                    <View style={styles.announcementTitleRow}>
                      <Text style={styles.announcementTitle}>{announcement.title}</Text>
                      {!announcement.published ? (
                        <Text style={styles.draftBadge}>Masquée</Text>
                      ) : null}
                    </View>
                    <Text style={styles.announcementMeta}>
                      {announcement.category} · {announcement.date} · {announcement.location}
                    </Text>
                    <Text numberOfLines={2} style={styles.announcementSummary}>
                      {announcement.summary}
                    </Text>
                  </Pressable>

                  <View style={styles.announcementActions}>
                    <Pressable
                      disabled={isLoading}
                      onPress={() => sendPush(announcement.id)}
                      style={styles.actionButton}
                    >
                      <Ionicons color={colors.secondary} name="notifications-outline" size={19} />
                    </Pressable>
                    <Pressable
                      disabled={isLoading}
                      onPress={() => togglePublished(announcement)}
                      style={styles.actionButton}
                    >
                      <Ionicons
                        color={colors.primaryDark}
                        name={announcement.published ? 'eye-off-outline' : 'eye-outline'}
                        size={19}
                      />
                    </Pressable>
                    <Pressable
                      disabled={isLoading}
                      onPress={() =>
                        confirmAction(
                          'Supprimer cette annonce ?',
                          'Cette action retirera définitivement l’annonce de Supabase.',
                          () => removeAnnouncement(announcement.id),
                        )
                      }
                      style={[styles.actionButton, styles.deleteButton]}
                    >
                      <Ionicons color={colors.danger} name="trash-outline" size={19} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </Card>
            </>
          ) : null}

          {activeSection === 'janaza' ? (
            <Card>
              <View style={styles.adminHeader}>
                <View>
                  <Text style={styles.cardTitle}>Prière mortuaire</Text>
                  <Text style={styles.cardText}>
                    Formulaire rapide pour publier une annonce janaza importante.
                  </Text>
                </View>
                <View style={styles.janazaIcon}>
                  <Ionicons color={colors.textInverse} name="moon" size={20} />
                </View>
              </View>

              <TextInput
                onChangeText={(deceasedName) =>
                  setJanazaForm((current) => ({ ...current, deceasedName }))
                }
                placeholder="Nom du défunt ou de la défunte (optionnel)"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={janazaForm.deceasedName}
              />
              <TextInput
                onChangeText={(date) => setJanazaForm((current) => ({ ...current, date }))}
                placeholder="Date"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={janazaForm.date}
              />
              <TextInput
                onChangeText={(prayerTime) =>
                  setJanazaForm((current) => ({ ...current, prayerTime }))
                }
                placeholder="Horaire de la prière"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={janazaForm.prayerTime}
              />
              <TextInput
                onChangeText={(location) => setJanazaForm((current) => ({ ...current, location }))}
                placeholder="Lieu"
                placeholderTextColor={colors.muted}
                style={styles.input}
                value={janazaForm.location}
              />
              <TextInput
                multiline
                onChangeText={(notes) => setJanazaForm((current) => ({ ...current, notes }))}
                placeholder="Informations utiles"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.textArea]}
                value={janazaForm.notes}
              />

              <Pressable disabled={isLoading} onPress={publishJanaza} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Publication...' : 'Publier la prière mortuaire'}
                </Text>
              </Pressable>
            </Card>
          ) : null}

          {activeSection === 'mosques' ? (
          <Card>
            <View style={styles.adminHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  {editingMosqueId ? 'Modifier une mosquée' : 'Ajouter une mosquée'}
                </Text>
                <Text style={styles.cardText}>
                  Avec une URL Mawaqit, elle apparaîtra dans le carrousel des horaires.
                </Text>
              </View>
              <Pressable disabled={isLoading} onPress={loadMosques} style={styles.logoutButton}>
                <Ionicons color={colors.secondary} name="refresh" size={20} />
              </Pressable>
            </View>

            <TextInput
              autoCapitalize="none"
              onChangeText={(id) => setMosqueForm((current) => ({ ...current, id }))}
              placeholder="ID stable, ex: mosquee-bouzignac"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.id}
            />
            <TextInput
              onChangeText={(name) => setMosqueForm((current) => ({ ...current, name }))}
              placeholder="Nom"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.name}
            />
            <TextInput
              onChangeText={(city) => setMosqueForm((current) => ({ ...current, city }))}
              placeholder="Ville ou secteur"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.city}
            />
            <TextInput
              onChangeText={(address) => setMosqueForm((current) => ({ ...current, address }))}
              placeholder="Adresse"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.address}
            />
            <View style={styles.inputRow}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={(latitude) => setMosqueForm((current) => ({ ...current, latitude }))}
                placeholder="Latitude"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.inputHalf]}
                value={mosqueForm.latitude}
              />
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={(longitude) =>
                  setMosqueForm((current) => ({ ...current, longitude }))
                }
                placeholder="Longitude"
                placeholderTextColor={colors.muted}
                style={[styles.input, styles.inputHalf]}
                value={mosqueForm.longitude}
              />
            </View>
            <TextInput
              keyboardType="number-pad"
              onChangeText={(mawaqitId) => setMosqueForm((current) => ({ ...current, mawaqitId }))}
              placeholder="ID Mawaqit (optionnel)"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.mawaqitId}
            />
            <TextInput
              autoCapitalize="none"
              onChangeText={(mawaqitUrl) =>
                setMosqueForm((current) => ({ ...current, mawaqitUrl }))
              }
              placeholder="URL Mawaqit (optionnel)"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={mosqueForm.mawaqitUrl}
            />

            <View style={styles.importantRow}>
              <View>
                <Text style={styles.importantTitle}>Visible dans l’application</Text>
                <Text style={styles.importantDescription}>Désactive pour masquer sans supprimer.</Text>
              </View>
              <Switch
                ios_backgroundColor={colors.borderStrong}
                onValueChange={() =>
                  setMosqueForm((current) => ({ ...current, isVisible: !current.isVisible }))
                }
                thumbColor={mosqueForm.isVisible ? colors.accent : colors.surface}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                value={mosqueForm.isVisible}
              />
            </View>

            <Pressable disabled={isLoading} onPress={saveMosque} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Enregistrement...' : editingMosqueId ? 'Mettre à jour' : 'Ajouter'}
              </Text>
            </Pressable>

            {editingMosqueId ? (
              <Pressable onPress={resetMosqueForm} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Annuler la modification</Text>
              </Pressable>
            ) : null}

            <View style={styles.announcementList}>
              {mosques.length === 0 ? (
                <Text style={styles.emptyText}>Aucune mosquée Supabase pour le moment.</Text>
              ) : null}

              {mosques.map((mosque) => (
                <View key={mosque.id} style={styles.announcementItem}>
                  <Pressable onPress={() => startEditingMosque(mosque)} style={styles.announcementText}>
                    <View style={styles.announcementTitleRow}>
                      <Text style={styles.announcementTitle}>{mosque.name}</Text>
                      {!mosque.isVisible ? <Text style={styles.draftBadge}>Masquée</Text> : null}
                    </View>
                    <Text style={styles.announcementMeta}>
                      {mosque.city} · {mosque.mawaqitUrl ? 'Mawaqit relié' : 'Annuaire'}
                    </Text>
                    <Text numberOfLines={2} style={styles.announcementSummary}>
                      {mosque.address}
                    </Text>
                  </Pressable>
                  <Pressable
                    disabled={isLoading}
                    onPress={() =>
                      confirmAction(
                        'Supprimer cette mosquée ?',
                        'Elle disparaîtra des horaires et de la liste des lieux.',
                        () => removeMosque(mosque.id),
                      )
                    }
                    style={[styles.actionButton, styles.deleteButton]}
                  >
                    <Ionicons color={colors.danger} name="trash-outline" size={19} />
                  </Pressable>
                </View>
              ))}
            </View>
          </Card>
          ) : null}
        </>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  adminHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  adminTabs: {
    backgroundColor: colors.chromeSoft,
    borderColor: colors.chromeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  adminTab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    flexBasis: '48%',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
  },
  adminTabActive: {
    backgroundColor: colors.accentSoft,
  },
  adminTabText: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '900',
  },
  adminTabTextActive: {
    color: colors.primaryDark,
  },
  adminStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  adminStatItem: {
    alignItems: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.chromeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  adminStatValue: {
    color: colors.textInverse,
    fontSize: 21,
    fontWeight: '900',
  },
  adminStatLabel: {
    color: colors.mutedInverse,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
  },
  loadingBanner: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.panelStrong,
    borderColor: colors.chromeBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  loadingText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
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
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputHalf: {
    flex: 1,
  },
  textArea: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.accentSoft,
    fontSize: 14,
    fontWeight: '900',
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  janazaIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
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
    fontSize: 13,
    fontWeight: '900',
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  importantRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rememberRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  rememberCopy: {
    flex: 1,
  },
  rememberTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  rememberDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
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
    marginTop: 2,
  },
  message: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
    textAlign: 'center',
  },
  announcementList: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  announcementItem: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  announcementText: {
    flex: 1,
  },
  announcementTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  announcementTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  draftBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  rejectedBadge: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
  },
  announcementMeta: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  announcementSummary: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  announcementActions: {
    gap: spacing.xs,
  },
  submissionItem: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  submissionContact: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  submissionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  submissionActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rejectButton: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  submissionActionText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '900',
  },
  submissionActionTextDark: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
  },
  rejectActionText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  deleteButton: {
    backgroundColor: colors.dangerSoft,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
