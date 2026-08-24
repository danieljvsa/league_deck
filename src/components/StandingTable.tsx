import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Standing, StandingEntry } from '@/domain';
import { useColors } from '@/constants/theme';

interface StandingTableProps {
  standings: Standing[];
  participants: Map<string, string>;
  showGoalDifference?: boolean;
  highlightTop?: number;
  highlightBottom?: number;
}

export const StandingTable = React.memo(function StandingTable({ 
  standings, 
  participants, 
  showGoalDifference = true,
  highlightTop = 4,
  highlightBottom = 3
}: StandingTableProps) {
  const colors = useColors();

  const table = standings[0];
  const hasGoalDifference = useMemo(
    () => table?.entries.some(e => e.goalDifference !== undefined) ?? false,
    [table]
  );

  const positionColors = useMemo(() => {
    if (!table) return {};
    const map: Record<number, { color: string; bg: string; icon?: string }> = {};
    for (const entry of table.entries) {
      const pos = entry.position;
      let color = colors.text;
      let bg = 'transparent';
      let icon: string | undefined;
      
      if (pos <= 1) {
        color = colors.primary;
        bg = colors.primaryLight;
        icon = 'trophy-outline';
      } else if (pos <= highlightTop) {
        color = colors.success;
        bg = colors.successLight;
        icon = 'star-outline';
      } else if (pos > table.entries.length - highlightBottom) {
        color = colors.danger;
        bg = colors.dangerLight;
        icon = 'arrow-down-outline';
      }
      
      map[pos] = { color, bg, icon };
    }
    return map;
  }, [table, highlightTop, highlightBottom, colors]);

  if (standings.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Ionicons name="stats-chart-outline" size={32} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>No standings available</Text>
      </View>
    );
  }

  if (!table) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      {/* Table Header */}
      <View style={[styles.row, styles.header, { backgroundColor: colors.muted }]}>
        <Text style={[styles.cell, styles.positionCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>#</Text>
        <Text style={[styles.cell, styles.teamCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Team</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>P</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>W</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>D</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>L</Text>
        {hasGoalDifference && showGoalDifference && (
          <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>GD</Text>
        )}
        <Text style={[styles.cell, styles.pointsCell, styles.headerText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>PTS</Text>
      </View>
      
      {/* Table Rows */}
      {table.entries.map((entry, index) => {
        const posStyle = positionColors[entry.position] || { color: colors.text, bg: 'transparent' };
        const isLast = index === table.entries.length - 1;
        
        return (
          <View 
            key={entry.participantId} 
            style={[
              styles.row, 
              { backgroundColor: posStyle.bg },
              !isLast && { borderBottomColor: colors.borderLight },
              isLast && styles.lastRow,
            ]}
          >
            <View style={[styles.cell, styles.positionCell, styles.positionContainer]}>
              {posStyle.icon ? (
                <Ionicons name={posStyle.icon as any} size={14} color={posStyle.color} />
              ) : (
                <Text style={[styles.positionText, { color: posStyle.color }]} maxFontSizeMultiplier={1.3}>
                  {entry.position}
                </Text>
              )}
            </View>
            <Text style={[styles.cell, styles.teamCell, styles.teamText, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {participants.get(entry.participantId) || entry.participantId}
            </Text>
            <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {entry.played ?? '-'}
            </Text>
            <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {entry.won ?? '-'}
            </Text>
            <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {entry.drawn ?? '-'}
            </Text>
            <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {entry.lost ?? '-'}
            </Text>
            {hasGoalDifference && showGoalDifference && (
              <Text style={[
                styles.cell, 
                styles.statCell, 
                styles.statText,
                (entry.goalDifference ?? 0) > 0 && [styles.positiveGD, { color: colors.success }],
                (entry.goalDifference ?? 0) < 0 && [styles.negativeGD, { color: colors.danger }],
              ]} maxFontSizeMultiplier={1.3}>
                {entry.goalDifference ?? '-'}
              </Text>
            )}
            <Text style={[styles.cell, styles.pointsCell, styles.pointsText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>
              {entry.points ?? '-'}
            </Text>
          </View>
        );
      })}

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.borderLight }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Champion</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Qualification</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Relegation</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyContainer: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  header: {
    paddingVertical: 10,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cell: {
    // textAlign is applied to Text children, not View
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  positionCell: {
    width: 32,
  },
  positionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCell: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: 8,
  },
  statCell: {
    width: 36,
  },
  pointsCell: {
    width: 40,
  },
  positionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  teamText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statText: {
    fontSize: 14,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
  },
  positiveGD: {},
  negativeGD: {},
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
  },
});
