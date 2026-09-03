import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Columns2, Columns3, AlignJustify, Trash2, Plus, RotateCw, Crown, ShieldCheck, RotateCcw } from 'lucide-react-native';
import type { CardSize } from '@/store/types';
import { useSettingsStore } from '@/store/settingsStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useLinkStore } from '@/store/linkStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { useEntitlementStore } from '@/store/entitlementStore';
import { COLORS, STORAGE_KEYS } from '@/utils/constants';
import { hapticDelete } from '@/utils/haptics';
import { BackupSection } from '@/components/BackupSection';
import { RewardedGate } from '@/components/RewardedGate';
import { PaywallSheet } from '@/components/PaywallSheet';

const SIZES: { key: CardSize; label: string; icon: typeof Columns2 }[] = [
  { key: 'small', label: 'Small', icon: Columns3 },
  { key: 'medium', label: 'Medium', icon: Columns2 },
  { key: 'large', label: 'Large', icon: AlignJustify },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { cardSize, setCardSize, loadSettings, loaded } = useSettingsStore();
  const { categories, loadCategories, addCategory, removeCategory } = useCategoryStore();
  const [newName, setNewName] = useState('');
  const isPro = useEntitlementStore((s) => s.isPro);
  const initEntitlement = useEntitlementStore((s) => s.init);
  const restorePurchases = useEntitlementStore((s) => s.restorePurchases);
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
      'Delete Category',
      `"${name}" has ${linksInCategory.length} link${linksInCategory.length > 1 ? 's' : ''}. What should happen to them?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Random',
          onPress: () => {
            useLinkStore.getState().batchUpdateCategory(linkIds, 'random');
            removeCategory(id);
          },
        },
        {
          text: 'Delete Links',
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
      Alert.alert(ok ? 'Geri yüklendi' : 'Bulunamadı', ok ? 'Pro erişimin geri yüklendi.' : 'Aktif Pro aboneliği bulunamadı.');
    } finally {
      setRestoring(false);
    }
  };

  const handleToggleProMock = async () => {
    if (isPro) {
      Alert.alert('Pro aktif', 'Pro erişimin var. Test için sıfırlamak ister misin?', [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla (test)',
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={handleToggleProMock} style={[styles.proCard, isPro && styles.proCardActive]}>
        <View style={styles.proCardHeader}>
          <View style={[styles.proIcon, isPro && styles.proIconActive]}>
            {isPro ? <ShieldCheck size={20} color="#fff" /> : <Crown size={20} color={COLORS.primary} />}
          </View>
          <View style={styles.proTextWrap}>
            <Text style={styles.proTitle}>{isPro ? 'Pro Aktif — Reklamsız' : 'Dead Link Saver Pro'}</Text>
            <Text style={styles.proSub}>{isPro ? 'Sınırsız tarama ve yedek açık. Teşekkürler!' : 'Sınırsız tarama + sınırsız yedek + reklamsız'}</Text>
          </View>
          {!isPro && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        {!isPro ? (
          <>
            <View style={styles.proBullets}>
              <Text style={styles.proBullet}>• Günde 1 yerine sınırsız Dead Link taraması</Text>
              <Text style={styles.proBullet}>• Haftada 1 yerine sınırsız yedek & içe aktar</Text>
              <Text style={styles.proBullet}>• Ödüllü reklam butonları tamamen kalkar</Text>
            </View>
            <View style={styles.proCtaBtn}>
              <Crown size={16} color="#fff" />
              <Text style={styles.proCtaText}>Pro'yu Gör</Text>
            </View>
          </>
        ) : (
          <Text style={styles.proActiveNote}>Tüm limitler kalktı. Ayarlardan yedeğini dilediğin kadar alabilirsin.</Text>
        )}
      </Pressable>

      {!isPro && (
        <Pressable onPress={handleRestore} disabled={restoring} style={styles.restoreRow}>
          {restoring ? <ActivityIndicator size="small" color={COLORS.textMuted} /> : <RotateCcw size={14} color={COLORS.textMuted} />}
          <Text style={styles.restoreText}>Satın almayı geri yükle</Text>
        </Pressable>
      )}

      <BackupSection onNeedGate={() => setGateVisible(true)} onNeedPro={() => setPaywallVisible(true)} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card Size</Text>
        <Text style={styles.sectionSub}>Adjust the size of link cards in the list</Text>
        <View style={styles.options}>
          {SIZES.map(({ key, label, icon: Icon }) => {
            const selected = cardSize === key;
            return (
              <Pressable key={key} style={[styles.option, selected && styles.optionSelected]} onPress={() => setCardSize(key)}>
                <Icon size={20} color={selected ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <Text style={styles.sectionSub}>Manage your link categories</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="New category name"
            placeholderTextColor={COLORS.textMuted}
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
          />
          <Pressable style={styles.addButton} onPress={handleAdd}>
            <Plus size={18} color={COLORS.background} />
          </Pressable>
        </View>
        <View style={styles.categoryList}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryRow}>
              <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              {cat.id !== 'random' && (
                <Pressable onPress={() => handleRemove(cat.id, cat.name)} style={styles.deleteButton}>
                  <Trash2 size={16} color={COLORS.textMuted} />
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tutorial</Text>
        <Text style={styles.sectionSub}>Replay the onboarding tutorial</Text>
        <Pressable style={styles.replayButton} onPress={handleReplayTutorial}>
          <RotateCw size={16} color={COLORS.primary} />
          <Text style={styles.replayButtonText}>Show Tutorial Again</Text>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 32,
  },
  proCard: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  proCardActive: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(16,185,129,0.08)',
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108,142,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proIconActive: {
    backgroundColor: COLORS.success,
  },
  proTextWrap: {
    flex: 1,
    gap: 2,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  proSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
  },
  proBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  proBullets: {
    gap: 4,
    paddingLeft: 4,
  },
  proBullet: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  proCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  proCtaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  proActiveNote: {
    fontSize: 13,
    color: COLORS.success,
    lineHeight: 18,
  },
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
  restoreText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(108,142,255,0.12)',
  },
  optionLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: {
    gap: 6,
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 6,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  replayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
