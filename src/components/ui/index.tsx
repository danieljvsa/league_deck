import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useColors } from '@/constants/theme';

export function Loading({ message }: { message?: string }) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
}

export function Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRetry}>
          <Text style={[styles.retryText, { color: '#FFF' }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Empty({ message, actionLabel, onAction }: { 
  message: string; 
  actionLabel?: string; 
  onAction?: () => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={onAction}>
          <Text style={[styles.actionText, { color: '#FFF' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
