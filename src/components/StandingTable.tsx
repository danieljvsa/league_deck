import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Standing, StandingEntry } from '@/domain';
import { useColors } from '@/constants/theme';

interface StandingTableProps {
  standings: Standing[];
  participants: Map<string, string>;
  showGoalDifference?: boolean;
  highlightTop?: number;
}

export function StandingTable({ 
  standings, 
  participants, 
  showGoalDifference = true,
  highlightTop = 4 
}: StandingTableProps) {
  const colors = useColors();

  if (standings.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No standings available</Text>
      </View>
    );
  }

  const table = standings[0];
  const hasGoalDifference = table.entries.some(e => e.goalDifference !== undefined);

  const getPositionStyle = (position: number) => {
    if (position <= highlightTop) {
      return { backgroundColor: colors.successLight };
    }
    return {};
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={[styles.row, styles.header, { backgroundColor: colors.muted }]}>
        <Text style={[styles.cell, styles.positionCell, styles.headerText, { color: colors.textSecondary }]}>#</Text>
        <Text style={[styles.cell, styles.teamCell, styles.headerText, { color: colors.textSecondary }]}>Team</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]}>P</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]}>W</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]}>D</Text>
        <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]}>L</Text>
        {hasGoalDifference && showGoalDifference && (
          <Text style={[styles.cell, styles.statCell, styles.headerText, { color: colors.textSecondary }]}>GD</Text>
        )}
        <Text style={[styles.cell, styles.pointsCell, styles.headerText, { color: colors.textSecondary }]}>PTS</Text>
      </View>
      
      {table.entries.map((entry, index) => (
        <View 
          key={entry.participantId} 
          style={[
            styles.row, 
            getPositionStyle(entry.position),
            index === table.entries.length - 1 && styles.lastRow,
            { borderBottomColor: colors.borderLight }
          ]}
        >
          <Text style={[styles.cell, styles.positionCell, styles.positionText, { color: colors.textSecondary }]}>
            {entry.position}
          </Text>
          <Text style={[styles.cell, styles.teamCell, styles.teamText, { color: colors.text }]} numberOfLines={1}>
            {participants.get(entry.participantId) || entry.participantId}
          </Text>
          <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]}>
            {entry.played ?? '-'}
          </Text>
          <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]}>
            {entry.won ?? '-'}
          </Text>
          <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]}>
            {entry.drawn ?? '-'}
          </Text>
          <Text style={[styles.cell, styles.statCell, styles.statText, { color: colors.textSecondary }]}>
            {entry.lost ?? '-'}
          </Text>
          {hasGoalDifference && showGoalDifference && (
            <Text style={[
              styles.cell, 
              styles.statCell, 
              styles.statText,
              (entry.goalDifference ?? 0) > 0 && [styles.positiveGD, { color: colors.success }],
              (entry.goalDifference ?? 0) < 0 && [styles.negativeGD, { color: colors.danger }],
            ]}>
              {entry.goalDifference ?? '-'}
            </Text>
          )}
          <Text style={[styles.cell, styles.pointsCell, styles.pointsText, { color: colors.text }]}>
            {entry.points ?? '-'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyContainer: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
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
    textAlign: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  positionCell: {
    width: 32,
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
    fontWeight: '600',
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
});
