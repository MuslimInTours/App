import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { SectionHeader } from '../components/SectionHeader';
import { communityPlaces } from '../data/community';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type CommunityScreenProps = {
  onBack: () => void;
};

export function CommunityScreen({ onBack }: CommunityScreenProps) {
  useStyles();

  return (
    <Screen
      title="Annuaire local"
      subtitle="Mosquées, associations et adresses utiles autour de Tours."
    >
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons color={colors.textInverse} name="chevron-back" size={18} />
        <Text style={styles.backButtonText}>Retour</Text>
      </Pressable>

      <Card tone="accent">
        <Text style={styles.cardTitle}>Adresses utiles</Text>
        <Text style={styles.cardText}>
          Une première liste pour retrouver rapidement les lieux et services autour de Tours.
        </Text>
      </Card>

      <SectionHeader title="Lieux et services" />
      {communityPlaces.map((place) => (
        <View key={place.id} style={styles.placeRow}>
          <View style={styles.placeHeader}>
            <View style={styles.typeRow}>
              <Ionicons color={colors.secondary} name="location" size={16} />
              <Text style={styles.type}>{place.type}</Text>
            </View>
            <Text style={styles.area}>{place.area}</Text>
          </View>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.details}>{place.details}</Text>
        </View>
      ))}
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
    fontSize: 17,
    fontWeight: '900',
  },
  cardText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  placeRow: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  typeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  placeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  type: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },
  area: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  details: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
