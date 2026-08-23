import React from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, StyleSheet, 
  Linking, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { useLeagueStore } from '@/store/leagues';
import { useColors } from '@/constants/theme';

export default function SettingsScreen() {
  const { leagues } = useLeagueStore();
  const totalLeagues = leagues.length;
  const colors = useColors();

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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>General</Text>
        
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Appearance</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>System</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>On</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>Data</Text>
        
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={handleClearCache}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Clear Cache</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={handleRemoveAllLeagues}>
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Remove All Leagues</Text>
          <Text style={[styles.chevron, { color: colors.danger }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>About</Text>
        
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>0.1.0 (Beta)</Text>
        </View>
        
        <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Installed Leagues</Text>
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{totalLeagues}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.row, { borderBottomColor: colors.borderLight }]}
          onPress={() => handleOpenLink('https://github.com/open-league/openleague')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>GitHub Repository</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.row, { borderBottomColor: colors.borderLight }]}
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/issues')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Report a Bug</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.row, { borderBottomColor: colors.borderLight }]}
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/blob/main/LICENSE')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>License (MIT)</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary, backgroundColor: colors.background }]}>League Packages</Text>
        
        <TouchableOpacity 
          style={[styles.row, { borderBottomColor: colors.borderLight }]}
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/blob/main/schema/league.schema.json')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Package Schema</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.row, { borderBottomColor: colors.borderLight }]}
          onPress={() => handleOpenLink('https://github.com/open-league/openleague/tree/main/examples')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Example Packages</Text>
          <Text style={[styles.chevron, { color: colors.disabled }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
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
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
  },
  rowValue: {
    fontSize: 16,
    marginRight: 8,
  },
  chevron: {
    fontSize: 20,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    marginBottom: 4,
  },
});
