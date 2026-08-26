import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { AppState } from 'react-native';

export function useFlushOnScreenExit(flush: () => void): void {
  useFocusEffect(
    useCallback(() => {
      const subscription = AppState.addEventListener('change', (state) => {
        if (state !== 'active') flush();
      });
      return () => {
        subscription.remove();
        flush();
      };
    }, [flush]),
  );
}
