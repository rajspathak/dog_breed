import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/theme/theme';

export const DETAIL_TABS = ['overview', 'traits', 'gallery'] as const;

export type DetailTab = (typeof DETAIL_TABS)[number];

const LABELS: Record<DetailTab, string> = {
  overview: 'Overview',
  traits: 'Traits',
  gallery: 'Gallery',
};

type Props = {
  active: DetailTab;
  onChange: (tab: DetailTab) => void;
  galleryCount: number;
};

export const DetailTabs = ({ active, onChange, galleryCount }: Props) => {
  const styles = useStyles();
  return (
    <View style={styles.bar} accessibilityRole="tablist">
      {DETAIL_TABS.map((tab) => {
        const selected = tab === active;
        const label = tab === 'gallery' && galleryCount > 0 ? `${LABELS[tab]} (${galleryCount})` : LABELS[tab];
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            testID={`tab-${tab}`}
            style={[styles.tab, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  bar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing(2),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing(3),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  selected: {
    borderBottomColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    color: theme.colors.text,
  },
}));
