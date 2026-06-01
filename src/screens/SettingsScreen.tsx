import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { registerForPushNotifications, clearPrayerReminders } from '../services/notificationService';
import { loadStoredSettings, saveStoredSettings } from '../services/settingsStorage';
import { colors } from '../theme/colors';
import { ThemeMode, useThemeSettings, useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type SettingGroup = 'data' | 'display' | 'notifications' | 'privacy';

type SettingItem = {
  description: string;
  enabled: boolean;
  group: SettingGroup;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  title: string;
};

const settingGroups: Array<{ id: SettingGroup; title: string }> = [
  { id: 'notifications', title: 'Notifications' },
  { id: 'data', title: 'Quran et données' },
  { id: 'display', title: 'Affichage' },
  { id: 'privacy', title: 'Confidentialité' },
];

const themeOptions: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  id: ThemeMode;
  label: string;
}> = [
  { icon: 'moon', id: 'night', label: 'Nuit' },
  { icon: 'sunny', id: 'day', label: 'Jour' },
  { icon: 'contrast', id: 'auto', label: 'Auto' },
];

const notificationSettingIds = new Set([
  'notifications',
  'importantAnnouncements',
  'janazaAlerts',
  'adhan',
]);

const initialSettings: SettingItem[] = [
  {
    id: 'notifications',
    title: 'Notifications locales',
    description: 'Recevoir les rappels importants et les annonces prioritaires.',
    icon: 'notifications-outline' as const,
    enabled: true,
    group: 'notifications',
  },
  {
    id: 'importantAnnouncements',
    title: 'Infos importantes',
    description: 'Être alerté pour les annonces urgentes publiées par l’équipe.',
    icon: 'megaphone-outline' as const,
    enabled: true,
    group: 'notifications',
  },
  {
    id: 'janazaAlerts',
    title: 'Prières mortuaires',
    description: 'Recevoir les annonces janaza dès leur publication.',
    icon: 'moon-outline' as const,
    enabled: true,
    group: 'notifications',
  },
  {
    id: 'adhan',
    title: 'Rappel des prières',
    description: 'Préparer les alertes pour les horaires de prière.',
    icon: 'alarm-outline' as const,
    enabled: false,
    group: 'notifications',
  },
  {
    id: 'quranAutoContinue',
    title: 'Lecture audio continue',
    description: 'Enchaîner automatiquement les sourates pendant l’écoute.',
    icon: 'play-skip-forward-outline' as const,
    enabled: true,
    group: 'data',
  },
  {
    id: 'wifiDownloads',
    title: 'Téléchargements en Wi-Fi',
    description: 'Limiter les téléchargements audio du Quran aux réseaux Wi-Fi.',
    icon: 'cloud-download-outline' as const,
    enabled: true,
    group: 'data',
  },
  {
    id: 'mawaqitRefresh',
    title: 'Actualisation Mawaqit',
    description: 'Rafraîchir les horaires quand l’application s’ouvre.',
    icon: 'sync-outline' as const,
    enabled: true,
    group: 'data',
  },
  {
    id: 'location',
    title: 'Position pour la qiblah',
    description: 'Autoriser la position uniquement pour améliorer la direction.',
    icon: 'navigate-outline' as const,
    enabled: true,
    group: 'privacy',
  },
  {
    id: 'analyticsConsent',
    title: 'Aide au diagnostic',
    description: 'Autoriser uniquement les données techniques anonymes en cas d’erreur.',
    icon: 'shield-checkmark-outline' as const,
    enabled: false,
    group: 'privacy',
  },
  {
    id: 'compactMode',
    title: 'Listes compactes',
    description: 'Afficher plus d’informations à l’écran dans les listes longues.',
    icon: 'reorder-three-outline' as const,
    enabled: false,
    group: 'display',
  },
  {
    id: 'largeText',
    title: 'Texte renforcé',
    description: 'Privilégier des libellés plus grands pour les horaires et les cartes.',
    icon: 'text-outline' as const,
    enabled: false,
    group: 'display',
  },
];

type SettingsScreenProps = {
  onOpenAdmin: () => void;
};

export function SettingsScreen({ onOpenAdmin }: SettingsScreenProps) {
  useStyles();

  const { mode: themeMode, resolvedTheme, setMode: setThemeMode } = useThemeSettings();
  const [settings, setSettings] = useState(initialSettings);
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const settingsSnapshot = useMemo(
    () =>
      settings.reduce<Record<string, boolean>>((snapshot, setting) => {
        snapshot[setting.id] = setting.enabled;
        return snapshot;
      }, {}),
    [settings],
  );

  useEffect(() => {
    let isMounted = true;

    loadStoredSettings()
      .then((storedSettings) => {
        if (isMounted) {
          setSettings((currentSettings) =>
            currentSettings.map((setting) => ({
              ...setting,
              enabled: storedSettings[setting.id] ?? setting.enabled,
            })),
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setHasLoadedSettings(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (hasLoadedSettings) {
      saveStoredSettings(settingsSnapshot);
    }
  }, [hasLoadedSettings, settingsSnapshot]);

  const toggleSetting = async (id: string) => {
    const currentSetting = settings.find((setting) => setting.id === id);
    const willEnable = !currentSetting?.enabled;

    if (notificationSettingIds.has(id) && willEnable) {
      const result = await registerForPushNotifications();
      setNotificationMessage(result.message);

      if (result.status === 'denied') {
        setSettings((currentSettings) =>
          currentSettings.map((setting) =>
            setting.id === id ? { ...setting, enabled: false } : setting,
          ),
        );
        return;
      }
    }

    setSettings((currentSettings) =>
      currentSettings.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting,
      ),
    );
  };

  const clearScheduledReminders = async () => {
    await clearPrayerReminders();
    setNotificationMessage('Les rappels de prière programmés ont été effacés sur cet appareil.');
  };

  return (
    <Screen
      title="Paramètres"
      subtitle="Réglages de base pour personnaliser l’expérience de l’application."
    >
      <Card tone="accent">
        <Text style={styles.cardTitle}>Préférences</Text>
        <Text style={styles.cardText}>
          Active les notifications, les rappels et les réglages utiles pour personnaliser
          l’expérience de l’application.
        </Text>
      </Card>

      <View style={styles.themeCard}>
        <View style={styles.themeHeader}>
          <View style={styles.iconWrap}>
            <Ionicons
              color={colors.primaryDark}
              name={resolvedTheme === 'day' ? 'sunny' : 'moon'}
              size={22}
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>Apparence</Text>
            <Text style={styles.description}>
              {themeMode === 'auto'
                ? `Auto active le mode ${resolvedTheme === 'day' ? 'jour' : 'nuit'} selon l’heure locale.`
                : 'Le thème actuel de l’application correspond au mode nuit.'}
            </Text>
          </View>
        </View>
        <View style={styles.themeSelector}>
          {themeOptions.map((option) => {
            const isActive = themeMode === option.id;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                key={option.id}
                onPress={() => setThemeMode(option.id)}
                style={[styles.themeOption, isActive && styles.themeOptionActive]}
              >
                <Ionicons
                  color={isActive ? colors.textInverse : colors.secondary}
                  name={option.icon}
                  size={18}
                />
                <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.list}>
        {settingGroups.map((group) => {
          const groupSettings = settings.filter((setting) => setting.group === group.id);

          return (
            <View key={group.id} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {groupSettings.map((setting) => (
                <View key={setting.id} style={styles.row}>
                  <View style={styles.iconWrap}>
                    <Ionicons color={colors.primaryDark} name={setting.icon} size={22} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.title}>{setting.title}</Text>
                    <Text style={styles.description}>{setting.description}</Text>
                  </View>
                  <Switch
                    ios_backgroundColor={colors.borderStrong}
                    onValueChange={() => toggleSetting(setting.id)}
                    thumbColor={setting.enabled ? colors.accent : colors.surface}
                    trackColor={{ false: colors.borderStrong, true: colors.primary }}
                    value={setting.enabled}
                  />
                </View>
              ))}
            </View>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={clearScheduledReminders} style={styles.actionCard}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.primaryDark} name="trash-outline" size={22} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Effacer les rappels programmés</Text>
          <Text style={styles.description}>
            Supprime les alertes de prière déjà programmées sur cet appareil.
          </Text>
        </View>
        <Ionicons color={colors.muted} name="chevron-forward" size={18} />
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onOpenAdmin} style={styles.adminCard}>
        <Ionicons color={colors.muted} name="shield-checkmark-outline" size={18} />
        <Text style={styles.adminTitle}>Espace administrateur</Text>
        <Ionicons color={colors.muted} name="chevron-forward" size={18} />
      </Pressable>

      {notificationMessage ? (
        <View style={styles.statusCard}>
          <Ionicons color={colors.secondary} name="notifications" size={20} />
          <Text style={styles.statusText}>{notificationMessage}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  themeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  themeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  themeSelector: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 4,
  },
  themeOption: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 42,
  },
  themeOptionActive: {
    backgroundColor: colors.primary,
  },
  themeOptionText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  themeOptionTextActive: {
    color: colors.textInverse,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  adminCard: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.chromeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  adminTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: colors.cardDefault,
    borderColor: colors.chromeBorderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  statusText: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 19,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
