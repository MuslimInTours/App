import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '../components/Screen';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type MoreOption = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  id: string;
  items: string[];
};

const moreOptions: MoreOption[] = [
  {
    id: 'initiative',
    title: 'Soutenir l’initiative',
    description: 'Aider le développement et la diffusion de l’application.',
    icon: 'heart-outline',
    items: ['Participer aux frais techniques', 'Proposer une compétence', 'Relayer le projet'],
  },
  {
    id: 'organismes',
    title: 'Soutenir les organismes locaux',
    description: 'Mettre en avant les associations, mosquées et projets utiles.',
    icon: 'people-outline',
    items: ['Associations locales', 'Collectes en cours', 'Actions solidaires'],
  },
  {
    id: 'annuaire',
    title: 'Annuaire local',
    description: 'Retrouver les lieux, contacts et services de la communauté.',
    icon: 'map-outline',
    items: ['Mosquées', 'Écoles et cours', 'Commerces et services'],
  },
];

type MoreScreenProps = {
  onOpenCommunity: () => void;
  onOpenFeedback: () => void;
};

export function MoreScreen({ onOpenCommunity, onOpenFeedback }: MoreScreenProps) {
  useStyles();

  const [openId, setOpenId] = useState<string | null>('initiative');
  const handleOptionPress = (option: MoreOption, isOpen: boolean) => {
    if (option.id === 'annuaire') {
      onOpenCommunity();
      return;
    }

    setOpenId(isOpen ? null : option.id);
  };

  return (
    <Screen
      headerIcon="ellipsis-vertical"
      title="Services complémentaires"
      subtitle="Annuaire, contributions et liens utiles autour de la communauté locale."
    >
      <Pressable accessibilityRole="button" onPress={onOpenFeedback} style={styles.feedbackCard}>
        <View style={styles.feedbackIcon}>
          <Ionicons color={colors.textInverse} name="send" size={24} />
        </View>
        <View style={styles.feedbackCopy}>
          <Text style={styles.feedbackTitle}>Contacter l’équipe</Text>
          <Text style={styles.feedbackDescription}>
            Signaler une erreur, suggérer une amélioration ou contacter l’équipe.
          </Text>
        </View>
        <Ionicons color={colors.accentSoft} name="chevron-forward" size={20} />
      </Pressable>

      <View style={styles.optionList}>
        {moreOptions.map((option) => {
          const isOpen = option.id === openId;

          return (
            <View key={option.id} style={[styles.optionCard, isOpen && styles.optionCardOpen]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                onPress={() => handleOptionPress(option, isOpen)}
                style={[styles.optionHeader, isOpen && styles.optionHeaderOpen]}
              >
                <View style={[styles.optionIcon, isOpen && styles.optionIconOpen]}>
                  <Ionicons
                    color={isOpen ? colors.textInverse : colors.secondary}
                    name={option.icon}
                    size={23}
                  />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={[styles.chevronButton, isOpen && styles.chevronButtonOpen]}>
                  <Ionicons
                    color={isOpen ? colors.textInverse : colors.accentSoft}
                    name={
                      option.id === 'annuaire'
                        ? 'chevron-forward'
                        : isOpen
                          ? 'chevron-up'
                          : 'chevron-down'
                    }
                    size={18}
                  />
                </View>
              </Pressable>

              {isOpen ? (
                <View style={styles.dropdown}>
                  <View style={styles.dropdownTopLine} />
                  {option.items.map((item, index) => (
                    <View key={item} style={styles.dropdownRow}>
                      <View style={styles.dropdownNumber}>
                        <Text style={styles.dropdownNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.dropdownText}>{item}</Text>
                      <Ionicons color={colors.secondary} name="chevron-forward" size={17} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const createStyles = () => StyleSheet.create({
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: colors.cardDefault,
    borderColor: colors.chromeBorderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  feedbackIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  feedbackCopy: {
    flex: 1,
  },
  feedbackTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  feedbackDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  optionList: {
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.cardDefault,
    borderColor: colors.chromeBorderSoft,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
  },
  optionCardOpen: {
    borderColor: colors.goldBorderStrong,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  optionHeaderOpen: {
    backgroundColor: colors.primaryWash,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderColor: colors.goldBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  optionIconOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  chevronButton: {
    alignItems: 'center',
    backgroundColor: colors.chromeSoft,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  chevronButtonOpen: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dropdown: {
    backgroundColor: colors.panelDeep,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: spacing.lg,
  },
  dropdownTopLine: {
    alignSelf: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 3,
    marginBottom: spacing.xs,
    opacity: 0.65,
    width: 58,
  },
  dropdownRow: {
    alignItems: 'center',
    backgroundColor: colors.panelStrong,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dropdownNumber: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  dropdownNumberText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  dropdownText: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
