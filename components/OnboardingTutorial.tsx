import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { TutorialStage, useTutorialStore } from '@/store/tutorialStore';
import { useThemeStore } from '@/store/themeStore';
import { COLORS, STORAGE_KEYS } from '@/utils/constants';

export function OnboardingTutorial() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadLinks = useLinkStore((s) => s.loadLinks);
  const stage = useTutorialStore((s) => s.stage);
  const setStage = useTutorialStore((s) => s.setStage);
  const resetTutorial = useTutorialStore((s) => s.reset);
  useThemeStore((s) => s.themeId);
  const c = COLORS;

  useEffect(() => {
    let mounted = true;
    const prepare = async () => {
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      if (seen || !mounted) return;
      await Promise.all([loadLinks(), loadCategories()]);
      if (mounted) setStage('ask');
    };
    prepare();
    return () => {
      mounted = false;
    };
  }, [loadCategories, loadLinks, setStage]);

  const finish = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, 'done');
    resetTutorial();
  };

  const startTutorial = () => {
    setStage('paste-link');
  };

  if (stage === 'idle') return null;

  if (stage === 'paste-link' || stage === 'tap-category' || stage === 'pick-category' || stage === 'done') {
    const step = stage as 'paste-link' | 'tap-category' | 'pick-category' | 'done';
    return (
      <View pointerEvents="box-none" style={styles.floatingLayer}>
        <View
          pointerEvents="auto"
          style={[styles.guideBar, { borderColor: c.primary, backgroundColor: c.surface, bottom: Math.max(insets.bottom, 16) + 12 }]}
        >
          <View style={styles.guideTextWrap}>
            <Text style={[styles.guideTitle, { color: c.text }]}>{t(`onboarding.${step}Title` as const)}</Text>
            <Text style={[styles.guideText, { color: c.textMuted }]}>{t(`onboarding.${step}Text` as const)}</Text>
          </View>
          <Pressable style={[styles.guideButton, { backgroundColor: c.primary }]} onPress={finish}>
            <Text style={[styles.guideButtonText, { color: c.onPrimary }]}>{stage === 'done' ? t('onboarding.finish') : t('onboarding.skip')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border, paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>{getTitle(stage, t)}</Text>
            <Pressable onPress={finish} hitSlop={10} style={styles.iconButton}>
              <X size={18} color={c.textMuted} />
            </Pressable>
          </View>

          {stage === 'ask' && (
            <View style={styles.content}>
              <Text style={[styles.body, { color: c.textMuted }]}>{t('onboarding.bodyAsk')}</Text>
              <View style={styles.actions}>
                <Pressable style={[styles.secondaryButton, { borderColor: c.border }, styles.actionButton]} onPress={finish}>
                  <Text style={[styles.secondaryButtonText, { color: c.text }]}>{t('onboarding.skip')}</Text>
                </Pressable>
                <Pressable style={[styles.primaryButton, { backgroundColor: c.primary }, styles.actionButton]} onPress={startTutorial}>
                  <Text style={[styles.primaryButtonText, { color: c.onPrimary }]}>{t('onboarding.next')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

type Translator = (k: string) => string;
function getTitle(step: TutorialStage, t: Translator): string {
  switch (step) {
    case 'ask':
      return t('settings.tutorial');
    case 'paste-link':
    case 'tap-category':
    case 'pick-category':
      return t('categoryPicker.title');
    case 'done':
      return t('onboarding.doneTitle');
    case 'idle':
      return '';
  }
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  sheet: { borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingHorizontal: 16, paddingTop: 14, borderTopWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontSize: 18, fontWeight: '700' },
  iconButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  content: { gap: 16 },
  body: { fontSize: 15, lineHeight: 22 },
  stepBody: { flex: 1, fontSize: 15, lineHeight: 22 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 16 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
  floatingLayer: { ...StyleSheet.absoluteFillObject, zIndex: 20, elevation: 20 },
  guideBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  guideTextWrap: { flex: 1 },
  guideTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  guideText: { fontSize: 13, lineHeight: 18 },
  guideButton: { minHeight: 36, minWidth: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 12 },
  guideButtonText: { fontSize: 13, fontWeight: '700' },
});
