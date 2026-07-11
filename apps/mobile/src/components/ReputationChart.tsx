import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Circle, Path, Line, Text as SvgText, G } from 'react-native-svg';

/**
 * Reputation Visualization Component
 * Beautiful charts and graphs for reputation metrics
 */

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ReputationData {
  current: number;
  history: { date: string; value: number }[];
  breakdown: {
    completionRate: number;
    responseTime: number;
    quality: number;
    reliability: number;
  };
}

interface ReputationChartProps {
  data: ReputationData;
  type?: 'gauge' | 'line' | 'radar' | 'breakdown';
}

export const ReputationChart: React.FC<ReputationChartProps> = ({
  data,
  type = 'gauge',
}) => {
  switch (type) {
    case 'gauge':
      return <ReputationGauge value={data.current} />;
    case 'line':
      return <ReputationLineChart history={data.history} />;
    case 'radar':
      return <ReputationRadar breakdown={data.breakdown} />;
    case 'breakdown':
      return <ReputationBreakdown breakdown={data.breakdown} />;
    default:
      return <ReputationGauge value={data.current} />;
  }
};

/**
 * Circular Gauge Chart
 */
const ReputationGauge: React.FC<{ value: number }> = ({ value }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const getColor = (val: number): string => {
    if (val >= 4.5) return '#10b981'; // Green
    if (val >= 4.0) return '#C8F33A'; // Lime
    if (val >= 3.5) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const color = getColor(value);
  const percentage = (value / 5) * 100;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.gaugeCenter}>
        <Text style={[styles.gaugeValue, { color }]}>{value.toFixed(1)}</Text>
        <Text style={styles.gaugeLabel}>/ 5.0</Text>
      </View>
    </View>
  );
};

/**
 * Line Chart for History
 */
const ReputationLineChart: React.FC<{
  history: { date: string; value: number }[];
}> = ({ history }) => {
  const chartWidth = SCREEN_WIDTH - 40;
  const chartHeight = 200;
  const padding = 20;

  if (history.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No history data available</Text>
      </View>
    );
  }

  // Calculate scales
  const maxValue = 5;
  const minValue = 0;
  const xStep = (chartWidth - 2 * padding) / (history.length - 1);
  const yScale = (chartHeight - 2 * padding) / (maxValue - minValue);

  // Generate path
  const points = history.map((point, index) => ({
    x: padding + index * xStep,
    y: chartHeight - padding - (point.value - minValue) * yScale,
  }));

  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const prevPoint = points[index - 1]!;
      const cpX = (prevPoint.x + point.x) / 2;
      return `Q ${cpX} ${prevPoint.y}, ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <View style={styles.lineChartContainer}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((value) => {
          const y = chartHeight - padding - (value - minValue) * yScale;
          return (
            <G key={value}>
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={padding - 10}
                y={y + 5}
                fontSize={12}
                fill="#6b7280"
                textAnchor="end"
              >
                {value}
              </SvgText>
            </G>
          );
        })}

        {/* Line path */}
        <Path
          d={pathData}
          stroke="#3b82f6"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={5}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        {history.map((point, index) => {
          if (index % Math.ceil(history.length / 5) !== 0) return null;
          return (
            <Text key={index} style={styles.xAxisLabel}>
              {new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

/**
 * Radar Chart for Breakdown
 */
const ReputationRadar: React.FC<{
  breakdown: {
    completionRate: number;
    responseTime: number;
    quality: number;
    reliability: number;
  };
}> = ({ breakdown }) => {
  const size = 250;
  const center = size / 2;
  const maxRadius = size / 2 - 40;

  const metrics = [
    { label: 'Completion', value: breakdown.completionRate },
    { label: 'Response', value: breakdown.responseTime },
    { label: 'Quality', value: breakdown.quality },
    { label: 'Reliability', value: breakdown.reliability },
  ];

  const angleStep = (2 * Math.PI) / metrics.length;

  // Calculate points
  const points = metrics.map((metric, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (metric.value / 5) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (maxRadius + 30) * Math.cos(angle),
      labelY: center + (maxRadius + 30) * Math.sin(angle),
      label: metric.label,
      value: metric.value,
    };
  });

  const pathData = points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `L ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  return (
    <View style={styles.radarContainer}>
      <Svg width={size} height={size}>
        {/* Background circles */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => (
          <Circle
            key={scale}
            cx={center}
            cy={center}
            r={maxRadius * scale}
            stroke="#e5e7eb"
            strokeWidth={1}
            fill="none"
          />
        ))}

        {/* Axis lines */}
        {points.map((point, index) => (
          <Line
            key={index}
            x1={center}
            y1={center}
            x2={point.labelX}
            y2={point.labelY}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
        ))}

        {/* Data polygon */}
        <Path
          d={pathData}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth={2}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={5}
            fill="#3b82f6"
            stroke="#fff"
            strokeWidth={2}
          />
        ))}

        {/* Labels */}
        {points.map((point, index) => (
          <SvgText
            key={index}
            x={point.labelX}
            y={point.labelY}
            fontSize={12}
            fill="#374151"
            fontWeight="600"
            textAnchor="middle"
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

/**
 * Breakdown Bars
 */
const ReputationBreakdown: React.FC<{
  breakdown: {
    completionRate: number;
    responseTime: number;
    quality: number;
    reliability: number;
  };
}> = ({ breakdown }) => {
  const metrics = [
    { label: 'Completion Rate', value: breakdown.completionRate, icon: '✓' },
    { label: 'Response Time', value: breakdown.responseTime, icon: '⚡' },
    { label: 'Quality', value: breakdown.quality, icon: '⭐' },
    { label: 'Reliability', value: breakdown.reliability, icon: '🎯' },
  ];

  return (
    <View style={styles.breakdownContainer}>
      {metrics.map((metric, index) => (
        <BreakdownBar key={index} {...metric} />
      ))}
    </View>
  );
};

const BreakdownBar: React.FC<{
  label: string;
  value: number;
  icon: string;
}> = ({ label, value, icon }) => {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: value,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const getColor = (val: number): string => {
    if (val >= 4.5) return '#10b981';
    if (val >= 4.0) return '#3b82f6';
    if (val >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(value);
  const percentage = (value / 5) * 100;

  return (
    <View style={styles.breakdownItem}>
      <View style={styles.breakdownHeader}>
        <Text style={styles.breakdownIcon}>{icon}</Text>
        <Text style={styles.breakdownLabel}>{label}</Text>
        <Text style={[styles.breakdownValue, { color }]}>
          {value.toFixed(1)}
        </Text>
      </View>
      <View style={styles.breakdownBarContainer}>
        <View style={styles.breakdownBarBackground} />
        <Animated.View
          style={[
            styles.breakdownBarFill,
            {
              backgroundColor: color,
              width: animatedWidth.interpolate({
                inputRange: [0, 5],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  gaugeLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  lineChartContainer: {
    padding: 20,
  },
  emptyChart: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  breakdownContainer: {
    padding: 20,
  },
  breakdownItem: {
    marginBottom: 20,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  breakdownBarContainer: {
    height: 8,
    position: 'relative',
  },
  breakdownBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 0,
  },
  breakdownBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 0,
  },
});

export default ReputationChart;

// Made with Bob
