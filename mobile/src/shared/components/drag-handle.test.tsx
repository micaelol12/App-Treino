import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppThemeProvider } from '@/shared/theme/theme-provider';

import { DragHandle } from './drag-handle';

describe('DragHandle', () => {
  it('starts dragging on long press and exposes equivalent accessibility actions', async () => {
    const drag = jest.fn();
    const onMove = jest.fn();
    await render(
      <AppThemeProvider>
        <DragHandle
          drag={drag}
          itemName="Supino"
          onMove={onMove}
          position={2}
          total={3}
        />
      </AppThemeProvider>,
    );
    const handle = screen.getByRole('button', {
      name: 'Arrastar Supino, posição 2 de 3',
    });

    await fireEvent(handle, 'longPress');
    await fireEvent(handle, 'accessibilityAction', {
      nativeEvent: { actionName: 'moveBefore' },
    });
    await fireEvent(handle, 'accessibilityAction', {
      nativeEvent: { actionName: 'moveAfter' },
    });

    expect(drag).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenNthCalledWith(1, 'before');
    expect(onMove).toHaveBeenNthCalledWith(2, 'after');
  });

  it('blocks gestures and actions while disabled', async () => {
    const drag = jest.fn();
    const onMove = jest.fn();
    await render(
      <AppThemeProvider>
        <DragHandle
          disabled
          drag={drag}
          itemName="Supino"
          onMove={onMove}
          position={1}
          total={2}
        />
      </AppThemeProvider>,
    );
    const handle = screen.getByRole('button');
    await fireEvent(handle, 'longPress');
    await fireEvent(handle, 'accessibilityAction', {
      nativeEvent: { actionName: 'moveAfter' },
    });
    expect(drag).not.toHaveBeenCalled();
    expect(onMove).not.toHaveBeenCalled();
  });
});
