import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useColors } from '@/constants/theme';

export interface FilterTab {
  id: string;
  label: string;
  icon?: string;
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

export const FilterTabs = React.memo(function FilterTabs({ tabs, activeTab, onTabPress }: FilterTabsProps) {
  const colors = useColors();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab, 
              { 
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.cardBorder,
              }
            ]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} filter`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.text : colors.text }
              ]}
              maxFontSizeMultiplier={1.3}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
