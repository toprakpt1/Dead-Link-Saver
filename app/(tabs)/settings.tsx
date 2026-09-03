import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Columns2, Columns3, AlignJustify, Trash2, Plus, RotateCw, Crown, ShieldCheck, RotateCcw, Palette, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { CardSize } from '@/store/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useEntitlementStore } from '@/store/entitlementStore';
import { useThemeStore } from '@/store/themeStore';
import { themes, type ThemeId } from '@/theme/themes';
import { STORAGE_KEYS } from '@/utils/constants';
import { changeLocale, type AppLocale } from '@/utils/i18n';
import { hapticDelete } from '@/utils/haptics';
import { BackupSection } from '@/components/BackupSection';
import { RewardedGate } from '@/components/RewardedGate';
import { PaywallSheet } from '@/components/PaywallSheet';

const SIZES: { key: CardSize; label: string; icon: typeof Columns2 }[] = [
  { key: 'small', label: 'Small', icon: Columns3 },
  { key: 'medium', label: 'Medium', icon: Columns2 },
  { key: 'large', label: 'Large', icon: AlignJustify },
];

const THEME_OPTIONS: { id: ThemeId; labelKey: string }[] = [
  { id: 'midnight', labelKey: 'settings.themeMidnight' },
  { id: 'paper', labelKey: 'settings.themePaper' },
  { id: 'graphite', labelKey: 'settings.themeGraphite' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { cardSize, setCardSize, loadSettings, loaded } = useSettingsStore();
  const { categories, loadCategories, addCategory, removeCategory } = useCategoryStore();
  const [newName, setNewName] = useState('');
  const isPro = useEntitlementStore((s) => s.isPro);
  const initEntitlement = useEntitlementStore((s) => s.init);
  const restorePurchases = useEntitlementStore((s) => s.restorePurchases);
  const { themeId, setTheme, theme } = useThemeStore();
  const c = theme.colors;
  const [gateVisible, setGateVisible] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (!loaded) loadSettings();
    loadCategories();
    void initEntitlement();
  }, []);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addCategory(name);
    setNewName('');
  };

  const handleRemove = (id: string, name: string) => {
    if (id === 'random') return;
    const links = useLinkStore.getState().links;
    const linksInCategory = links.filter((l) => l.category === id);
    if (linksInCategory.length === 0) {
      removeCategory(id);
      return;
    }
    const linkIds = linksInCategory.map((l) => l.id);
    Alert.alert(
      t('settings.deleteCategoryTitle'),
      t('settings.deleteCategoryBody', { name, count: linksInCategory.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteCategoryMove'),
          onPress: () => {
            useLinkStore.getState().batchUpdateCategory(linkIds, 'random');
            removeCategory(id);
          },
        },
        {
          text: t('settings.deleteCategoryDeleteLinks'),
          style: 'destructive',
          onPress: () => {
            hapticDelete();
            useLinkStore.getState().batchDelete(linkIds);
            removeCategory(id);
          },
        },
      ]
    );
  };

  const handleReplayTutorial = async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING);
    const { reset, setStage } = useTutorialStore.getState();
    reset();
    router.replace('/(tabs)');
    setStage('ask');
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const ok = await restorePurchases();
      Alert.alert(ok ? t('settings.restoreSuccessTitle') : t('settings.restoreNotFoundTitle'), ok ? t('settings.restoreSuccessBody') : t('settings.restoreNotFoundBody'));
    } finally {
      setRestoring(false);
    }
  };

  const handleToggleProMock = async () => {
    if (isPro) {
      Alert.alert(t('settings.proActiveAlertTitle'), t('settings.proActiveAlertBody'), [
        { text: t('settings.proActiveAlertCancel'), style: 'cancel' },
        {
          text: t('settings.proActiveAlertReset'),
          style: 'destructive',
          onPress: async () => {
            await useEntitlementStore.getState().setPro(false);
          },
        },
      ]);
    } else {
      setPaywallVisible(true);
    }
  };

  const handleLocaleChange = async (locale: AppLocale) => {
    await changeLocale(locale);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>
      <Pressable onPress={handleToggleProMock} style={[styles.proCard, { backgroundColor: c.surface, borderColor: isPro ? c.success : c.border }, isPro && { borderColor: c.success, backgroundColor: theme.isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4' }]}>
        <View style={styles.proCardHeader}>
          <View style={[styles.proIcon, { backgroundColor: isPro ? c.success : c.primaryMuted }]}>
            {isPro ? <ShieldCheck size={20} color="#fff" /> : <Crown size={20} color={c.primary} />}
          </View>
          <View style={styles.proTextWrap}>
            <Text style={[styles.proTitle, { color: c.text }]}>{isPro ? t('settings.proTitleActive') : t('settings.proTitle')}</Text>
            <Text style={[styles.proSub, { color: c.textMuted }]}>{isPro ? t('settings.proSubActive') : t('settings.proSub')}</Text>
          </View>
          {!isPro && (
            <View style={[styles.proBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        {!isPro ? (
          <>
            <View style={styles.proBullets}>
              <Text style={[styles.proBullet, { color: c.textMuted }]}>• {t('settings.proBullets.0')}</Text>
              <Text style={[styles.proBullet, { color: c.textMuted }]}>• {t('settings.proBullets.1')}</Text>
              <Text style={[styles.proBullet, { color: c.textMuted }]}>• {t('settings.proBullets.2')}</Text>
            </View>
            <View style={[styles.proCtaBtn, { backgroundColor: c.primary }]}>
              <Crown size={16} color="#fff" />
              <Text style={styles.proCtaText}>{t('settings.proCta')}</Text>
            </View>
          </>
        ) : (
          <Text style={[styles.proActiveNote, { color: c.success }]}>{t('settings.proActiveNote')}</Text>
        )}
      </Pressable>

      {!isPro && (
        <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreRow}>
          {restoring ? <ActivityIndicator size="small" color={c.textMuted} /> : <RotateCcw size={14} color={c.textMuted} />}
          <Text style={[styles.restoreText, { color: c.textMuted }]}>{t('settings.restore')}</Text>
        </Pressable>
      )}

      <BackupSection onNeedGate={() => setGateVisible(true)} onNeedPro={() => setPaywallVisible(true)} />

      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.sectionHeader}>
          <Palette size={18} color={c.primary} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('settings.appearance')}</Text>
        </View>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('settings.appearanceDesc')}</Text>
        <View style={styles.options}>
          {THEME_OPTIONS.map(({ id, labelKey }) => {
            const selected = themeId === id;
            const th = themes[id];
            return (
              <Pressable
                key={id}
                onPress={() => setTheme(id)}
                style={[
                  styles.themeOption,
                  { backgroundColor: c.background, borderColor: c.border },
                  selected && { borderColor: th.colors.primary, backgroundColor: th.colors.primaryMuted },
                ]}
              >
                <View style={[styles.themePreview, { backgroundColor: th.colors.background, borderColor: th.colors.border }]}>
                  <View style={[styles.themePreviewSurface, { backgroundColor: th.colors.surface }]} />
                  <View style={[styles.themePreviewAccent, { backgroundColor: th.colors.primary }]} />
                </View>
                <Text style={[styles.optionLabel, { color: c.textMuted }, selected && { color: th.colors.primary }]}>{t(labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.sectionHeader}>
          <Languages size={18} color={c.primary} />
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('settings.language')}</Text>
        </View>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('settings.languageDesc')}</Text>
        <View style={styles.options}>
          {(['en', 'tr'] as AppLocale[]).map((loc) => {
            const selected = i18n.language === loc;
            return (
              <Pressable
                key={loc}
                onPress={() => handleLocaleChange(loc)}
                style={[styles.option, { backgroundColor: c.background, borderColor: c.border }, selected && { borderColor: c.primary, backgroundColor: c.primaryMuted }]}
              >
                <Text style={[styles.optionLabel, { color: c.textMuted }, selected && { color: c.primary }]}>{loc === 'en' ? t('settings.languageEn') : t('settings.languageTr')}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t('settings.cardSize')}</Text>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('settings.cardSizeDesc')}</Text>
        <View style={styles.options}>
          {SIZES.map(({ key, label, icon: Icon }) => {
            const selected = cardSize === key;
            return (
              <Pressable key={key} style={[styles.option, { backgroundColor: c.background, borderColor: c.border }, selected && { borderColor: c.primary, backgroundColor: c.primaryMuted }]} onPress={() => setCardSize(key)}>
                <Icon size={20} color={selected ? c.primary : c.textMuted} />
                <Text style={[styles.optionLabel, { color: c.textMuted }, selected && { color: c.primary }]}>{t(`settings.cardSize${label}` as any)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t('settings.categories')}</Text>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('settings.categoriesDesc')}</Text>
        <View style={styles.addRow}>
          <TextInput
            style={[styles.addInput, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
            placeholder={t('settings.newCategoryPlaceholder')}
            placeholderTextColor={c.textMuted}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
          />
          <Pressable style={[styles.addButton, { backgroundColor: c.primary }]} onPress={handleAdd}>
            <Plus size={18} color={c.onPrimary} />
          </Pressable>
        </View>
        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <View key={cat.id} style={[styles.categoryRow, { backgroundColor: c.background, borderColor: c.border }]}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <Text style={[styles.categoryName, { color: c.text }]}>{cat.name}</Text>
              {cat.id !== 'random' && (
                <Pressable onPress={() => handleRemove(cat.id, cat.name)} style={styles.deleteButton}>
                  <Trash2 size={16} color={c.textMuted} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>{t('settings.tutorial')}</Text>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>{t('settings.tutorialDesc')}</Text>
        <Pressable style={[styles.replayButton, { borderColor: c.primary }]} onPress={handleReplayTutorial}>
          <RotateCw size={16} color={c.primary} />
          <Text style={[styles.replayButtonText, { color: c.primary }]}>{t('settings.showTutorial')}</Text>
        </Pressable>
      </View>

      <RewardedGate
        visible={gateVisible}
        type="backup"
        onClose={() => setGateVisible(false)}
        onRewarded={() => setGateVisible(false)}
        onGoPro={() => {
          setGateVisible(false);
          setPaywallVisible(true);
        }}
      />
      <PaywallSheet visible={paywallVisible} onClose={() => setPaywallVisible(false)} feature="backup" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  proCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  proCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  proIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTextWrap: { flex: 1, gap: 2 },
  proTitle: { fontSize: 16, fontWeight: '800' },
  proSub: { fontSize: 12, lineHeight: 16 },
  proBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  proBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  proBullets: { gap: 4, paddingLeft: 4 },
  proBullet: { fontSize: 13, lineHeight: 18 },
  proCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  proCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  proActiveNote: { fontSize: 13, lineHeight: 18 },
  restoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
  },
  restoreText: { fontSize: 12 },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 13 },
  options: { flexDirection: 'row', gap: 8, marginTop: 8 },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themePreview: {
    width: 56,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  themePreviewSurface: { flex: 1, margin: 4, borderRadius: 4 },
  themePreviewAccent: { width: 8 },
  optionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: { gap: 6, marginTop: 8 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  categoryName: { flex: 1, fontSize: 15, fontWeight: '500' },
  deleteButton: { padding: 6 },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  replayButtonText: { fontSize: 14, fontWeight: '600' },
});
