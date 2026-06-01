import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnnouncementCard } from '../components/AnnouncementCard';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useSelectedMosque } from '../hooks/useSelectedMosque';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing } from '../theme/spacing';
import { TabKey } from '../components/TabBar';
import { getNextPrayer, getPrayerCountdown } from '../utils/prayer';

type HomeScreenProps = {
  onNavigate: (tab: TabKey) => void;
};

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  useStyles();

  const [now, setNow] = useState(() => new Date());
  const { announcements } = useAnnouncements();
  const { selectedMosque } = useSelectedMosque();
  const { error, isLoading, mosqueName, prayers, source } = usePrayerTimes(selectedMosque);
  const nextPrayer = getNextPrayer(prayers, now);
  const nextPrayerCountdown = getPrayerCountdown(nextPrayer, now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Screen
      title="Muslim'in"
      subtitle="Les annonces, horaires et services utiles pour la communauté locale."
    >
      <Card style={styles.prayerCard}>
        <View style={styles.heroTop}>
          <Text style={styles.primaryLabel}>Prochaine prière</Text>
          <View style={styles.livePill}>
            <Text style={styles.liveText}>
              {isLoading ? 'Chargement' : source === 'mawaqit' ? 'Mawaqit' : source === 'aladhan' ? 'Calcul' : 'Local'}
            </Text>
          </View>
        </View>
        <View style={styles.prayerRow}>
          <View>
            <Text style={styles.prayerName}>{nextPrayer.name}</Text>
            <Text style={styles.prayerTime}>{nextPrayer.time}</Text>
          </View>
          <View style={styles.countdownBlock}>
            <Text style={styles.countdown}>{nextPrayerCountdown}</Text>
            <Text style={styles.countdownLabel}>restant</Text>
          </View>
        </View>
        {error ? (
          <Text style={styles.sourceNote}>
            Source distante indisponible, horaires locaux utilisés.
          </Text>
        ) : mosqueName ? (
          <Text style={styles.sourceNote}>{mosqueName}</Text>
        ) : null}
      </Card>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => onNavigate('prayer')} style={styles.quickPressable}>
          <Card style={styles.quickCard} tone="accent">
            <View style={styles.quickIcon}>
              <Ionicons color={colors.secondary} name="navigate" size={36} />
            </View>
            <Text style={styles.quickTitle}>Qiblah</Text>
            <Text style={styles.quickText}>Boussole en direct.</Text>
          </Card>
        </Pressable>
        <Pressable onPress={() => onNavigate('quran')} style={styles.quickPressable}>
          <Card style={styles.quickCard} tone="muted">
            <View style={styles.quickIcon}>
              <Ionicons color={colors.primary} name="book" size={36} />
            </View>
            <Text style={styles.quickTitle}>Quran</Text>
            <Text style={styles.quickText}>Ouvrir les sourates.</Text>
          </Card>
        </Pressable>
      </View>

      <SectionHeader title="À la une" action="Voir tout" onAction={() => onNavigate('news')} />
      {announcements.slice(0, 2).map((announcement) => (
        <AnnouncementCard announcement={announcement} key={announcement.id} />
      ))}
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  prayerCard: {
    backgroundColor: colors.panelStrong,
    borderColor: colors.chromeBorder,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  primaryLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  livePill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  liveText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  prayerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  prayerName: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  prayerTime: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  countdownBlock: {
    alignItems: 'flex-end',
  },
  countdown: {
    color: colors.text,
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 35,
  },
  countdownLabel: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  sourceNote: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  quickPressable: {
    flex: 1,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: colors.chromeBorderSoft,
    justifyContent: 'center',
    minHeight: 156,
    paddingHorizontal: spacing.md,
  },
  quickTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  quickIcon: {
    alignItems: 'center',
    backgroundColor: colors.chrome,
    borderRadius: 999,
    height: 70,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 70,
  },
  quickText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
