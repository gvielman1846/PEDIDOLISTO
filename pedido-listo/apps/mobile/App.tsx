import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEMO_BUSINESS_ID } from '@pedido-listo/types';
import { claimBusinessOwnership, signInOwner } from '@pedido-listo/firebase';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ShareScreen } from './src/screens/ShareScreen';
import { initFirebase } from './src/lib/firebase';
import { colors } from './src/theme';

type Tab = 'home' | 'orders' | 'menu' | 'share';

interface KitchenData {
  name: string;
  whatsapp: string;
  neighborhood: string;
  closeTime: string;
  slug?: string;
  businessId: string;
}

export default function App() {
  const [kitchen, setKitchen] = useState<KitchenData | null>(null);
  const [tab, setTab] = useState<Tab>('orders');
  const [productCount, setProductCount] = useState(4);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!kitchen) return;

    initFirebase();
    signInOwner()
      .then(() => claimBusinessOwnership(kitchen.businessId))
      .then(() => setAuthReady(true))
      .catch((err) => setAuthError(err.message));
  }, [kitchen]);

  function handleOnboardingComplete(data: Omit<KitchenData, 'businessId'>) {
    setKitchen({ ...data, businessId: DEMO_BUSINESS_ID });
  }

  if (!kitchen) {
    return (
      <>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
        <StatusBar style="dark" />
      </>
    );
  }

  if (!authReady) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          {authError ? (
            <>
              <Text style={styles.errorTitle}>No se pudo conectar</Text>
              <Text style={styles.errorText}>{authError}</Text>
              <Text style={styles.errorHint}>Corre: node scripts/seed-demo.mjs</Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Conectando con Firebase...</Text>
            </>
          )}
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
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
        {tab === 'orders' && <OrdersScreen />}
        {tab === 'menu' && <MenuScreen onProductCountChange={setProductCount} />}
        {tab === 'share' && <ShareScreen kitchen={kitchen} />}
      </View>

      <View style={styles.tabs}>
        {([
          ['home', '🏠', 'Inicio'],
          ['orders', '🛒', 'Pedidos'],
          ['menu', '📋', 'Menu'],
          ['share', '🔗', 'Compartir'],
        ] as const).map(([id, icon, label]) => (
          <TouchableOpacity key={id} style={styles.tab} onPress={() => setTab(id)}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>{label}</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: colors.muted },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  errorText: { marginTop: 8, color: colors.danger, textAlign: 'center' },
  errorHint: { marginTop: 12, color: colors.muted, fontSize: 13 },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingBottom: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 10, color: colors.muted, fontWeight: '600', marginTop: 2 },
  tabLabelActive: { color: colors.accent },
});
