import { fireEvent, render, screen } from '@testing-library/react-native';

import { ImageAttribution, formatSource } from '@/components/detail/ImageAttribution';
import { TraitScale } from '@/components/detail/TraitScale';
import { TraitsTab } from '@/components/detail/TraitsTab';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { BreedRow } from '@/components/list/BreedRow';
import { SyncBannerView } from '@/components/sync/SyncBannerView';
import { EMPTY_CRITERIA } from '@/domain/filters';
import { useCatalogStore } from '@/store/catalogStore';
import { useFilterStore } from '@/store/filterStore';

import { makeBreed, makeItem } from '../helpers/factories';

jest.mock('@/images/imageCache', () => ({
  imageCache: {
    peek: () => null,
    resolve: () => Promise.resolve(null),
  },
}));

describe('TraitScale', () => {
  it('exposes the score to screen readers', async () => {
    await render(<TraitScale label="Energy" value={4} low="Mellow" high="High drive" />);
    expect(screen.getByLabelText('Energy: 4 out of 5. Mellow to High drive.')).toBeTruthy();
    expect(screen.getByText('4/5')).toBeTruthy();
  });

  it('handles a missing score', async () => {
    await render(<TraitScale label="Drooling" value={null} low="Dry" high="Drooly" />);
    expect(screen.getByLabelText('Drooling: not rated')).toBeTruthy();
  });
});

describe('TraitsTab', () => {
  it('shows an empty state when the source has no traits', async () => {
    await render(<TraitsTab traits={null} />);
    expect(screen.getByText('No trait data yet')).toBeTruthy();
  });

  it('renders temperament tags and all scored traits', async () => {
    const breed = makeBreed();
    await render(<TraitsTab traits={breed.traits} />);
    expect(screen.getByText('loyal')).toBeTruthy();
    expect(screen.getByText('Good with children')).toBeTruthy();
    expect(screen.getByText('60 min / day')).toBeTruthy();
  });
});

describe('ImageAttribution', () => {
  it('surfaces author, license and source', async () => {
    await render(
      <ImageAttribution
        attribution={{
          author: 'Canarian',
          license: 'CC BY-SA 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
          source: 'wikimedia_commons',
          sourceUrl: 'https://commons.wikimedia.org/wiki/File:x.jpg',
        }}
      />,
    );
    expect(screen.getByText('Photo by Canarian')).toBeTruthy();
    expect(screen.getByText('CC BY-SA 4.0')).toBeTruthy();
    expect(screen.getByText('Wikimedia Commons')).toBeTruthy();
  });

  it('degrades gracefully when fields are missing', async () => {
    await render(
      <ImageAttribution
        attribution={{ author: null, license: null, licenseUrl: null, source: null, sourceUrl: null }}
      />,
    );
    expect(screen.getByText('Photo by unknown author')).toBeTruthy();
    expect(screen.getByText('License not specified')).toBeTruthy();
    expect(formatSource(null)).toBeNull();
  });
});

describe('SyncBannerView', () => {
  it('calls retry from an error banner', async () => {
    const onRetry = jest.fn();
    await render(
      <SyncBannerView
        banner={{ tone: 'danger', title: 'Showing cached data', detail: 'Server error', canRetry: true }}
        busy={false}
        onRetry={onRetry}
      />,
    );
    fireEvent.press(screen.getByLabelText('Retry sync'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('BreedRow', () => {
  it('describes the breed and reports taps by id', async () => {
    const onPress = jest.fn();
    const item = makeItem({ id: 'poodle', name: 'Poodle', hypoallergenic: true });
    await render(<BreedRow item={item} isLast={false} onPress={onPress} />);

    fireEvent.press(screen.getByTestId('breed-row-poodle'));

    expect(onPress).toHaveBeenCalledWith('poodle');
    expect(screen.getByText('Hypoallergenic')).toBeTruthy();
    expect(screen.getByText('Medium · Short coat · 10–12 yrs')).toBeTruthy();
  });
});

describe('FilterPanel', () => {
  beforeEach(() => {
    useFilterStore.setState({ query: '', criteria: EMPTY_CRITERIA });
    useCatalogStore.getState().hydrate({
      breeds: [],
      groups: [{ id: 'herding', name: 'Herding Group', breedIds: ['a', 'b'] }],
      sync: {},
    });
  });

  it('writes selections into the filter store', async () => {
    await render(<FilterPanel />);

    fireEvent.press(screen.getByText('Herding (2)'));
    fireEvent.press(screen.getByTestId('coat-wire'));
    fireEvent.press(screen.getByTestId('hypo-yes'));
    fireEvent.press(screen.getByTestId('trait-goodWithChildren-4'));

    expect(useFilterStore.getState().criteria).toEqual({
      groupIds: ['herding'],
      sizeBands: [],
      coats: ['wire'],
      hypoallergenic: 'yes',
      traitMinimums: { goodWithChildren: 4 },
    });

    fireEvent.press(screen.getByTestId('trait-goodWithChildren-any'));
    expect(useFilterStore.getState().criteria.traitMinimums).toEqual({});
  });
});
