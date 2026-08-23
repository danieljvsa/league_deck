import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchPackage, parsePackage } from '@/core/package/parser';
import { validatePackage } from '@/core/package/validator';
import { installLeaguePackage, InstallResult } from '@/core/package/installer';
import { useLeagueStore } from '@/store/leagues';
import { Error } from '@/components/ui';
import { LeaguePackage } from '@/core/package/schema';
import { getProviderMetadata } from '@/providers/registry';
import { useColors } from '@/constants/theme';
import { validateUrl } from '@/core/networking/fetch';

export default function AddLeagueScreen() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LeaguePackage | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { loadLeagues } = useLeagueStore();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);
    setValidationErrors([]);

    const result = await fetchPackage(url.trim());

    if (result.success && result.package) {
      const validation = validatePackage(result.package);
      if (validation.valid) {
        setPreview(result.package);
      } else {
        setValidationErrors(validation.errors.map(e => `${e.field}: ${e.message}`));
      }
    } else {
      setError(result.errors?.join('\n') || 'Failed to fetch package');
    }

    setIsLoading(false);
  };

  const handleInstall = async () => {
    if (!preview) return;

    setIsLoading(true);
    setError(null);

    const result: InstallResult = await installLeaguePackage(preview, url.trim());

    if (result.success) {
      await loadLeagues();
      Alert.alert(
        'Success',
        `${preview.league.name} has been installed!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      setError(result.errors?.join('\n') || 'Installation failed');
    }

    setIsLoading(false);
  };

  const handleClear = () => {
    setUrl('');
    setPreview(null);
    setError(null);
    setValidationErrors([]);
  };

  const getProviderList = (pkg: LeaguePackage) => {
    const providers: Array<{ name: string; type: string; capabilities: string[] }> = [];
    
    if (pkg.providers) {
      for (const [key, config] of Object.entries(pkg.providers)) {
        const metadata = getProviderMetadata(config.type);
        providers.push({
          name: metadata?.name || config.type,
          type: config.type,
          capabilities: [key],
        });
      }
    }
    
    return providers;
  };

  const getEnabledFeatures = (pkg: LeaguePackage) => {
    const features: string[] = [];
    
    if (pkg.events || pkg.providers?.events) features.push('Events');
    if (pkg.participants || pkg.providers?.participants) features.push('Participants');
    if (pkg.providers?.standings) features.push('Standings');
    if (pkg.providers?.live) features.push('Live Scores');
    if (pkg.media?.streams && pkg.media.streams.length > 0) features.push('Live Streams');
    if (pkg.media?.podcasts && pkg.media.podcasts.length > 0) features.push('Podcasts');
    if (pkg.news && pkg.news.length > 0) features.push('News');
    
    return features;
  };

  if (preview) {
    const providers = getProviderList(preview);
    const features = getEnabledFeatures(preview);

    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.previewTitle, { color: colors.text }]}>Package Preview</Text>
        
        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <View style={styles.previewHeader}>
            {preview.branding?.logo ? (
              <View style={styles.previewLogoPlaceholder}>
                <Text style={[styles.previewLogoText, { color: colors.text }]}>{preview.league.name.charAt(0)}</Text>
              </View>
            ) : (
              <View style={[styles.previewLogoPlaceholder, { backgroundColor: preview.branding?.primaryColor || colors.muted }]}>
                <Text style={[styles.previewLogoText, { color: preview.branding?.primaryColor ? '#FFF' : colors.textSecondary }]}>
                  {preview.league.name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.previewHeaderContent}>
              <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={2}>{preview.league.name}</Text>
              <Text style={[styles.previewSport, { color: colors.textSecondary }]} numberOfLines={1}>
                {preview.league.sport.charAt(0).toUpperCase() + preview.league.sport.slice(1)}
                {preview.league.country ? ` · ${preview.league.country}` : ''}
              </Text>
            </View>
          </View>
          
          {preview.league.description && (
            <Text style={[styles.previewDescription, { color: colors.textSecondary }]} numberOfLines={3}>{preview.league.description}</Text>
          )}
        </View>

        {features.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Enabled Features</Text>
            <View style={styles.featureGrid}>
              {features.map((feature) => (
                <View key={feature} style={[styles.featureChip, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.featureChipText, { color: colors.primary }]}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {providers.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Providers</Text>
            {providers.map((provider, index) => (
              <View key={index} style={[styles.providerRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>{provider.name}</Text>
                <Text style={[styles.providerType, { color: colors.textSecondary }]} numberOfLines={1}>{provider.type}</Text>
              </View>
            ))}
          </View>
        )}

        {preview.media?.streams && preview.media.streams.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Live Streams</Text>
            {preview.media.streams.map((stream) => (
              <View key={stream.id} style={[styles.mediaRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.mediaName, { color: colors.text }]} numberOfLines={1}>{stream.name}</Text>
                <Text style={[styles.mediaProvider, { color: colors.textSecondary }]} numberOfLines={1}>{stream.provider}</Text>
              </View>
            ))}
          </View>
        )}

        {preview.media?.podcasts && preview.media.podcasts.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Podcasts</Text>
            {preview.media.podcasts.map((podcast) => (
              <View key={podcast.id} style={[styles.mediaRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.mediaName, { color: colors.text }]} numberOfLines={1}>{podcast.name}</Text>
                <Text style={[styles.mediaProvider, { color: colors.textSecondary }]} numberOfLines={1}>{podcast.provider}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.muted }]}
            onPress={handleClear}
            disabled={isLoading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.installButton, { backgroundColor: colors.success }, isLoading && styles.disabledButton]}
            onPress={handleInstall}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.installButtonText, { color: '#FFF' }]}>Install Package</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 44}
    >
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text }]}>Add League</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter the URL of a league.json package to install
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com/league.json"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleFetch}
          editable={!isLoading}
        />
        {url.length > 0 && (
          <TouchableOpacity style={[styles.clearButton, { backgroundColor: colors.muted }]} onPress={handleClear}>
            <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderLeftColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {validationErrors.length > 0 && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderLeftColor: colors.danger }]}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Validation Errors:</Text>
          {validationErrors.map((err, index) => (
            <Text key={index} style={[styles.errorItem, { color: colors.danger }]}>• {err}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={[styles.fetchButton, { backgroundColor: colors.primary }, (!url.trim() || isLoading) && styles.disabledButton]}
        onPress={handleFetch}
        disabled={!url.trim() || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={[styles.fetchButtonText, { color: '#FFF' }]}>Fetch Package</Text>
        )}
      </TouchableOpacity>

      <View style={styles.examplesSection}>
        <Text style={[styles.examplesTitle, { color: colors.text }]}>Example Packages</Text>
        <TouchableOpacity 
          style={[styles.exampleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setUrl('https://raw.githubusercontent.com/example/league.json')}
        >
          <Text style={[styles.exampleText, { color: colors.primary }]}>Football League (TheSportsDB)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.exampleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setUrl('https://raw.githubusercontent.com/example/amateur.json')}
        >
          <Text style={[styles.exampleText, { color: colors.primary }]}>Amateur Static League</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
  },
  fetchButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  fetchButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorItem: {
    fontSize: 13,
    marginBottom: 4,
  },
  previewTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  previewLogoText: {
    fontSize: 26,
    fontWeight: '700',
  },
  previewHeaderContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewSport: {
    fontSize: 15,
  },
  previewDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  providerName: {
    fontSize: 15,
  },
  providerType: {
    fontSize: 13,
  },
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  mediaName: {
    fontSize: 15,
    flex: 1,
  },
  mediaProvider: {
    fontSize: 13,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  installButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  installButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  examplesSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  examplesTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },
  exampleButton: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  exampleText: {
    fontSize: 14,
  },
});
