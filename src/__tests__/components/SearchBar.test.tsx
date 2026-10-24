import { fireEvent, render, screen } from '@testing-library/react-native';

import { SearchBar } from '@/components/list/SearchBar';

describe('SearchBar', () => {
  it('reports typing and clears through the Clear button', async () => {
    const onChangeText = jest.fn();
    const { rerender } = await render(<SearchBar value="" onChangeText={onChangeText} />);

    fireEvent.changeText(screen.getByTestId('search-input'), 'aire');
    expect(onChangeText).toHaveBeenLastCalledWith('aire');

    await rerender(<SearchBar value="aire" onChangeText={onChangeText} />);
    fireEvent.press(screen.getByLabelText('Clear search'));
    expect(onChangeText).toHaveBeenLastCalledWith('');
  });
});
