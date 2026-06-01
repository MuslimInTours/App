import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { useCallback, useMemo, useState } from 'react';

import { TabBar, TabKey } from './src/components/TabBar';
import { HomeScreen } from './src/screens/HomeScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { PrayerScreen } from './src/screens/PrayerScreen';
import { QuranScreen } from './src/screens/QuranScreen';
import { MoreScreen } from './src/screens/MoreScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { FeedbackScreen } from './src/screens/FeedbackScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { SubmitInfoScreen } from './src/screens/SubmitInfoScreen';
import { colors } from './src/theme/colors';
import { ThemeProvider, useThemeSettings, useThemedStyles } from './src/theme/ThemeProvider';

type AppScreen = TabKey | 'admin' | 'community' | 'feedback' | 'submitInfo';
const cachedScreens: AppScreen[] = ['home', 'news', 'quran', 'more', 'settings'];

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

function ThemedApp() {
  useStyles();

  const { resolvedTheme } = useThemeSettings();
  const [activeScreen, setActiveScreen] = useState<AppScreen>('home');
  const [visitedScreens, setVisitedScreens] = useState<AppScreen[]>(['home']);
  const activeTab: TabKey =
    activeScreen === 'admin' || activeScreen === 'community' || activeScreen === 'feedback'
      ? 'more'
      : activeScreen === 'submitInfo'
        ? 'news'
        : activeScreen;

  const navigate = useCallback((screen: AppScreen) => {
    setActiveScreen(screen);
    setVisitedScreens((currentScreens) =>
      currentScreens.includes(screen) ? currentScreens : [...currentScreens, screen],
    );
  }, []);

  const cachedVisitedScreens = useMemo(
    () => cachedScreens.filter((screen) => visitedScreens.includes(screen)),
    [visitedScreens],
  );

  const renderScreen = (screen: AppScreen) => {
    const screenProps = { onNavigate: navigate };

    switch (screen) {
      case 'home':
        return <HomeScreen {...screenProps} />;
      case 'news':
        return <NewsScreen onOpenSubmitInfo={() => navigate('submitInfo')} />;
      case 'prayer':
        return <PrayerScreen />;
      case 'quran':
        return <QuranScreen />;
      case 'more':
        return (
          <MoreScreen
            onOpenCommunity={() => navigate('community')}
            onOpenFeedback={() => navigate('feedback')}
          />
        );
      case 'settings':
        return <SettingsScreen onOpenAdmin={() => navigate('admin')} />;
      case 'admin':
        return <AdminScreen onBack={() => navigate('more')} />;
      case 'community':
        return <CommunityScreen onBack={() => navigate('more')} />;
      case 'feedback':
        return <FeedbackScreen onBack={() => navigate('more')} />;
      case 'submitInfo':
        return <SubmitInfoScreen onBack={() => navigate('news')} />;
      default:
        return <HomeScreen {...screenProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={resolvedTheme === 'day' ? 'dark' : 'light'} />
      <View style={styles.content}>
        {cachedVisitedScreens.map((screen) => (
          <View
            key={screen}
            style={[styles.screenLayer, activeScreen === screen ? styles.visible : styles.hidden]}
          >
            {renderScreen(screen)}
          </View>
        ))}
        {!cachedScreens.includes(activeScreen) ? renderScreen(activeScreen) : null}
      </View>
      <TabBar activeTab={activeTab} onChange={navigate} />
    </SafeAreaView>
  );
}

const createStyles = () => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  content: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  screenLayer: {
    flex: 1,
  },
  visible: {
    display: 'flex',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
