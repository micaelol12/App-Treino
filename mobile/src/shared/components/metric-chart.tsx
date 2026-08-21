import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

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
  readonly kind?: 'bar' | 'line' | 'horizontalBar';
  readonly series: readonly MetricChartSeries[];
  readonly valueSuffix?: string;
  readonly showLengend?: boolean;
}

const HEIGHT = 220;

const LEFT = 46;
const RIGHT = 18;
const TOP = 18;
const BOTTOM = 38;

// Horizontal
const HORIZONTAL_LEFT = 100;
const HORIZONTAL_RIGHT = 45;
const HORIZONTAL_TOP = 18;
const HORIZONTAL_BOTTOM = 25;
const HORIZONTAL_ROW_HEIGHT = 42;

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function MetricChart({
  accessibilitySummary,
  kind = 'line',
  series,
  valueSuffix = '',
  showLengend = true,
}: MetricChartProps) {
  const theme = useAppTheme();
  const [containerWidth, setContainerWidth] = useState(320);

  const pointCount = Math.max(
    0,
    ...series.map((item) => item.points.length),
  );

  const isHorizontal = kind === 'horizontalBar';

  const chartWidth = isHorizontal
    ? containerWidth
    : Math.max(
        containerWidth,
        LEFT + RIGHT + Math.max(pointCount, 1) * 46,
      );

  const chartHeight = isHorizontal
    ? HORIZONTAL_TOP +
      HORIZONTAL_BOTTOM +
      Math.max(pointCount, 1) * HORIZONTAL_ROW_HEIGHT
    : HEIGHT;

  const allValues = series.flatMap((item) =>
    item.points.map((point) => point.value),
  );

  const maximum = Math.max(1, ...allValues);
  const minimum = Math.min(0, ...allValues);
  const range = Math.max(1, maximum - minimum);

  /*
   * Vertical bar / line
   */
  const plotWidth = chartWidth - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;

  const x = (index: number) => {
    if (kind === 'bar') {
      const slotWidth = plotWidth / Math.max(pointCount, 1);

      return LEFT + index * slotWidth + slotWidth / 2;
    }

    return pointCount <= 1
      ? LEFT + plotWidth / 2
      : LEFT + (index / (pointCount - 1)) * plotWidth;
  };

  const y = (value: number) =>
    TOP + ((maximum - value) / range) * plotHeight;

  /*
   * Horizontal bar
   */
  const horizontalPlotWidth =
    chartWidth - HORIZONTAL_LEFT - HORIZONTAL_RIGHT;

  const horizontalX = (value: number) =>
    HORIZONTAL_LEFT + (value / maximum) * horizontalPlotWidth;

  const horizontalY = (index: number) =>
    HORIZONTAL_TOP +
    index * HORIZONTAL_ROW_HEIGHT +
    HORIZONTAL_ROW_HEIGHT / 2;

  const labelStep = Math.max(1, Math.ceil(pointCount / 6));

  const paths = useMemo(
    () =>
      series.map((item) =>
        item.points
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`,
          )
          .join(' '),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartWidth, maximum, minimum, pointCount, series],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(
      Math.max(240, event.nativeEvent.layout.width),
    );
  };

  const renderHorizontalBar = () => {
    const seriesCount = Math.max(series.length, 1);

    const totalBarHeight = Math.min(
      24,
      HORIZONTAL_ROW_HEIGHT * 0.65,
    );

    const barHeight = totalBarHeight / seriesCount;

    return (
      <Svg height={chartHeight} width={chartWidth}>
        {/* Linhas de referência */}
        {[0, 0.5, 1].map((ratio) => {
          const gridX =
            HORIZONTAL_LEFT + ratio * horizontalPlotWidth;

          const value = maximum * ratio;

          return (
            <G key={ratio}>
              <Line
                stroke={theme.colors.border}
                strokeWidth={1}
                x1={gridX}
                x2={gridX}
                y1={HORIZONTAL_TOP}
                y2={chartHeight - HORIZONTAL_BOTTOM}
              />

              <SvgText
                fill={theme.colors.textMuted}
                fontSize={10}
                textAnchor="middle"
                x={gridX}
                y={chartHeight - 7}
              >
                {formatAxisValue(value)}
                {valueSuffix}
              </SvgText>
            </G>
          );
        })}

        {/* Labels */}
        {(series[0]?.points ?? []).map((point, index) => (
          <SvgText
            fill={theme.colors.textMuted}
            fontSize={11}
            key={`${point.label}-${index}`}
            textAnchor="end"
            x={HORIZONTAL_LEFT - 8}
            y={horizontalY(index) + 4}
          >
            {point.label}
          </SvgText>
        ))}

        {/* Barras */}
        {series.map((item, seriesIndex) =>
          item.points.map((point, index) => {
            const centerY = horizontalY(index);

            const groupHeight = barHeight * seriesCount;

            const barY =
              centerY -
              groupHeight / 2 +
              seriesIndex * barHeight;

            const barWidth = Math.max(
              1,
              horizontalX(point.value) - HORIZONTAL_LEFT,
            );

            return (
              <G
                key={`${item.name}-${point.label}-${index}`}
              >
                <Rect
                  fill={item.color}
                  height={Math.max(barHeight - 3, 4)}
                  rx={4}
                  width={barWidth}
                  x={HORIZONTAL_LEFT}
                  y={barY}
                />

                <SvgText
                  fill={theme.colors.textMuted}
                  fontSize={10}
                  x={Math.min(
                    horizontalX(point.value) + 6,
                    chartWidth - HORIZONTAL_RIGHT,
                  )}
                  y={barY + barHeight - 5}
                >
                  {formatAxisValue(point.value)}
                  {valueSuffix}
                </SvgText>
              </G>
            );
          }),
        )}
      </Svg>
    );
  };

  const renderDefaultChart = () => (
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
              const slotWidth =
                plotWidth / Math.max(pointCount, 1);

              const barWidth = Math.min(
                28,
                slotWidth * 0.65,
              );

              return (
                <Rect
                  fill={item.color}
                  height={Math.max(
                    1,
                    TOP + plotHeight - y(point.value),
                  )}
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

        {(series[0]?.points ?? []).map(
          (point, index) =>
            index % labelStep === 0 ||
            index === pointCount - 1 ? (
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
  );

  return (
    <View
      accessibilityLabel={accessibilitySummary}
      accessible
      onLayout={onLayout}
    >
      {isHorizontal
        ? renderHorizontalBar()
        : renderDefaultChart()}

      {showLengend && (
        <View style={styles.legend}>
          {series.map((item) => (
            <View
              key={item.name}
              style={styles.legendItem}
            >
              <View
                style={[
                  styles.legendColor,
                  { backgroundColor: item.color },
                ]}
              />

              <AppText variant="caption">
                {item.name}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});