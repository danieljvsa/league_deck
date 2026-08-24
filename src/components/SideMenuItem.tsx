import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/constants/theme';

interface SideMenuItemProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
  destructive?: boolean;
}

export const SideMenuItem = React.memo(function SideMenuItem({ label, icon, onPress, badge, destructive = false }: SideMenuItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}${badge && badge > 0 ? `, ${badge} new` : ''}${destructive ? ', destructive action' : ''}`}
      accessibilityHint={destructive ? 'This action cannot be undone' : undefined}
    >
      <View style={[styles.iconContainer, { backgroundColor: destructive ? colors.dangerLight : colors.primaryLight }]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={destructive ? colors.danger : colors.primary} 
        />
      </View>
      
      <Text style={[styles.label, { color: destructive ? colors.danger : colors.text }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      
      <View style={styles.rightSection}>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
