import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ShareScreen } from './src/screens/ShareScreen';
import { colors } from './src/theme';

type Tab = 'home' | 'menu' | 'share';

interface KitchenData {
  name: string;
  whatsapp: string;
  neighborhood: string;
  closeTime: string;
  slug?: string;
}

export default function App() {
  const [kitchen, setKitchen] = useState<KitchenData | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [productCount, setProductCount] = useState(4);

  if (!kitchen) {
    return (
      <>
        <OnboardingScreen onComplete={setKitchen} />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {tab === 'home' && (
          <HomeScreen
            kitchen={kitchen}
            productCount={productCount}
            onNavigate={(screen) => setTab(screen as Tab)}
          />
        )}
        {tab === 'menu' && <MenuScreen onProductCountChange={setProductCount} />}
        {tab === 'share' && <ShareScreen kitchen={kitchen} />}
      </View>

      <View style={styles.tabs}>
        {(['home', 'menu', 'share'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={styles.tabIcon}>
              {t === 'home' ? '🏠' : t === 'menu' ? '📋' : '🔗'}
            </Text>
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'home' ? 'Inicio' : t === 'menu' ? 'Menú' : 'Compartir'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  tabLabelActive: { color: colors.accent },
});
