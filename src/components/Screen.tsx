import { PropsWithChildren } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from 'react-native-svg';

import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type ScreenProps = PropsWithChildren<{
  headerIcon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}>;

export function Screen({ headerIcon, title, subtitle, children }: ScreenProps) {
  useStyles();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientMiddle, colors.backgroundDeep]}
        end={{ x: 1, y: 0.95 }}
        start={{ x: 0, y: 0 }}
        style={styles.header}
      >
        <OttomanPattern />
        <LinearGradient
          colors={[colors.headerFadeStart, colors.backgroundDeep]}
          style={styles.headerFade}
        />
        <View style={styles.headerContent}>
          {headerIcon ? (
            <View style={styles.headerIcon}>
              <Ionicons color={colors.accentSoft} name={headerIcon} size={23} />
            </View>
          ) : null}
          <View style={styles.kickerPill}>
            <Text style={styles.kicker}>Tours et alentours</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.localBadge}>
            <View style={styles.localBadgeDot} />
            <Text style={styles.localBadgeText}>Pour la communauté locale</Text>
          </View>
        </View>
      </LinearGradient>
      <View style={styles.body}>
        <OttomanPattern variant="body" />
        <View style={styles.bodyContent}>{children}</View>
      </View>
    </ScrollView>
  );
}

function OttomanPattern({ variant = 'header' }: { variant?: 'header' | 'body' }) {
  const viewBoxHeight = variant === 'body' ? 1540 : 360;
  const patternId = `arabesque-${variant}`;

  return (
    <View
      pointerEvents="none"
      style={[styles.patternLayer, variant === 'body' && styles.patternLayerBody]}
    >
      <Svg
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`0 0 390 ${viewBoxHeight}`}
        width="100%"
      >
        <Defs>
          <Pattern height={52} id={patternId} patternUnits="userSpaceOnUse" width={62}>
            <ArabesqueTile />
          </Pattern>
        </Defs>
        <Rect fill={`url(#${patternId})`} height={viewBoxHeight} width={390} x={0} y={0} />
      </Svg>
    </View>
  );
}

function ArabesqueTile() {
  return (
    <G
      fill="none"
      stroke={colors.textInverse}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.35}
      transform="translate(0 -5)"
    >
      <Path d="M31 4 C43 12 48 22 62 31 C48 40 43 50 31 58 C19 50 14 40 0 31 C14 22 19 12 31 4Z" />
      <Path d="M31 14 C39 20 42 26 51 31 C42 36 39 42 31 48 C23 42 20 36 11 31 C20 26 23 20 31 14Z" opacity={0.72} />
      <Path d="M31 31 C17 25 11 14 18 8 C25 2 35 8 33 17 C31 25 21 24 24 17 C26 13 30 15 29 19" />
      <G origin="31,31" rotation={90}>
        <Path d="M31 31 C17 25 11 14 18 8 C25 2 35 8 33 17 C31 25 21 24 24 17 C26 13 30 15 29 19" />
      </G>
      <G origin="31,31" rotation={180}>
        <Path d="M31 31 C17 25 11 14 18 8 C25 2 35 8 33 17 C31 25 21 24 24 17 C26 13 30 15 29 19" />
      </G>
      <G origin="31,31" rotation={270}>
        <Path d="M31 31 C17 25 11 14 18 8 C25 2 35 8 33 17 C31 25 21 24 24 17 C26 13 30 15 29 19" />
      </G>
      <Path d="M6 6 C12 13 13 19 8 23 C3 27 -2 22 2 17 C5 13 9 16 7 19" opacity={0.72} />
      <G origin="31,31" rotation={90}>
        <Path d="M6 6 C12 13 13 19 8 23 C3 27 -2 22 2 17 C5 13 9 16 7 19" opacity={0.72} />
      </G>
      <G origin="31,31" rotation={180}>
        <Path d="M6 6 C12 13 13 19 8 23 C3 27 -2 22 2 17 C5 13 9 16 7 19" opacity={0.72} />
      </G>
      <G origin="31,31" rotation={270}>
        <Path d="M6 6 C12 13 13 19 8 23 C3 27 -2 22 2 17 C5 13 9 16 7 19" opacity={0.72} />
      </G>
      <Circle cx={31} cy={31} opacity={0.68} r={1.45} />
      <Circle cx={31} cy={8} opacity={0.48} r={1} />
      <Circle cx={31} cy={54} opacity={0.48} r={1} />
      <Circle cx={8} cy={31} opacity={0.48} r={1} />
      <Circle cx={54} cy={31} opacity={0.48} r={1} />
    </G>
  );
}

const createStyles = () => StyleSheet.create({
  scroll: {
    backgroundColor: colors.backgroundDeep,
  },
  container: {
    backgroundColor: colors.backgroundDeep,
    paddingBottom: 118,
  },
  header: {
    overflow: 'hidden',
    paddingBottom: 34,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  headerFade: {
    bottom: 0,
    height: 150,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.16,
  },
  patternLayerBody: {
    opacity: 0.035,
  },
  headerContent: {
    alignItems: 'flex-start',
    gap: spacing.md,
    position: 'relative',
  },
  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeStrong,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kicker: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerIcon: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: colors.chromeBorderSoft,
    borderColor: colors.chromeBorderSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 52,
  },
  title: {
    color: colors.textInverse,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 43,
    marginTop: spacing.xs,
    maxWidth: 330,
  },
  subtitle: {
    color: colors.mutedInverse,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 620,
    opacity: 0.96,
  },
  localBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.chrome,
    borderColor: colors.chromeBorder,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  localBadgeDot: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: 7,
    width: 7,
  },
  localBadgeText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '900',
  },
  body: {
    backgroundColor: colors.backgroundDeep,
    minHeight: 620,
    overflow: 'hidden',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  bodyContent: {
    position: 'relative',
  },
});

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
