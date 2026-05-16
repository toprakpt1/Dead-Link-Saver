import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookmarkPlus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLinkStore } from '@/store/linkStore';
import { useCategoryStore } from '@/store/categoryStore';
import { TutorialStage, useTutorialStore } from '@/store/tutorialStore';
import { COLORS, STORAGE_KEYS } from '@/utils/constants';

export function OnboardingTutorial() {
  const insets = useSafeAreaInsets();
  const loadCategories = useCategoryStore((s) => s.loadCategories);
  const loadLinks = useLinkStore((s) => s.loadLinks);
  const addSampleLink = useLinkStore((s) => s.addSampleLink);
  const stage = useTutorialStore((s) => s.stage);
  const setStage = useTutorialStore((s) => s.setStage);
  const setSampleLinkId = useTutorialStore((s) => s.setSampleLinkId);
  const resetTutorial = useTutorialStore((s) => s.reset);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      const seen = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING);
      if (seen || !mounted) return;

      await Promise.all([loadLinks(), loadCategories()]);
      if (mounted) {
        setStage('ask');
      }
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
    setStage('add-link');
  };

  const addExample = async () => {
    const link = await addSampleLink();
    setSampleLinkId(link.id);
    setStage('tap-category');
  };

  if (stage === 'idle') {
    return null;
  }

  if (stage === 'tap-category' || stage === 'pick-category' || stage === 'done') {
    return (
      <View pointerEvents="box-none" style={styles.floatingLayer}>
        <View
          pointerEvents="auto"
          style={[styles.guideBar, { bottom: Math.max(insets.bottom, 16) + 12 }]}
        >
          <View style={styles.guideTextWrap}>
            {stage === 'tap-category' && (
              <>
                <Text style={styles.guideTitle}>Tap the highlighted category badge</Text>
                <Text style={styles.guideText}>It is on the sample link card at the top of your list.</Text>
              </>
            )}
            {stage === 'pick-category' && (
              <>
                <Text style={styles.guideTitle}>Choose the highlighted category</Text>
                <Text style={styles.guideText}>This changes how the link appears in your filters.</Text>
              </>
            )}
            {stage === 'done' && (
              <>
                <Text style={styles.guideTitle}>Tutorial complete</Text>
                <Text style={styles.guideText}>The sample link is ready in your list.</Text>
              </>
            )}
          </View>
          <Pressable style={styles.guideButton} onPress={finish}>
            <Text style={styles.guideButtonText}>{stage === 'done' ? 'Finish' : 'Skip'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={finish}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle(stage)}</Text>
            <Pressable onPress={finish} hitSlop={10} style={styles.iconButton}>
              <X size={18} color={COLORS.textMuted} />
            </Pressable>
          </View>

          {stage === 'ask' && (
            <View style={styles.content}>
              <Text style={styles.body}>
                Want a quick tutorial? It will add a sample link and walk you through changing its category.
              </Text>
              <View style={styles.actions}>
                <Pressable style={[styles.secondaryButton, styles.actionButton]} onPress={finish}>
                  <Text style={styles.secondaryButtonText}>Skip</Text>
                </Pressable>
                <Pressable style={[styles.primaryButton, styles.actionButton]} onPress={startTutorial}>
                  <Text style={styles.primaryButtonText}>Start</Text>
                </Pressable>
              </View>
            </View>
          )}

          {stage === 'add-link' && (
            <View style={styles.content}>
              <View style={styles.stepRow}>
                <BookmarkPlus size={20} color={COLORS.primary} />
                <Text style={styles.stepBody}>First, add a sample link to your saved links.</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={addExample}>
                <Text style={styles.primaryButtonText}>Add Sample Link</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function getTitle(step: TutorialStage): string {
  switch (step) {
    case 'ask':
      return 'Tutorial';
    case 'add-link':
      return 'Add Link';
    case 'tap-category':
    case 'pick-category':
      return 'Change Category';
    case 'done':
      return 'Ready';
    case 'idle':
      return '';
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  content: {
    gap: 16,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  stepBody: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textMuted,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.background,
  },
  secondaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  floatingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  guideBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  guideTextWrap: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  guideText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  guideButton: {
    minHeight: 36,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
  },
  guideButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.background,
  },
});
