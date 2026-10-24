import { useEffect, useRef } from 'react';
import { Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';

import { createThemedStyles, useTheme } from '@/theme/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

export const SearchBar = ({ value, onChangeText }: Props) => {
  const styles = useStyles();
  const { colors } = useTheme();
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (value === '') inputRef.current?.clear();
  }, [value]);

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        defaultValue={value}
        onChangeText={onChangeText}
        placeholder="Search breeds or other names"
        placeholderTextColor={colors.textSubtle}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="never"
        returnKeyType="search"
        accessibilityLabel="Search breeds"
        testID="search-input"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
        >
          <Text style={styles.clear}>Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    paddingHorizontal: theme.spacing(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceMuted,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: theme.font.body,
  },
  clear: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
}));
