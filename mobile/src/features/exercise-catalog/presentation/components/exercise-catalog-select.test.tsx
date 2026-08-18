import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import type { Exercise } from '../../domain/exercise';
import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { ExerciseCatalogSelect } from './exercise-catalog-select';

const exercises: Exercise[] = [
  {
    documentId: 'physical-bench',
    id: 'logical-bench-id',
    name: 'Supino reto',
    force: 'empurrar',
    level: 'iniciante',
    mechanic: 'composto',
    equipment: 'barra',
    primaryMuscles: ['peito'],
    secondaryMuscles: ['tríceps'],
    instructions: [],
    category: 'força',
    images: [],
  },
  {
    documentId: 'physical-row',
    id: 'logical-row-id',
    name: 'Remada curvada',
    force: 'puxar',
    level: 'intermediário',
    mechanic: 'composto',
    equipment: 'halteres',
    primaryMuscles: ['dorsais'],
    secondaryMuscles: ['bíceps'],
    instructions: [],
    category: 'força',
    images: [],
  },
];

describe('ExerciseCatalogSelect', () => {
  it('shows metadata chips without exposing catalog IDs', async () => {
    await render(
      <AppThemeProvider>
        <ExerciseCatalogSelect exercises={exercises} onChange={jest.fn()} value="" />
      </AppThemeProvider>,
    );

    await fireEvent.press(screen.getByLabelText('Exercício: Selecione'));

    const muscle = screen.getByTestId('exercise-chip-muscle-peito');
    const equipment = screen.getByTestId('exercise-chip-equipment-barra');
    const level = screen.getByTestId('exercise-chip-level-iniciante');
    expect(muscle).toBeOnTheScreen();
    expect(equipment).toBeOnTheScreen();
    expect(level).toBeOnTheScreen();
    expect(StyleSheet.flatten(muscle.props.style).backgroundColor).not.toBe(
      StyleSheet.flatten(equipment.props.style).backgroundColor,
    );
    expect(StyleSheet.flatten(equipment.props.style).backgroundColor).not.toBe(
      StyleSheet.flatten(level.props.style).backgroundColor,
    );
    expect(screen.queryByText('logical-bench-id')).not.toBeOnTheScreen();
    expect(screen.queryByText('physical-bench')).not.toBeOnTheScreen();
  });

  it('combines muscle, equipment and level filters and can clear them', async () => {
    await render(
      <AppThemeProvider>
        <ExerciseCatalogSelect exercises={exercises} onChange={jest.fn()} value="" />
      </AppThemeProvider>,
    );
    await fireEvent.press(screen.getByLabelText('Exercício: Selecione'));
    expect(screen.queryByTestId('exercise-filter-musculo-peito')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('exercise-filter-toggle'));
    await fireEvent.press(screen.getByTestId('exercise-filter-musculo-peito'));
    await fireEvent.press(screen.getByTestId('exercise-filter-equipamento-barra'));
    await fireEvent.press(screen.getByTestId('exercise-filter-nivel-iniciante'));
    expect(screen.getByTestId('exercise-filter-toggle').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    await fireEvent.press(screen.getByText('Aplicar filtros'));

    expect(screen.getByText('Supino reto')).toBeOnTheScreen();
    expect(screen.queryByText('Remada curvada')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('exercise-filter-musculo-peito')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('exercise-filter-toggle'));
    await fireEvent.press(screen.getByText('Limpar filtros'));
    expect(screen.getByText('Remada curvada')).toBeOnTheScreen();
  });
});
