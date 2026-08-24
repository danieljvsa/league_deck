import React from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  Linking, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLeagueStore } from '@/store/leagues';
import { useColors } from '@/constants/theme';

interface SettingsRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  destructive?: boolean;
  colors: ReturnType<typeof useColors>;
}

function SettingsRow({ label, value, icon, onPress, destructive = false, colors }: SettingsRowProps) {
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.dangerLight : colors.primaryLight }]}>
        <Ionicons 
          name={icon || 'chevron-forward'} 
          size={18} 
          color={destructive ? colors.danger : colors.primary} 
        />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.danger : colors.text }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value && (
          <Text style={[styles.rowValue, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.row, { borderBottomColor: colors.borderLight }]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}${destructive ? ', destructive action' : ''}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      {content}
    </View>
  );
}

export default function SettingsScreen() {
  const { leagues } = useLeagueStore();
  const totalLeagues = leagues.length;
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data but keep your installed leagues.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Done', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  const handleRemoveAllLeagues = () => {
    Alert.alert(
      'Remove All Leagues',
      'This will remove all installed leagues. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove All', 
          style: 'destructive',
          onPress: async () => {
            for (const league of leagues) {
              await useLeagueStore.getState().removeLeague(league.id);
            }
            Alert.alert('Done', 'All leagues removed');
          }
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Customize your experience
        </Text>
      </View>

      {/* General Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>General</Text>
        
        <SettingsRow
          label="Appearance"
          value="System"
          icon="color-palette-outline"
          colors={colors}
        />
        
        <SettingsRow
          label="Notifications"
          value="On"
          icon="notifications-outline"
          colors={colors}
        />
      </View>

      {/* Data Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Data</Text>
        
        <SettingsRow
          label="Clear Cache"
          icon="trash-outline"
          onPress={handleClearCache}
          colors={colors}
        />
        
        <SettingsRow
          label="Remove All Leagues"
          icon="warning-outline"
          onPress={handleRemoveAllLeagues}
          destructive
          colors={colors}
        />
      </View>

      {/* About Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>About</Text>
        
        <SettingsRow
          label="Version"
          value="0.1.0 (Beta)"
          icon="information-circle-outline"
          colors={colors}
        />
        
        <SettingsRow
          label="Installed Leagues"
          value={String(totalLeagues)}
          icon="trophy-outline"
          colors={colors}
        />
        
        <SettingsRow
          label="GitHub Repository"
          icon="logo-github"
          onPress={() => handleOpenLink('https://github.com/open-league/openleague')}
          colors={colors}
        />
        
        <SettingsRow
          label="Report a Bug"
          icon="bug-outline"
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/issues')}
          colors={colors}
        />
        
        <SettingsRow
          label="License (MIT)"
          icon="document-text-outline"
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/blob/main/LICENSE')}
          colors={colors}
        />
      </View>

      {/* League Packages Section */}
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>League Packages</Text>
        
        <SettingsRow
          label="Package Schema"
          icon="code-outline"
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/blob/main/schema/league.schema.json')}
          colors={colors}
        />
        
        <SettingsRow
          label="Example Packages"
          icon="folder-outline"
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/tree/main/examples')}
          colors={colors}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="football-outline" size={32} color={colors.primary} />
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          OpenLeague is an open-source project
        </Text>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Built with Expo & React Native
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 14,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
});
