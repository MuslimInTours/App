import { PropsWithChildren } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { shadows } from '../theme/shadows';
import { spacing } from '../theme/spacing';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  tone?: 'default' | 'primary' | 'muted' | 'accent';
}>;

export function Card({ children, style, tone = 'default' }: CardProps) {
  useStyles();

  if (tone === 'primary') {
    return (
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primary, colors.primaryGradientEnd]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.card, styles.primary, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, styles[tone], style]}>{children}</View>;
}

const createStyles = () => StyleSheet.create({
  card: {
    ...shadows.soft,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  default: {
    backgroundColor: colors.cardDefault,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  muted: {
    backgroundColor: colors.cardMuted,
    borderColor: colors.border,
  },
  accent: {
    backgroundColor: colors.cardAccent,
    borderColor: colors.cardAccentBorder,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
