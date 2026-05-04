import React, {useState, useCallback} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from '../utils/safeArea';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors, fonts, spacing, borderRadius} from '../theme/theme';
import {useTranslation} from 'react-i18next';
import {getMaps} from '../data/localizedData';

const STORAGE_KEY = '@arcc_submissions_v1';

const MARKER_CATEGORIES = [
  {key: 'loot', label: 'Loot / Container', icon: 'package-variant-closed', color: '#FF9800'},
  {key: 'resource', label: 'Resource / Plant', icon: 'leaf', color: '#4CAF50'},
  {key: 'arc-enemy', label: 'ARC Enemy', icon: 'robot-angry', color: '#F44336'},
  {key: 'quest', label: 'Quest Location', icon: 'clipboard-text', color: '#AB47BC'},
  {key: 'key-card', label: 'Key Card', icon: 'key', color: '#FFC107'},
  {key: 'elevator', label: 'Elevator / Hatch', icon: 'elevator', color: '#607D8B'},
  {key: 'field-depot', label: 'Field Depot', icon: 'store', color: '#2196F3'},
  {key: 'metro', label: 'Metro / Entrance', icon: 'tunnel', color: '#00BCD4'},
  {key: 'spawn', label: 'Spawn Point', icon: 'map-marker-plus', color: '#66BB6A'},
  {key: 'other', label: 'Other', icon: 'dots-horizontal', color: '#9E9E9E'},
];

const REPORT_TYPES = [
  {key: 'wrong-location', label: 'Wrong Location', icon: 'map-marker-off'},
  {key: 'outdated', label: 'Outdated Info', icon: 'update'},
  {key: 'duplicate', label: 'Duplicate Marker', icon: 'content-copy'},
  {key: 'other', label: 'Other Issue', icon: 'alert-circle'},
];

type SubmitMode = null | 'add-location' | 'report-issue' | 'suggest-item';

const SubmitScreen = ({navigation}: any) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const maps = getMaps();
  const [mode, setMode] = useState<SubmitMode>(null);

  // Add Location form
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [locationDesc, setLocationDesc] = useState('');

  // Report form
  const [reportType, setReportType] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState('');

  // Suggest Item form
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemDetails, setItemDetails] = useState('');

  const resetForms = () => {
    setSelectedMap(null);
    setSelectedCategory(null);
    setLocationName('');
    setLocationDesc('');
    setReportType(null);
    setReportDetails('');
    setItemName('');
    setItemType('');
    setItemDetails('');
  };

  const submitForm = useCallback(async () => {
    let submission: any = {id: Date.now(), type: mode, createdAt: new Date().toISOString()};

    if (mode === 'add-location') {
      if (!selectedMap || !selectedCategory || !locationName.trim()) {
        Alert.alert(t('submit.missingInfo'), t('submit.missingLocationInfo'));
        return;
      }
      submission = {...submission, map: selectedMap, category: selectedCategory, name: locationName, description: locationDesc};
    } else if (mode === 'report-issue') {
      if (!reportType || !reportDetails.trim()) {
        Alert.alert(t('submit.missingInfo'), t('submit.missingReportInfo'));
        return;
      }
      submission = {...submission, reportType, details: reportDetails};
    } else if (mode === 'suggest-item') {
      if (!itemName.trim()) {
        Alert.alert(t('submit.missingInfo'), t('submit.missingItemInfo'));
        return;
      }
      submission = {...submission, itemName, itemType, details: itemDetails};
    }

    // Save locally
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    existing.push(submission);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    Alert.alert(
      t('submit.submitted'),
      t('submit.submittedMessage'),
      [{text: t('common.ok'), onPress: () => { setMode(null); resetForms(); }}],
    );
  }, [mode, selectedMap, selectedCategory, locationName, locationDesc, reportType, reportDetails, itemName, itemType, itemDetails]);

  const renderMainMenu = () => (
    <View style={styles.content}>
      {/* Add Location */}
      <TouchableOpacity style={styles.optionCard} activeOpacity={0.7} onPress={() => setMode('add-location')}>
        <View style={[styles.optionIconWrap, {backgroundColor: colors.cyan + '18'}]}>
          <Icon name="map-marker-plus-outline" size={32} color={colors.cyan} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>{t('submit.addLocation')}</Text>
          <Text style={styles.optionDesc}>{t('submit.addLocationDesc')}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Report Issue */}
      <TouchableOpacity style={styles.optionCard} activeOpacity={0.7} onPress={() => setMode('report-issue')}>
        <View style={[styles.optionIconWrap, {backgroundColor: colors.red + '18'}]}>
          <Icon name="flag-outline" size={32} color={colors.red} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>{t('submit.reportIssue')}</Text>
          <Text style={styles.optionDesc}>{t('submit.reportIssueDesc')}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      {/* Suggest Item */}
      <TouchableOpacity style={styles.optionCard} activeOpacity={0.7} onPress={() => setMode('suggest-item')}>
        <View style={[styles.optionIconWrap, {backgroundColor: colors.cyan + '18'}]}>
          <Icon name="plus-box-outline" size={32} color={colors.cyan} />
        </View>
        <View style={styles.optionInfo}>
          <Text style={styles.optionTitle}>{t('submit.suggestItem')}</Text>
          <Text style={styles.optionDesc}>{t('submit.suggestItemDesc')}</Text>
        </View>
        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );

  const renderAddLocation = () => (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
      {/* Map Select */}
      <Text style={styles.formLabel}>{t('submit.selectMap')}</Text>
      <View style={styles.mapGrid}>
        {maps.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.mapChip, selectedMap === m.id && {backgroundColor: m.accentColor + '25', borderColor: m.accentColor}]}
            onPress={() => setSelectedMap(m.id)}>
            {selectedMap === m.id && <Icon name="check" size={12} color={m.accentColor} />}
            <Text style={[styles.mapChipText, selectedMap === m.id && {color: m.accentColor}]}>
              {m.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Select */}
      <Text style={styles.formLabel}>{t('submit.markerCategory')}</Text>
      <View style={styles.categoryGrid}>
        {MARKER_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catChip, selectedCategory === cat.key && {backgroundColor: cat.color + '20', borderColor: cat.color}]}
            onPress={() => setSelectedCategory(cat.key)}>
            <Icon name={cat.icon} size={16} color={selectedCategory === cat.key ? cat.color : colors.textMuted} />
            <Text style={[styles.catText, selectedCategory === cat.key && {color: cat.color}]}>{t('submit.categories.' + cat.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Name */}
      <Text style={styles.formLabel}>{t('submit.locationName')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('submit.locationNamePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={locationName}
        onChangeText={setLocationName}
      />

      {/* Description */}
      <Text style={styles.formLabel}>{t('submit.descriptionOptional')}</Text>
      <TextInput
        style={[styles.textInput, {height: 80, textAlignVertical: 'top'}]}
        placeholder={t('submit.descriptionPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={locationDesc}
        onChangeText={setLocationDesc}
        multiline
      />

      <TouchableOpacity style={styles.submitBtn} onPress={submitForm}>
        <Icon name="send" size={18} color={colors.textInverse} />
        <Text style={styles.submitBtnText}>{t('submit.submitLocation')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderReportIssue = () => (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.formLabel}>{t('submit.issueType')}</Text>
      <View style={styles.categoryGrid}>
        {REPORT_TYPES.map(r => (
          <TouchableOpacity
            key={r.key}
            style={[styles.catChip, reportType === r.key && {backgroundColor: colors.red + '20', borderColor: colors.red}]}
            onPress={() => setReportType(r.key)}>
            <Icon name={r.icon} size={16} color={reportType === r.key ? colors.red : colors.textMuted} />
            <Text style={[styles.catText, reportType === r.key && {color: colors.red}]}>{t('submit.reportTypes.' + r.key)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.formLabel}>{t('submit.details')}</Text>
      <TextInput
        style={[styles.textInput, {height: 100, textAlignVertical: 'top'}]}
        placeholder={t('submit.detailsPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={reportDetails}
        onChangeText={setReportDetails}
        multiline
      />

      <TouchableOpacity style={[styles.submitBtn, {backgroundColor: colors.red}]} onPress={submitForm}>
        <Icon name="flag" size={18} color={colors.textInverse} />
        <Text style={styles.submitBtnText}>{t('submit.submitReport')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSuggestItem = () => (
    <ScrollView contentContainerStyle={styles.formContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.formLabel}>{t('submit.itemName')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('submit.itemNamePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.formLabel}>{t('submit.itemType')}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={t('submit.itemTypePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={itemType}
        onChangeText={setItemType}
      />

      <Text style={styles.formLabel}>{t('submit.additionalDetails')}</Text>
      <TextInput
        style={[styles.textInput, {height: 100, textAlignVertical: 'top'}]}
        placeholder={t('submit.additionalDetailsPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={itemDetails}
        onChangeText={setItemDetails}
        multiline
      />

      <TouchableOpacity style={[styles.submitBtn, {backgroundColor: colors.cyan}]} onPress={submitForm}>
        <Icon name="plus-circle" size={18} color={colors.textInverse} />
        <Text style={styles.submitBtnText}>{t('submit.submitItem')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, {paddingTop: insets.top}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={Platform.OS === 'android'} />

      <View style={styles.header}>
        {mode ? (
          <TouchableOpacity
            onPress={() => {setMode(null); resetForms();}}
            style={styles.backBtn}>
            <Icon name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.headerIconWrap}>
          <Icon name="send" size={18} color={colors.cyan} />
        </View>
        <View>
          <Text style={styles.headerTitle}>
            {mode === 'add-location' ? t('submit.addLocation') :
             mode === 'report-issue' ? t('submit.reportIssue') :
             mode === 'suggest-item' ? t('submit.suggestItem') : t('submit.title')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {mode ? t('submit.fillDetails') : t('submit.contributeData')}
          </Text>
        </View>
      </View>

      {!mode && renderMainMenu()}
      {mode === 'add-location' && renderAddLocation()}
      {mode === 'report-issue' && renderReportIssue()}
      {mode === 'suggest-item' && renderSuggestItem()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'transparent'},
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {fontSize: fonts.sizes.xxl, fontWeight: '700', color: colors.textPrimary},
  headerSubtitle: {fontSize: fonts.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs},
  content: {paddingHorizontal: spacing.lg, gap: spacing.sm},
  formContent: {paddingHorizontal: spacing.xl, paddingBottom: 100},

  // Option cards
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg,
  },
  optionIconWrap: {
    width: 56, height: 56, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.lg,
  },
  optionInfo: {flex: 1, marginRight: spacing.sm},
  optionTitle: {fontSize: fonts.sizes.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs},
  optionDesc: {fontSize: fonts.sizes.sm, color: colors.textSecondary, lineHeight: 18},

  // Form labels
  formLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textMuted,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },

  // Map grid
  mapGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  mapChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  mapChipText: {fontSize: 12, fontWeight: '600', color: colors.textMuted},

  // Category grid
  categoryGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs},
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  catText: {fontSize: 11, fontWeight: '600', color: colors.textMuted},

  // Text inputs
  textInput: {
    backgroundColor: colors.bgCard, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.textPrimary, fontSize: fonts.sizes.md,
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, backgroundColor: colors.cyan,
    paddingVertical: spacing.lg, borderRadius: borderRadius.md,
    marginTop: spacing.xxl,
  },
  submitBtnText: {fontSize: fonts.sizes.md, fontWeight: '800', color: colors.textInverse},
});

export default SubmitScreen;
