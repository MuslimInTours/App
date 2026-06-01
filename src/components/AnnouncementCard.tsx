import { StyleSheet, Text, View } from 'react-native';

import { Announcement } from '../data/announcements';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';
import { Card } from './Card';

type AnnouncementCardProps = {
  announcement: Announcement;
};

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  useStyles();

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.categoryPill}>
          <Text style={styles.category}>{announcement.category}</Text>
        </View>
        {announcement.isImportant ? <Text style={styles.badge}>Important</Text> : null}
      </View>
      <Text style={styles.title}>{announcement.title}</Text>
      <Text style={styles.meta}>
        {announcement.date} - {announcement.location}
      </Text>
      <Text style={styles.summary}>{announcement.summary}</Text>
    </Card>
  );
}

const createStyles = () => StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  category: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.pill,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 24,
  },
  meta: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summary: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
