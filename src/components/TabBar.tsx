import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { spacing } from '../theme/spacing';

export type TabKey = 'home' | 'news' | 'prayer' | 'quran' | 'more' | 'settings';

type Tab = {
  key: TabKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
};

const tabs: Tab[] = [
  { key: 'news', label: 'Infos', icon: 'megaphone-outline', activeIcon: 'megaphone' },
  { key: 'prayer', label: 'Prières', icon: 'time-outline', activeIcon: 'time' },
  { key: 'quran', label: 'Quran', icon: 'library-outline', activeIcon: 'library' },
  { key: 'settings', label: 'Paramètres', icon: 'settings-outline', activeIcon: 'settings' },
  { key: 'more', label: 'Services', icon: 'grid-outline', activeIcon: 'grid' },
];

type TabBarProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onChange }: TabBarProps) {
  useStyles();

  const isHomeActive = activeTab === 'home';

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel="Accueil"
        accessibilityRole="button"
        accessibilityState={{ selected: isHomeActive }}
        onPress={() => onChange('home')}
      >
        <LinearGradient
          colors={
            isHomeActive
              ? [colors.primary, colors.secondary]
              : [colors.chrome, colors.chromeSoft]
          }
          style={[styles.brandButton, isHomeActive && styles.brandButtonActive]}
        >
          <Ionicons
            color={isHomeActive ? colors.textInverse : colors.muted}
            name={isHomeActive ? 'moon' : 'moon-outline'}
            size={30}
          />
        </LinearGradient>
      </Pressable>

      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              {isActive ? (
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={styles.activeBubble}
                >
                  <Ionicons color={colors.textInverse} name={tab.activeIcon} size={28} />
                </LinearGradient>
              ) : (
                <Ionicons color={colors.muted} name={tab.icon} size={27} />
              )}
            </Pressable>
          );
        })}
      </View>

    </View>
  );
}

const createStyles = () => StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    left: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
    shadowColor: colors.shadow,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
  },
  brandButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  brandButtonActive: {
    borderColor: colors.cardAccentBorder,
  },
  container: {
    backgroundColor: colors.tabBar,
    borderColor: colors.chromeBorder,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 66,
    padding: 6,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  tabActive: {
    backgroundColor: 'transparent',
  },
  activeBubble: {
    alignItems: 'center',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
