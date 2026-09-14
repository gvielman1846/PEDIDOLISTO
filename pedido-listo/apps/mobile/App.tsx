import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import type { Business, StaffRole, PaymentMethod } from '@pedido-listo/types';
import {
  createOwnerBusiness,
  getFirebaseAuth,
  registerOwner,
  resolveKitchenAccess,
  sendPasswordSetupEmail,
  signInOwnerWithEmail,
  signOutOwner,
  subscribeToAuthState,
  writeOwnerMembership,
} from '@pedido-listo/firebase';
import { AuthScreen, type SignUpData } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrdersScreen, CalendarScreen } from './src/screens/OrdersScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { ShareScreen } from './src/screens/ShareScreen';
import { TeamScreen } from './src/screens/TeamScreen';
import { initFirebase } from './src/lib/firebase';
import { useProducts } from './src/hooks/useProducts';
import { slugify } from './src/lib/catalog';
import { colors } from './src/theme';

type Tab = 'home' | 'orders' | 'calendar' | 'menu' | 'share' | 'team';

function describeAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return 'Ese correo ya tiene una cuenta. Usa Iniciar sesion o recupera tu contraseña.';
  if (code === 'auth/invalid-credential') return 'Correo o contraseña incorrectos.';
  if (code === 'auth/invalid-email') return 'El correo no es valido.';
  if (code === 'auth/weak-password') return 'Usa una contraseña mas segura.';
  if (code === 'auth/user-not-found') return 'No hay una cuenta con ese correo.';
  if (code === 'auth/too-many-requests') return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (code === 'auth/invalid-api-key') {
    return 'Este build no tiene la configuracion de Firebase. Hay que generar un APK nuevo.';
  }
  return err instanceof Error ? err.message : 'No se pudo completar la operacion.';
}

interface KitchenData {
  name: string;
  whatsapp: string;
  neighborhood: string;
  closeTime: string;
  slug: string;
  businessId: string;
  role: StaffRole;
  paymentMethods?: PaymentMethod[];
  clabe?: string;
}

function kitchenFromAccess(business: Business, role: StaffRole): KitchenData {
  return {
    name: business.name,
    whatsapp: business.whatsapp,
    neighborhood: business.address ?? '',
    closeTime: business.closeTime ?? '20:00',
    slug: business.slug,
    businessId: business.id!,
    role,
    paymentMethods: business.paymentMethods,
    clabe: business.clabe,
  };
}

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [kitchen, setKitchen] = useState<KitchenData | null>(null);
  const [legacyBusiness, setLegacyBusiness] = useState<Business | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      initFirebase();
    } catch (err) {
      setAuthError(describeAuthError(err));
      setLoading(false);
      return;
    }
    return subscribeToAuthState((user) => {
      void (async () => {
        try {
          if (!user) {
            setKitchen(null);
            setLegacyBusiness(null);
            setPendingEmail(null);
            return;
          }
          const access = await resolveKitchenAccess(user.uid, user.email, setAuthNotice);
          if (user.isAnonymous) {
            setLegacyBusiness(access?.business ?? null);
            setKitchen(null);
            setPendingEmail(null);
          } else {
            setLegacyBusiness(null);
            setKitchen(access ? kitchenFromAccess(access.business, access.role) : null);
            // Cuenta valida sin negocio: el registro quedo a medias o falta invitacion.
            setPendingEmail(access ? null : user.email);
          }
        } catch (err) {
          setAuthError(describeAuthError(err));
        } finally {
          setLoading(false);
        }
      })();
    });
  }, []);

  async function handleSignIn(email: string, password: string) {
    setLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    try {
      const user = await signInOwnerWithEmail(email, password);
      const access = await resolveKitchenAccess(user.uid, user.email, setAuthNotice);
      if (!access) {
        setPendingEmail(user.email ?? email);
        return;
      }
      setKitchen(kitchenFromAccess(access.business, access.role));
      setLegacyBusiness(null);
      setPendingEmail(null);
    } catch (err) {
      setAuthError(describeAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(email: string) {
    setAuthError(null);
    setAuthNotice(null);
    if (!email.trim()) {
      setAuthError('Escribe tu correo para enviarte el link.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordSetupEmail(email);
      setAuthNotice(`Te enviamos un correo a ${email}. Abre el link para crear o cambiar tu contraseña.`);
    } catch (err) {
      setAuthError(describeAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(data: SignUpData) {
    setLoading(true);
    setAuthError(null);
    setAuthNotice(null);
    const createdNewAuth = { current: false };
    try {
      const current = getFirebaseAuth().currentUser;
      const alreadySignedIn = Boolean(current && !current.isAnonymous);

      if (!alreadySignedIn && !data.email.trim()) {
        throw new Error('Escribe un correo valido.');
      }

      const fillingBusiness = Boolean(
        data.businessName.trim() || data.slug.trim() || data.whatsapp.trim()
      );
      if (fillingBusiness && (!data.businessName.trim() || !data.slug.trim() || !data.whatsapp.trim())) {
        throw new Error('Completa el negocio o dejalo vacio si te invitaron.');
      }

      const user =
        current && !current.isAnonymous ? current : await registerOwner(data.email);
      createdNewAuth.current = !alreadySignedIn;
      const email = user.email ?? data.email;

      async function finishWithSetupEmail() {
        await sendPasswordSetupEmail(email);
        await signOutOwner();
        setKitchen(null);
        setLegacyBusiness(null);
        setPendingEmail(null);
        setAuthNotice(
          `Te enviamos un correo a ${email}. Abre el link para activar tu cuenta y crear tu contraseña, luego inicia sesion.`
        );
      }

      const existing = await resolveKitchenAccess(user.uid, email, setAuthNotice);
      if (existing) {
        if (createdNewAuth.current) {
          await finishWithSetupEmail();
          return;
        }
        setKitchen(kitchenFromAccess(existing.business, existing.role));
        setLegacyBusiness(null);
        setPendingEmail(null);
        return;
      }

      if (legacyBusiness?.id) {
        await claimMembership(legacyBusiness.id, user.uid, email);
        if (createdNewAuth.current) {
          await finishWithSetupEmail();
          return;
        }
        setKitchen(kitchenFromAccess(legacyBusiness, 'owner'));
        setLegacyBusiness(null);
        setPendingEmail(null);
        return;
      }

      if (!fillingBusiness) {
        throw new Error('Si eres el dueno, completa el negocio. Si te invitaron, usa el mismo correo de la invitacion.');
      }

      const business = await createOwnerBusiness(user.uid, {
        name: data.businessName.trim(),
        slug: slugify(data.slug),
        whatsapp: data.whatsapp.trim(),
        address: data.address.trim() || undefined,
      });
      await claimMembership(business.id!, user.uid, email);
      if (createdNewAuth.current) {
        await finishWithSetupEmail();
        return;
      }
      setKitchen(kitchenFromAccess(business, 'owner'));
      setLegacyBusiness(null);
      setPendingEmail(null);
    } catch (err) {
      if (createdNewAuth.current) {
        const email = data.email.trim();
        try {
          if (email) await sendPasswordSetupEmail(email);
          await signOutOwner();
          setPendingEmail(null);
        } catch {
          // Si el alta ya creo el usuario, que use Olvidaste tu contraseña.
        }
      }
      setAuthError(describeAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  // El negocio ya quedo con ownerId, asi que la membresia se puede reintentar
  // despues sin dejar al dueno fuera de su propia cocina.
  async function claimMembership(businessId: string, uid: string, email: string) {
    try {
      await writeOwnerMembership(businessId, uid, email);
    } catch (err) {
      setAuthNotice(`Tu cocina quedo lista, pero no se guardo el equipo: ${describeAuthError(err)}`);
    }
  }

  async function handleSignOut() {
    await signOutOwner();
    setKitchen(null);
    setLegacyBusiness(null);
    setPendingEmail(null);
    setAuthError(null);
    setAuthNotice(null);
  }

  if (loading && !kitchen) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (!kitchen) {
    return (
      <>
        <AuthScreen
          legacyBusinessName={legacyBusiness?.name}
          pendingEmail={pendingEmail}
          loading={loading}
          error={authError}
          notice={authNotice}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onForgotPassword={handleForgotPassword}
          onSignOut={handleSignOut}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <KitchenTabs
      kitchen={kitchen}
      onSignOut={handleSignOut}
      onKitchenChange={(patch) => setKitchen((current) => (current ? { ...current, ...patch } : current))}
    />
  );
}

function KitchenTabs({
  kitchen,
  onSignOut,
  onKitchenChange,
}: {
  kitchen: KitchenData;
  onSignOut: () => void;
  onKitchenChange: (patch: Partial<KitchenData>) => void;
}) {
  const [tab, setTab] = useState<Tab>('orders');
  const insets = useSafeAreaInsets();
  const {
    products,
    categories,
    loading,
    error,
    toggleAvailable,
    addCategory,
    editCategory,
    removeCategory,
    addProduct,
    editProduct,
    removeProduct,
  } = useProducts(kitchen.businessId, kitchen.role === 'owner');

  // Con el dueño son seis pestañas, asi que cada etiqueta solo tiene un sexto
  // del ancho: los nombres largos no caben ni en pantallas chicas.
  const tabs: Array<[Tab, string, string]> = [
    ['home', '🏠', 'Inicio'],
    ['orders', '🛒', 'Pedidos'],
    ['calendar', '📅', 'Ventas'],
  ];
  if (kitchen.role !== 'delivery') tabs.push(['menu', '📋', 'Productos']);
  if (kitchen.role === 'owner') {
    tabs.push(['team', '👥', 'Equipo']);
    tabs.push(['share', '🔗', 'Perfil']);
  }

  return (
    // La barra de navegacion de Android se dibuja encima, asi que el borde inferior
    // lo compensa la barra de pestañas con su propio inset.
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        {tab === 'home' && (
          <>
            <HomeScreen
              kitchen={kitchen}
              productCount={products.length}
              role={kitchen.role}
              onNavigate={(screen) => setTab(screen as Tab)}
            />
            <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
              <Text style={styles.signOutText}>Cerrar sesion</Text>
            </TouchableOpacity>
          </>
        )}
        {tab === 'orders' && <OrdersScreen businessId={kitchen.businessId} role={kitchen.role} />}
        {tab === 'calendar' && <CalendarScreen businessId={kitchen.businessId} role={kitchen.role} />}
        {tab === 'menu' && kitchen.role !== 'delivery' && (
          <MenuScreen
            products={products}
            categories={categories}
            loading={loading}
            error={error}
            onToggleAvailable={toggleAvailable}
            onAddCategory={addCategory}
            onEditCategory={editCategory}
            onRemoveCategory={removeCategory}
            onAddProduct={addProduct}
            onEditProduct={editProduct}
            onRemoveProduct={removeProduct}
            canEditMenu={kitchen.role === 'owner'}
          />
        )}
        {tab === 'share' && kitchen.role === 'owner' && (
          <ShareScreen
            kitchen={kitchen}
            onKitchenChange={onKitchenChange}
          />
        )}
        {tab === 'team' && kitchen.role === 'owner' && <TeamScreen businessId={kitchen.businessId} />}
      </View>

      <View style={[styles.tabs, { paddingBottom: insets.bottom + 10 }]}>
        {tabs.map(([id, icon, label]) => (
          <TouchableOpacity key={id} style={styles.tab} onPress={() => setTab(id)}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text
              style={[styles.tabLabel, tab === id && styles.tabLabelActive]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    minHeight: 56,
  },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 9, color: colors.muted, fontWeight: '600', marginTop: 3 },
  tabLabelActive: { color: colors.accent },
  signOut: { position: 'absolute', top: 12, right: 20, padding: 8 },
  signOutText: { color: 'white', fontSize: 12, fontWeight: '700' },
});
