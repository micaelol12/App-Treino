import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { useAppTheme } from '@/shared/theme/theme-provider';
import { spacing } from '@/shared/theme/tokens';

import { AppText } from './app-text';

export interface MetricChartPoint {
  readonly label: string;
  readonly value: number;
}

export interface MetricChartSeries {
  readonly color: string;
  readonly name: string;
  readonly points: readonly MetricChartPoint[];
}

interface MetricChartProps {
  readonly accessibilitySummary: string;
  readonly kind?: 'bar' | 'line';
  readonly series: readonly MetricChartSeries[];
  readonly valueSuffix?: string;
}

const HEIGHT = 220;
const LEFT = 46;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 38;

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MetricChart({
  accessibilitySummary,
  kind = 'line',
  series,
  valueSuffix = '',
}: MetricChartProps) {
  const theme = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(320);
  const pointCount = Math.max(0, ...series.map((item) => item.points.length));
  const chartWidth = Math.max(
    containerWidth,
    LEFT + RIGHT + Math.max(pointCount, 1) * 46,
  );
  const plotWidth = chartWidth - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const allValues = series.flatMap((item) => item.points.map((point) => point.value));
  const maximum = Math.max(1, ...allValues);
  const minimum = Math.min(0, ...allValues);
  const range = Math.max(1, maximum - minimum);
  const x = (index: number) => {
    if (kind === 'bar') {
      const slotWidth = plotWidth / Math.max(pointCount, 1);
      return LEFT + index * slotWidth + slotWidth / 2;
    }
    return pointCount <= 1
      ? LEFT + plotWidth / 2
      : LEFT + (index / (pointCount - 1)) * plotWidth;
  };
  const y = (value: number) => TOP + ((maximum - value) / range) * plotHeight;
  const labelStep = Math.max(1, Math.ceil(pointCount / 6));

  const paths = useMemo(
    () =>
      series.map((item) =>
        item.points
          .map(
            (point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`,
          )
          .join(' '),
      ),
    // x and y are derived only from the values below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartWidth, maximum, minimum, pointCount, series],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(Math.max(240, event.nativeEvent.layout.width));
  };

  return (
    <View accessibilityLabel={accessibilitySummary} accessible onLayout={onLayout}>
      <ScrollView
        accessibilityLabel="Gráfico rolável horizontalmente"
        horizontal
        showsHorizontalScrollIndicator
      >
        <Svg height={HEIGHT} width={chartWidth}>
          {[0, 0.5, 1].map((ratio) => {
            const gridY = TOP + ratio * plotHeight;
            const value = maximum - ratio * range;
            return (
              <G key={ratio}>
                <Line
                  stroke={theme.colors.border}
                  strokeWidth={1}
                  x1={LEFT}
                  x2={chartWidth - RIGHT}
                  y1={gridY}
                  y2={gridY}
                />
                <SvgText
                  fill={theme.colors.textMuted}
                  fontSize={11}
                  textAnchor="end"
                  x={LEFT - 7}
                  y={gridY + 4}
                >
                  {formatAxisValue(value)}
                </SvgText>
              </G>
            );
          })}
          {series.map((item, seriesIndex) =>
            kind === 'bar' ? (
              item.points.map((point, index) => {
                const slotWidth = plotWidth / Math.max(pointCount, 1);
                const barWidth = Math.min(28, slotWidth * 0.65);
                return (
                  <Rect
                    fill={item.color}
                    height={Math.max(1, TOP + plotHeight - y(point.value))}
                    key={`${item.name}-${point.label}-${index}`}
                    rx={4}
                    width={barWidth}
                    x={x(index) - barWidth / 2}
                    y={y(point.value)}
                  />
                );
              })
            ) : (
              <G key={item.name}>
                <Path
                  d={paths[seriesIndex] ?? ''}
                  fill="none"
                  stroke={item.color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                />
                {item.points.map((point, index) => (
                  <Circle
                    cx={x(index)}
                    cy={y(point.value)}
                    fill={theme.colors.surface}
                    key={`${item.name}-${point.label}-${index}`}
                    r={4}
                    stroke={item.color}
                    strokeWidth={3}
                  />
                ))}
              </G>
            ),
          )}
          {(series[0]?.points ?? []).map((point, index) =>
            index % labelStep === 0 || index === pointCount - 1 ? (
              <SvgText
                fill={theme.colors.textMuted}
                fontSize={11}
                key={`${point.label}-${index}`}
                textAnchor="middle"
                x={x(index)}
                y={HEIGHT - 13}
              >
                {point.label}
              </SvgText>
            ) : null,
          )}
        </Svg>
      </ScrollView>
      <View style={styles.legend}>
        {series.map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <AppText variant="caption">
              {item.name}
              {valueSuffix}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendColor: { width: 12, height: 12, borderRadius: 6 },
});
