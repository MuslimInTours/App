import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing } from '../theme/spacing';

type SectionHeaderProps = {
  action?: string;
  onAction?: () => void;
  title: string;
};

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  useStyles();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {action ? (
        <Pressable accessibilityRole="button" disabled={!onAction} onPress={onAction}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = () => StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  title: {
    color: colors.textInverse,
    fontSize: 19,
    fontWeight: '900',
  },
  action: {
    color: colors.accentSoft,
    fontSize: 14,
    fontWeight: '800',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
