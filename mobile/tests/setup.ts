jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-draggable-flatlist', () => {
  const React = require('react');
  const { ScrollView, View } = require('react-native');
  return {
    NestableScrollContainer: React.forwardRef(
      (props: Record<string, unknown>, ref: unknown) =>
        React.createElement(ScrollView, { ...props, ref }),
    ),
    NestableDraggableFlatList: ({
      data,
      keyExtractor,
      onDragEnd,
      renderItem,
      testID,
    }: {
      data: unknown[];
      keyExtractor: (item: unknown, index: number) => string;
      onDragEnd?: (event: { data: unknown[]; from: number; to: number }) => void;
      renderItem: (params: {
        item: unknown;
        drag: () => void;
        getIndex: () => number;
        isActive: boolean;
      }) => React.ReactNode;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { onDragEnd, testID },
        data.map((item, index) =>
          React.createElement(
            View,
            { key: keyExtractor(item, index) },
            renderItem({
              item,
              drag: jest.fn(),
              getIndex: () => index,
              isActive: false,
            }),
          ),
        ),
      ),
  };
});
