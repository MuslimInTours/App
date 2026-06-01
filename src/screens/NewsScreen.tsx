import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnnouncementCard } from '../components/AnnouncementCard';
import { Screen } from '../components/Screen';
import { AnnouncementCategory } from '../data/announcements';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { formatUpdateTime } from '../utils/date';

const filters: Array<AnnouncementCategory | 'Tout'> = [
  'Tout',
  'Mosquée',
  'Cours',
  'Solidarité',
  'Famille',
  'Prières mortuaires',
];

type NewsScreenProps = {
  onOpenSubmitInfo: () => void;
};

export function NewsScreen({ onOpenSubmitInfo }: NewsScreenProps) {
  useStyles();

  const [activeFilter, setActiveFilter] = useState<AnnouncementCategory | 'Tout'>('Tout');
  const { announcements, cachedAt, error, isLoading, source, updatedAt } = useAnnouncements();

  const filteredAnnouncements = useMemo(
    () =>
      activeFilter === 'Tout'
        ? announcements
        : announcements.filter((announcement) => announcement.category === activeFilter),
    [activeFilter, announcements],
  );

  return (
    <Screen
      title="Infos locales"
      subtitle="Un fil clair pour retrouver les annonces importantes sans remonter tout WhatsApp."
    >
      <Pressable accessibilityRole="button" onPress={onOpenSubmitInfo} style={styles.submitCard}>
        <View style={styles.submitIcon}>
          <Ionicons color={colors.textInverse} name="send" size={22} />
        </View>
        <View style={styles.submitCopy}>
          <Text style={styles.submitTitle}>Proposer une info</Text>
          <Text style={styles.submitDescription}>
            Transmettre une annonce locale à relire avant publication.
          </Text>
        </View>
        <Ionicons color={colors.secondary} name="chevron-forward" size={20} />
      </Pressable>

      <View style={styles.filters}>
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filter, isActive && styles.filterActive]}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Chargement des infos locales...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Impossible de rafraîchir les infos. Dernières données affichées.</Text>
        </View>
      ) : null}

      {filteredAnnouncements.map((announcement) => (
        <AnnouncementCard announcement={announcement} key={announcement.id} />
      ))}
      <Text style={styles.sourceNote}>
        Source actuelle :{' '}
        {source === 'remote'
          ? 'backend'
          : source === 'cache'
            ? `cache local du ${new Date(cachedAt ?? '').toLocaleDateString('fr-FR')}`
            : 'données locales provisoires'}
        . Dernière mise à jour : {formatUpdateTime(updatedAt)}.
      </Text>
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  submitCard: {
    alignItems: 'center',
    backgroundColor: colors.cardDefault,
    borderColor: colors.chromeBorderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  submitIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  submitCopy: {
    flex: 1,
  },
  submitTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  submitDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  filterTextActive: {
    color: colors.textInverse,
  },
  sourceNote: {
    color: colors.mutedInverse,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: colors.cardDefault,
    borderColor: colors.chromeBorderSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  statusText: {
    color: colors.text,
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
