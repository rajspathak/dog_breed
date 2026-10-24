import { memo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import type { BannerTone, SyncBanner } from '@/sync/syncBanner';
import { createThemedStyles, useTheme, type ColorTokens } from '@/theme/theme';

type Props = {
  banner: SyncBanner;
  busy: boolean;
  onRetry: () => void;
};

const toneColors = (tone: BannerTone, colors: ColorTokens) => {
  switch (tone) {
    case 'danger':
      return { background: colors.dangerSurface, foreground: colors.danger };
    case 'warning':
      return { background: colors.warningSurface, foreground: colors.warning };
    case 'info':
      return { background: colors.infoSurface, foreground: colors.info };
    case 'neutral':
      return { background: 'transparent', foreground: colors.textMuted };
  }
};

export const SyncBannerView = memo(({ banner, busy, onRetry }: Props) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const tone = toneColors(banner.tone, colors);
  const compact = banner.tone === 'neutral';

  return (
    <View
      style={[styles.container, compact && styles.compact, { backgroundColor: tone.background }]}
      accessibilityRole={banner.tone === 'danger' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
      testID="sync-banner"
    >
      {busy ? <ActivityIndicator size="small" color={tone.foreground} /> : null}
      <View style={styles.text}>
        <Text style={[styles.title, compact && styles.compactTitle, { color: tone.foreground }]} numberOfLines={1}>
          {banner.title}
        </Text>
        {banner.detail ? (
          <Text style={[styles.detail, { color: tone.foreground }]} numberOfLines={2}>
            {banner.detail}
          </Text>
        ) : null}
      </View>
      {banner.canRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry sync" hitSlop={10}>
          <Text style={[styles.action, { color: tone.foreground }]}>
            {banner.tone === 'warning' ? 'Refresh' : 'Retry'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
});

SyncBannerView.displayName = 'SyncBannerView';

const useStyles = createThemedStyles((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(3),
    marginHorizontal: theme.spacing(4),
    marginBottom: theme.spacing(2),
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2.5),
    borderRadius: theme.radius.md,
  },
  compact: {
    paddingVertical: theme.spacing(0.5),
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactTitle: {
    fontSize: theme.font.caption,
    fontWeight: '500',
  },
  detail: {
    fontSize: theme.font.caption,
    opacity: 0.9,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
  },
}));
