import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDocumentAsync } from 'expo-document-picker';
import { fetchPackage, parsePackageFromString } from '@/core/package/parser';
import { validatePackage } from '@/core/package/validator';
import { installLeaguePackage, installFromJsonString, InstallResult } from '@/core/package/installer';
import { useLeagueStore } from '@/store/leagues';
import { Error } from '@/components/ui';
import { LeaguePackage } from '@/core/package/schema';
import { getProviderMetadata } from '@/providers/registry';
import { useColors } from '@/constants/theme';
import { validateUrl } from '@/core/networking/fetch';

type InputMode = 'url' | 'json' | 'file';

const MAX_URL_LENGTH = 2048;
const MAX_JSON_LENGTH = 1048576; // 1MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const DEBOUNCE_MS = 300;

export default function AddLeagueScreen() {
  const [inputMode, setInputMode] = useState<InputMode>('url');
  const [url, setUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LeaguePackage | null>(null);
  const [previewSource, setPreviewSource] = useState<string | undefined>(undefined);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { loadLeagues } = useLeagueStore();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isSubmitting = useRef(false);

  const handleFetchUrl = async () => {
    if (isSubmitting.current) return;
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (url.trim().length > MAX_URL_LENGTH) {
      setError(`URL is too long (maximum ${MAX_URL_LENGTH} characters)`);
      return;
    }

    if (!validateUrl(url.trim())) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);
    setPreview(null);
    setValidationErrors([]);

    try {
      const result = await fetchPackage(url.trim());

      if (result.success && result.package) {
        const validation = validatePackage(result.package);
        if (validation.valid) {
          setPreview(result.package);
          setPreviewSource(url.trim());
        } else {
          setValidationErrors(validation.errors.map(e => `${e.field}: ${e.message}`));
        }
      } else {
        setError(result.errors?.join('\n') || 'Failed to fetch package');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleParseJson = async () => {
    if (isSubmitting.current) return;
    
    if (!jsonInput.trim()) {
      setError('Please paste JSON content');
      return;
    }

    if (jsonInput.trim().length > MAX_JSON_LENGTH) {
      setError(`JSON content is too large (maximum ${Math.round(MAX_JSON_LENGTH / 1024)}KB)`);
      return;
    }

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);
    setPreview(null);
    setValidationErrors([]);

    try {
      const result = parsePackageFromString(jsonInput.trim());

      if (result.success && result.package) {
        const validation = validatePackage(result.package);
        if (validation.valid) {
          setPreview(result.package);
          setPreviewSource(undefined);
        } else {
          setValidationErrors(validation.errors.map(e => `${e.field}: ${e.message}`));
        }
      } else {
        setError(result.errors?.join('\n') || 'Failed to parse JSON');
      }
    } catch (err) {
      setError('Failed to parse JSON. Please check the format and try again.');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handlePickFile = async () => {
    if (isSubmitting.current) return;
    
    try {
      const result = await getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Check file size if available
      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large (maximum ${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB)`);
        return;
      }

      isSubmitting.current = true;
      setIsLoading(true);
      setError(null);
      setPreview(null);
      setValidationErrors([]);

      // Read the file content with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(file.uri, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const jsonContent = await response.text();
      
      if (jsonContent.length > MAX_JSON_LENGTH) {
        setError(`JSON content is too large (maximum ${Math.round(MAX_JSON_LENGTH / 1024)}KB)`);
        setIsLoading(false);
        isSubmitting.current = false;
        return;
      }
      
      const parseResult = parsePackageFromString(jsonContent);

      if (parseResult.success && parseResult.package) {
        const validation = validatePackage(parseResult.package);
        if (validation.valid) {
          setPreview(parseResult.package);
          setPreviewSource(file.uri);
        } else {
          setValidationErrors(validation.errors.map(e => `${e.field}: ${e.message}`));
        }
      } else {
        setError(parseResult.errors?.join('\n') || 'Failed to parse JSON file');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('File read timed out. Please try a smaller file.');
      } else {
        setError('Failed to read file. Please ensure it is a valid JSON file.');
      }
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleInstall = async () => {
    if (!preview || isSubmitting.current) return;

    isSubmitting.current = true;
    setIsLoading(true);
    setError(null);

    try {
      let result: InstallResult;
      
      if (previewSource && validateUrl(previewSource)) {
        result = await installLeaguePackage(preview, previewSource);
      } else {
        result = await installLeaguePackage(preview);
      }

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
    } catch (err) {
      setError('Installation failed. Please try again.');
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleClear = () => {
    setUrl('');
    setJsonInput('');
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
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.previewTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Package Preview</Text>
        
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <View style={styles.previewHeader}>
            {preview.branding?.logo ? (
              <View style={styles.previewLogoPlaceholder}>
                <Text style={[styles.previewLogoText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>{preview.league.name.charAt(0)}</Text>
              </View>
            ) : (
              <View style={[styles.previewLogoPlaceholder, { backgroundColor: preview.branding?.primaryColor || colors.muted }]}>
                <Text style={[styles.previewLogoText, { color: preview.branding?.primaryColor ? colors.text : colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
                  {preview.league.name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.previewHeaderContent}>
              <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={2} maxFontSizeMultiplier={1.3}>{preview.league.name}</Text>
              <Text style={[styles.previewSport, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {preview.league.sport.charAt(0).toUpperCase() + preview.league.sport.slice(1)}
                {preview.league.country ? ` · ${preview.league.country}` : ''}
              </Text>
            </View>
          </View>
          
          {preview.league.description && (
            <Text style={[styles.previewDescription, { color: colors.textSecondary }]} numberOfLines={3} maxFontSizeMultiplier={1.3}>{preview.league.description}</Text>
          )}
        </View>

        {features.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Enabled Features</Text>
            <View style={styles.featureGrid}>
              {features.map((feature) => (
                <View key={feature} style={[styles.featureChip, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.featureChipText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {providers.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Data Providers</Text>
            {providers.map((provider, index) => (
              <View key={index} style={[styles.providerRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{provider.name}</Text>
                <Text style={[styles.providerType, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{provider.type}</Text>
              </View>
            ))}
          </View>
        )}

        {preview.media?.streams && preview.media.streams.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Live Streams</Text>
            {preview.media.streams.map((stream) => (
              <View key={stream.id} style={[styles.mediaRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.mediaName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{stream.name}</Text>
                <Text style={[styles.mediaProvider, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{stream.provider}</Text>
              </View>
            ))}
          </View>
        )}

        {preview.media?.podcasts && preview.media.podcasts.length > 0 && (
          <View style={[styles.previewSection, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Podcasts</Text>
            {preview.media.podcasts.map((podcast) => (
              <View key={podcast.id} style={[styles.mediaRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.mediaName, { color: colors.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{podcast.name}</Text>
                <Text style={[styles.mediaProvider, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{podcast.provider}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
            onPress={handleClear}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Go back to input"
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.installButton, { backgroundColor: colors.primary }, isLoading && styles.disabledButton]}
            onPress={handleInstall}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={`Install ${preview.league.name}`}
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.installButtonText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Install Package</Text>
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
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Add League</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
        Enter a URL, paste JSON, or pick a file to install a league package.
      </Text>

      {/* Input Mode Selector */}
      <View style={[styles.modeSelector, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'url' && { backgroundColor: colors.primary }]}
          onPress={() => setInputMode('url')}
          accessibilityRole="button"
          accessibilityLabel="Enter URL"
          accessibilityState={{ selected: inputMode === 'url' }}
        >
          <Text style={[styles.modeButtonText, { color: inputMode === 'url' ? colors.text : colors.text }]} maxFontSizeMultiplier={1.3}>URL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'json' && { backgroundColor: colors.primary }]}
          onPress={() => setInputMode('json')}
          accessibilityRole="button"
          accessibilityLabel="Paste JSON"
          accessibilityState={{ selected: inputMode === 'json' }}
        >
          <Text style={[styles.modeButtonText, { color: inputMode === 'json' ? colors.text : colors.text }]} maxFontSizeMultiplier={1.3}>Paste JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'file' && { backgroundColor: colors.primary }]}
          onPress={() => setInputMode('file')}
          accessibilityRole="button"
          accessibilityLabel="Pick file"
          accessibilityState={{ selected: inputMode === 'file' }}
        >
          <Text style={[styles.modeButtonText, { color: inputMode === 'file' ? colors.text : colors.text }]} maxFontSizeMultiplier={1.3}>Pick File</Text>
        </TouchableOpacity>
      </View>

      {/* URL Input */}
      {inputMode === 'url' && (
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>From URL</Text>
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
              onSubmitEditing={handleFetchUrl}
              editable={!isLoading}
              maxLength={MAX_URL_LENGTH}
              accessibilityLabel="League package URL"
            />
            {url.length > 0 && (
              <TouchableOpacity 
                style={[styles.clearButton, { backgroundColor: colors.muted }]} 
                onPress={() => setUrl('')}
                accessibilityRole="button"
                accessibilityLabel="Clear URL"
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.fetchButton, { backgroundColor: colors.primary }, (!url.trim() || isLoading) && styles.disabledButton]}
            onPress={handleFetchUrl}
            disabled={!url.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Fetch package from URL"
            accessibilityState={{ busy: isLoading, disabled: !url.trim() || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.fetchButtonText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Fetch Package</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* JSON Input */}
      {inputMode === 'json' && (
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Or Paste JSON</Text>
          <TextInput
            style={[styles.jsonInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={jsonInput}
            onChangeText={setJsonInput}
            placeholder='{ "schemaVersion": "1.0", "league": { ... } }'
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={8}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            maxLength={MAX_JSON_LENGTH}
            accessibilityLabel="League package JSON content"
          />
          <TouchableOpacity 
            style={[styles.fetchButton, { backgroundColor: colors.primary }, (!jsonInput.trim() || isLoading) && styles.disabledButton]}
            onPress={handleParseJson}
            disabled={!jsonInput.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Parse JSON content"
            accessibilityState={{ busy: isLoading, disabled: !jsonInput.trim() || isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={[styles.fetchButtonText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Parse JSON</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* File Picker */}
      {inputMode === 'file' && (
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Or Pick File</Text>
          <TouchableOpacity 
            style={[styles.filePickerButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handlePickFile}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Choose JSON file"
            accessibilityHint="Opens file picker"
            accessibilityState={{ busy: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Text style={[styles.filePickerIcon, { color: colors.primary }]}>📁</Text>
                <Text style={[styles.filePickerText, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Choose .json File</Text>
                <Text style={[styles.filePickerSubtext, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>Tap to browse (max 5MB)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderLeftColor: colors.danger, borderColor: colors.cardBorder }]} accessibilityRole="alert">
          <Text style={[styles.errorText, { color: colors.danger }]} maxFontSizeMultiplier={1.3}>{error}</Text>
        </View>
      )}

      {validationErrors.length > 0 && (
        <View style={[styles.errorContainer, { backgroundColor: colors.surface, borderLeftColor: colors.danger, borderColor: colors.cardBorder }]} accessibilityRole="alert">
          <Text style={[styles.errorTitle, { color: colors.danger }]} maxFontSizeMultiplier={1.3}>Validation Errors:</Text>
          {validationErrors.map((err, index) => (
            <Text key={index} style={[styles.errorItem, { color: colors.danger }]} maxFontSizeMultiplier={1.3}>• {err}</Text>
          ))}
        </View>
      )}

      {/* Example Packages */}
      <View style={[styles.examplesSection, { borderTopColor: colors.borderLight }]}>
        <Text style={[styles.examplesTitle, { color: colors.text }]} maxFontSizeMultiplier={1.3}>Example Packages</Text>
        <TouchableOpacity 
          style={[styles.exampleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            setInputMode('url');
            setUrl('https://raw.githubusercontent.com/example/league.json');
          }}
          accessibilityRole="button"
          accessibilityLabel="Use Football League example"
        >
          <Text style={[styles.exampleText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>Football League (TheSportsDB)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.exampleButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            setInputMode('url');
            setUrl('https://raw.githubusercontent.com/example/amateur.json');
          }}
          accessibilityRole="button"
          accessibilityLabel="Use Amateur Static League example"
        >
          <Text style={[styles.exampleText, { color: colors.primary }]} maxFontSizeMultiplier={1.3}>Amateur Static League</Text>
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
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 52,
  },
  jsonInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    borderWidth: 1,
    minHeight: 160,
    textAlignVertical: 'top',
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
    minHeight: 52,
  },
  fetchButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  filePickerButton: {
    borderRadius: 12,
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    minHeight: 52,
  },
  filePickerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  filePickerText: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  filePickerSubtext: {
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
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
    letterSpacing: -0.3,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
    borderWidth: 1,
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
    borderWidth: 1,
    minHeight: 52,
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
    minHeight: 52,
  },
  installButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  examplesSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
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
    minHeight: 48,
  },
  exampleText: {
    fontSize: 14,
  },
});
