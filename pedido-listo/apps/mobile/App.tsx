import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { claimBusinessOwnership, getBusinessBySlug, signInOwner } from '@pedido-listo/firebase';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ShareScreen } from './src/screens/ShareScreen';
import { initFirebase } from './src/lib/firebase';
import { useProducts } from './src/hooks/useProducts';
import { slugify } from './src/lib/catalog';
import { colors } from './src/theme';

type Tab = 'home' | 'orders' | 'menu' | 'share';

interface ConnectionContext {
  stage: string;
  uid: string;
  businessId: string;
}

function describeConnectionError(err: unknown, ctx: ConnectionContext): string {
  const code = (err as { code?: string })?.code;

  const summary =
    code === 'permission-denied'
      ? `Firestore rechazo el paso "${ctx.stage}". Revisa las reglas publicadas en Firebase.`
      : err instanceof Error
        ? err.message
        : 'No se pudo conectar con Firebase';

  const details = [
    code ? `codigo: ${code}` : null,
    ctx.businessId ? `negocio: ${ctx.businessId}` : null,
    ctx.uid ? `uid: ${ctx.uid}` : null,
  ].filter(Boolean);

  return details.length ? `${summary}\n\n${details.join('\n')}` : summary;
}

interface KitchenData {
  name: string;
  whatsapp: string;
  neighborhood: string;
  closeTime: string;
  slug: string;
  businessId: string;
}

export default function App() {
  const [kitchen, setKitchen] = useState<KitchenData | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  async function handleOnboardingComplete(data: {
    catalogSlug: string;
    whatsapp: string;
    neighborhood: string;
    closeTime: string;
  }) {
    setConnecting(true);
    setOnboardingError(null);

    const ctx: ConnectionContext = { stage: 'iniciar Firebase', uid: '', businessId: '' };

    try {
      initFirebase();

      ctx.stage = 'iniciar sesion anonima';
      ctx.uid = await signInOwner();

      ctx.stage = 'buscar el negocio';
      const slug = slugify(data.catalogSlug);
      const business = await getBusinessBySlug(slug);

      if (!business?.id) {
        throw new Error(`No encontramos un negocio con el link "${slug}".`);
      }

      ctx.businessId = business.id;
      ctx.stage = 'reclamar el negocio';
      await claimBusinessOwnership(business.id);

      setKitchen({
        name: business.name,
        whatsapp: data.whatsapp,
        neighborhood: data.neighborhood,
        closeTime: data.closeTime,
        slug: business.slug,
        businessId: business.id,
      });
    } catch (err) {
      setOnboardingError(describeConnectionError(err, ctx));
    } finally {
      setConnecting(false);
    }
  }

  if (!kitchen) {
    return (
      <>
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          loading={connecting}
          error={onboardingError}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  return <KitchenTabs kitchen={kitchen} />;
}

function KitchenTabs({ kitchen }: { kitchen: KitchenData }) {
  const [tab, setTab] = useState<Tab>('orders');
  const { products, categories, loading, error, toggleAvailable, addProduct, editProduct, removeProduct } =
    useProducts(kitchen.businessId);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        {tab === 'home' && (
          <HomeScreen
            kitchen={kitchen}
            productCount={products.length}
            onNavigate={(screen) => setTab(screen as Tab)}
          />
        )}
        {tab === 'orders' && <OrdersScreen businessId={kitchen.businessId} />}
        {tab === 'menu' && (
          <MenuScreen
            products={products}
            categories={categories}
            loading={loading}
            error={error}
            onToggleAvailable={toggleAvailable}
            onAddProduct={addProduct}
            onEditProduct={editProduct}
            onRemoveProduct={removeProduct}
          />
        )}
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
