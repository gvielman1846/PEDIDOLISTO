import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  STAFF_ROLE_LABELS,
  normalizeClabe,
  type PaymentMethod,
  type StaffRole,
} from '@pedido-listo/types';
import {
  changeAccountEmail,
  changeAccountPassword,
  createOwnerBusiness,
  deleteOwnerAccount,
  disconnectMercadoPago,
  getBusinessById,
  getFirebaseAuth,
  getUserProfile,
  listUserKitchens,
  saveUserPhone,
  setActiveKitchen,
  signOutOwner,
  startMercadoPagoOAuth,
  toMxMobileDigits,
  updateBusinessMinOrder,
  updateBusinessPaymentSettings,
  updateBusinessWhatsApp,
  writeOwnerMembership,
  type KitchenAccess,
} from '@pedido-listo/firebase';
import { buildCatalogUrl, slugify } from '../lib/catalog';
import { useTheme, type ThemeColors } from '../theme';

interface KitchenData {
  name: string;
  slug?: string;
  businessId: string;
  ownerId?: string;
  role: StaffRole;
  whatsapp?: string;
  paymentMethods?: PaymentMethod[];
  clabe?: string;
  minOrder: number;
  mercadoPagoConnected?: boolean;
  mercadoPagoNickname?: string;
}

interface Props {
  kitchen: KitchenData;
  accountEmail: string;
  onKitchenChange: (patch: Partial<KitchenData>) => void;
  onSelectKitchen: (access: KitchenAccess) => void;
}

type ProfileSection =
  | 'appearance'
  | 'email'
  | 'password'
  | 'phone'
  | 'minOrder'
  | 'whatsapp'
  | 'businesses'
  | 'addBusiness'
  | 'share'
  | 'mercadoPago'
  | 'paymentMethods'
  | 'clabe'
  | 'deleteAccount';

export function ShareScreen({ kitchen, accountEmail, onKitchenChange, onSelectKitchen }: Props) {
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const uid = getFirebaseAuth().currentUser?.uid;
  const slug = kitchen.slug ?? 'cocina-chef-cueto';
  const catalogUrl = buildCatalogUrl(slug);
  // Si el negocio ya guarda su ownerId, ese dato manda sobre el rol de la sesion.
  const isOwner =
    kitchen.role === 'owner' && (!kitchen.ownerId || kitchen.ownerId === uid);

  const [methods, setMethods] = useState<PaymentMethod[]>(() =>
    kitchen.paymentMethods?.length ? kitchen.paymentMethods : [...PAYMENT_METHODS]
  );
  const [clabe, setClabe] = useState(kitchen.clabe ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [kitchens, setKitchens] = useState<KitchenAccess[]>([]);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(kitchen.whatsapp ?? '');
  const [minOrder, setMinOrder] = useState(String(kitchen.minOrder ?? 0));
  const [newEmail, setNewEmail] = useState(accountEmail);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [section, setSection] = useState<ProfileSection | null>(null);

  useEffect(() => {
    setMethods(kitchen.paymentMethods?.length ? kitchen.paymentMethods : [...PAYMENT_METHODS]);
    setClabe(kitchen.clabe ?? '');
    setWhatsapp(kitchen.whatsapp ?? '');
    setMinOrder(String(kitchen.minOrder ?? 0));
  }, [kitchen.businessId, kitchen.clabe, kitchen.minOrder, kitchen.paymentMethods, kitchen.whatsapp, kitchen.mercadoPagoConnected]);

  useEffect(() => {
    if (!uid) return;
    void (async () => {
      try {
        const [profile, list] = await Promise.all([getUserProfile(uid), listUserKitchens(uid)]);
        if (profile?.phone) setPhone(profile.phone);
        setKitchens(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar tus negocios.');
      }
    })();
  }, [uid, kitchen.businessId]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !isOwner) return;
      void getBusinessById(kitchen.businessId).then((business) => {
        if (!business) return;
        onKitchenChange({
          mercadoPagoConnected: business.mercadoPagoConnected,
          mercadoPagoNickname: business.mercadoPagoNickname,
          paymentMethods: business.paymentMethods,
        });
      });
    });
    return () => sub.remove();
  }, [isOwner, kitchen.businessId, onKitchenChange]);

  async function connectMercadoPago() {
    if (!isOwner) return;
    setSaving(true);
    setError(null);
    try {
      const url = await startMercadoPagoOAuth(kitchen.businessId);
      // Chrome Custom Tabs: el navegador de Samsung bloquea el reCAPTCHA de Mercado Pago.
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch {
        await Linking.openURL(url);
      }
      const business = await getBusinessById(kitchen.businessId);
      if (business) {
        onKitchenChange({
          mercadoPagoConnected: business.mercadoPagoConnected,
          mercadoPagoNickname: business.mercadoPagoNickname,
          paymentMethods: business.paymentMethods,
        });
      }
      setSection(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo abrir Mercado Pago.';
      setError(message);
      Alert.alert('Mercado Pago', message);
    } finally {
      setSaving(false);
    }
  }

  async function unlinkMercadoPago() {
    if (!isOwner) return;
    Alert.alert(
      'Desconectar Mercado Pago',
      'Dejaran de aparecer pagos con tarjeta en tu catalogo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              setError(null);
              try {
                await disconnectMercadoPago(kitchen.businessId);
                onKitchenChange({
                  mercadoPagoConnected: false,
                  mercadoPagoNickname: undefined,
                  paymentMethods: methods.filter((method) => method !== 'tarjeta'),
                });
                setMethods((current) => current.filter((method) => method !== 'tarjeta'));
                Alert.alert('Listo', 'Mercado Pago quedó desconectado.');
                setSection(null);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'No se pudo desconectar Mercado Pago.');
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ]
    );
  }

  async function copyLink() {
    await Clipboard.setStringAsync(catalogUrl);
    Alert.alert('Copiado', 'Link copiado al portapapeles');
    setSection(null);
  }

  function toggleMethod(method: PaymentMethod, enabled: boolean) {
    setError(null);
    setMethods((current) => {
      if (enabled) return PAYMENT_METHODS.filter((item) => item === method || current.includes(item));
      const next = current.filter((item) => item !== method);
      if (next.length === 0) {
        setError('Deja al menos un metodo de pago activo.');
        return current;
      }
      return next;
    });
  }

  async function savePayments() {
    const digits = normalizeClabe(clabe);
    if (methods.includes('transferencia') && digits.length !== 18) {
      setError('Para Transferencia escribe una CLABE de 18 digitos.');
      return;
    }
    if (methods.includes('tarjeta') && !kitchen.mercadoPagoConnected) {
      setError('Para Tarjeta conecta primero tu cuenta de Mercado Pago.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateBusinessPaymentSettings(kitchen.businessId, {
        paymentMethods: methods,
        clabe: methods.includes('transferencia') ? digits : digits || null,
      });
      onKitchenChange({ paymentMethods: methods, clabe: digits || undefined });
      Alert.alert('Listo', 'Los metodos de pago ya aparecen en tu catalogo.');
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  async function savePhone() {
    if (!uid || !isOwner) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await saveUserPhone(uid, phone);
      setNotice('Celular guardado.');
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el celular.');
    } finally {
      setSaving(false);
    }
  }

  async function saveWhatsApp() {
    if (!isOwner) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const digits = toMxMobileDigits(whatsapp);
      await updateBusinessWhatsApp(kitchen.businessId, digits);
      setWhatsapp(digits);
      onKitchenChange({ whatsapp: digits });
      Alert.alert('Listo', 'Los pedidos nuevos llegaran a ese WhatsApp.');
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el WhatsApp.');
    } finally {
      setSaving(false);
    }
  }

  async function saveMinOrder() {
    if (!isOwner) return;
    const normalized = minOrder.trim().replace(',', '.');
    const amount = normalized === '' ? 0 : Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Escribe un pedido minimo valido, igual o mayor a $0.');
      return;
    }
    const rounded = Math.round(amount * 100) / 100;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await updateBusinessMinOrder(kitchen.businessId, rounded);
      setMinOrder(String(rounded));
      onKitchenChange({ minOrder: rounded });
      Alert.alert(
        'Pedido minimo actualizado',
        rounded === 0
          ? 'Tu catalogo ya no exige un pedido minimo.'
          : `El pedido minimo ahora es de $${rounded.toFixed(2)} MXN.`
      );
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pedido minimo.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    if (!newEmail.trim() || !currentPassword) {
      setError('Escribe el nuevo correo y tu contraseña actual.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await changeAccountEmail(newEmail.trim(), currentPassword);
      setCurrentPassword('');
      setNotice(`Te enviamos un correo a ${newEmail.trim()} para confirmar el cambio.`);
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el correo.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteAccount() {
    if (deleteConfirmation.trim().toUpperCase() !== 'ELIMINAR') {
      setError('Escribe ELIMINAR para confirmar.');
      return;
    }
    if (!deletePassword) {
      setError('Escribe tu contraseña actual.');
      return;
    }

    Alert.alert(
      '¿Eliminar cuenta definitivamente?',
      'Se borrarán todos tus negocios, productos, fotos, pedidos, clientes, equipo, invitaciones y tu acceso. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: () => void runDeleteAccount(),
        },
      ]
    );
  }

  async function runDeleteAccount() {
    setDeletingAccount(true);
    setError(null);
    setNotice(null);
    try {
      await deleteOwnerAccount(deletePassword);
      await signOutOwner();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.';
      setError(
        message.includes('failed-precondition')
          ? 'La sesión venció. Confirma otra vez tu contraseña y vuelve a intentar.'
          : message
      );
      setDeletingAccount(false);
    }
  }

  async function savePassword() {
    if (!currentPassword || !nextPassword) {
      setError('Escribe tu contraseña actual y la nueva.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await changeAccountPassword(currentPassword, nextPassword);
      setCurrentPassword('');
      setNextPassword('');
      setNotice('Contraseña actualizada.');
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  }

  async function switchKitchen(access: KitchenAccess) {
    if (!uid || access.business.id === kitchen.businessId) return;
    setSaving(true);
    setError(null);
    try {
      await setActiveKitchen(uid, accountEmail, access);
      onSelectKitchen(access);
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar de negocio.');
    } finally {
      setSaving(false);
    }
  }

  async function addKitchen() {
    if (!uid || !isOwner) return;
    if (!newName.trim() || !newSlug.trim() || !newWhatsapp.trim()) {
      setError('Para un negocio nuevo llena nombre, link y WhatsApp.');
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const business = await createOwnerBusiness(uid, {
        name: newName.trim(),
        slug: slugify(newSlug),
        whatsapp: newWhatsapp.trim(),
        address: newAddress.trim() || undefined,
      });
      await writeOwnerMembership(business.id!, uid, accountEmail);
      setNewName('');
      setNewSlug('');
      setNewWhatsapp('');
      setNewAddress('');
      onSelectKitchen({ business, role: 'owner' });
      setSection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el negocio.');
    } finally {
      setSaving(false);
    }
  }

  const profileItems: Array<{
    id: ProfileSection;
    icon: string;
    title: string;
    description: string;
    ownerOnly?: boolean;
    exactOwnerOnly?: boolean;
    danger?: boolean;
  }> = [
    { id: 'appearance', icon: '◐', title: 'Apariencia', description: 'Tema Normal u Oscuro' },
    { id: 'email', icon: '✉', title: 'Cambiar correo', description: accountEmail },
    { id: 'password', icon: '●', title: 'Cambiar contraseña', description: 'Actualiza tu acceso' },
    { id: 'phone', icon: '☎', title: 'Guardar celular dueño', description: 'Teléfono de contacto', ownerOnly: true },
    { id: 'minOrder', icon: '$', title: 'Pedido mínimo', description: 'Monto mínimo del catálogo', ownerOnly: true },
    { id: 'whatsapp', icon: '◉', title: 'WhatsApp de pedidos', description: 'Número que recibe pedidos', ownerOnly: true },
    { id: 'businesses', icon: '▦', title: 'Negocios', description: 'Selecciona el negocio activo' },
    { id: 'addBusiness', icon: '+', title: 'Agregar negocio', description: 'Crea otro negocio', ownerOnly: true },
    { id: 'share', icon: '↗', title: 'Compartir catálogo', description: 'Link público para tus clientes', ownerOnly: true },
    { id: 'mercadoPago', icon: 'M', title: 'Mercado Pago', description: 'Conecta los cobros con tarjeta', ownerOnly: true },
    { id: 'paymentMethods', icon: '✓', title: 'Métodos de pago', description: 'Efectivo, transferencia y tarjeta', ownerOnly: true },
    { id: 'clabe', icon: '#', title: 'CLABE interbancaria', description: 'Cuenta para transferencias', ownerOnly: true },
    { id: 'deleteAccount', icon: '!', title: 'Eliminar cuenta', description: 'Borrar cuenta y todos sus datos', exactOwnerOnly: true, danger: true },
  ];

  const visibleItems = profileItems.filter(
    (item) =>
      (!item.ownerOnly || isOwner) &&
      (!item.exactOwnerOnly || (isOwner && kitchen.ownerId === uid))
  );

  const sectionTitles: Record<ProfileSection, string> = {
    appearance: 'Apariencia',
    email: 'Cambiar correo',
    password: 'Cambiar contraseña',
    phone: 'Guardar celular dueño',
    minOrder: 'Pedido mínimo',
    whatsapp: 'WhatsApp de pedidos',
    businesses: 'Negocios',
    addBusiness: 'Agregar negocio',
    share: 'Compartir catálogo',
    mercadoPago: 'Mercado Pago',
    paymentMethods: 'Métodos de pago',
    clabe: 'CLABE interbancaria',
    deleteAccount: 'Eliminar cuenta',
  };

  function openSection(next: ProfileSection) {
    setError(null);
    setNotice(null);
    setSection(next);
  }

  if (!section) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Configura tu cuenta y tu negocio</Text>

        <View style={styles.profileMenu}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.profileItem}
              onPress={() => openSection(item.id)}
            >
              <View style={[styles.profileIcon, item.danger && styles.profileIconDanger]}>
                <Text style={[styles.profileIconText, item.danger && styles.profileTextDanger]}>
                  {item.icon}
                </Text>
              </View>
              <View style={styles.profileItemCopy}>
                <Text style={[styles.profileItemTitle, item.danger && styles.profileTextDanger]}>
                  {item.title}
                </Text>
                <Text style={styles.profileItemDescription}>{item.description}</Text>
              </View>
              <Text style={styles.profileChevron}>›</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.profileItem}
            onPress={() => void Linking.openURL('https://pedidolisto.mx/ayuda')}
          >
            <View style={styles.profileIcon}>
              <Text style={styles.profileIconText}>?</Text>
            </View>
            <View style={styles.profileItemCopy}>
              <Text style={styles.profileItemTitle}>Ayuda</Text>
              <Text style={styles.profileItemDescription}>Guías y respuestas de PedidoListo</Text>
            </View>
            <Text style={styles.profileChevron}>↗</Text>
          </TouchableOpacity>
        </View>

        {notice && <Text style={styles.notice}>{notice}</Text>}
        <Text style={styles.footer}>Plan Gratis incluye marca PedidoListo. Pro $99/mes para quitarla.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => setSection(null)}>
        <Text style={styles.backButtonText}>‹ Perfil</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{sectionTitles[section]}</Text>

      {section === 'appearance' && (
        <>
          <Text style={styles.sectionHint}>Elige los colores de la app. El diseño y las degradaciones son iguales.</Text>
          <View style={styles.themePicker}>
            <TouchableOpacity
              style={[styles.themeOption, mode === 'normal' && styles.themeOptionActive]}
              onPress={() => setMode('normal')}
            >
              <View style={[styles.themePreview, styles.themePreviewNormal]} />
              <Text style={[styles.themeOptionText, mode === 'normal' && styles.themeOptionTextActive]}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.themeOption, mode === 'dark' && styles.themeOptionActive]}
              onPress={() => setMode('dark')}
            >
              <View style={[styles.themePreview, styles.themePreviewDark]} />
              <Text style={[styles.themeOptionText, mode === 'dark' && styles.themeOptionTextActive]}>Oscuro</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.btn} onPress={() => setSection(null)}>
            <Text style={styles.btnText}>Guardar apariencia</Text>
          </TouchableOpacity>
        </>
      )}

      {section === 'email' && (
        <>
          <Text style={styles.label}>Nuevo correo</Text>
          <TextInput style={styles.input} value={newEmail} onChangeText={setNewEmail} placeholder="Ej. maria.lopez@gmail.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Ej. la que usas para entrar" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" />
          <TouchableOpacity style={styles.btn} onPress={saveEmail} disabled={saving}><Text style={styles.btnText}>Guardar correo</Text></TouchableOpacity>
        </>
      )}

      {section === 'password' && (
        <>
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Tu contraseña actual" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" />
          <Text style={styles.label}>Nueva contraseña</Text>
          <TextInput style={styles.input} value={nextPassword} onChangeText={setNextPassword} placeholder="Mínimo 8 caracteres" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" />
          <TouchableOpacity style={styles.btn} onPress={savePassword} disabled={saving}><Text style={styles.btnText}>Guardar contraseña</Text></TouchableOpacity>
        </>
      )}

      {section === 'phone' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Solo para contactarte. Este número no recibe pedidos.</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Ej. 3312345678" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.btn} onPress={savePhone} disabled={saving}><Text style={styles.btnText}>Guardar celular</Text></TouchableOpacity>
        </>
      )}

      {section === 'minOrder' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Monto mínimo que debe sumar el cliente. Escribe 0 para no exigir mínimo.</Text>
          <TextInput style={styles.input} value={minOrder} onChangeText={(value) => setMinOrder(value.replace(/[^0-9.,]/g, ''))} placeholder="Ej. 80" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
          <TouchableOpacity style={styles.btn} onPress={saveMinOrder} disabled={saving}><Text style={styles.btnText}>Guardar pedido mínimo</Text></TouchableOpacity>
        </>
      )}

      {section === 'whatsapp' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Aquí llegan los pedidos del catálogo. Escribe los 10 dígitos, sin la lada 52.</Text>
          <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="Ej. 3312345678" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.btn} onPress={saveWhatsApp} disabled={saving}><Text style={styles.btnText}>Guardar WhatsApp</Text></TouchableOpacity>
        </>
      )}

      {section === 'businesses' && (
        <>
          <Text style={styles.sectionHint}>Toca el negocio que quieres administrar en la app.</Text>
          {kitchens.map((access) => {
            const active = access.business.id === kitchen.businessId;
            return (
              <TouchableOpacity key={access.business.id} style={[styles.kitchenRow, active && styles.kitchenRowActive]} onPress={() => void switchKitchen(access)} disabled={saving || active}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kitchenName}>{access.business.name}</Text>
                  <Text style={styles.kitchenMeta}>{STAFF_ROLE_LABELS[access.role]}</Text>
                </View>
                <Text style={styles.kitchenPick}>{active ? 'Actual' : 'Cargar'}</Text>
              </TouchableOpacity>
            );
          })}
        </>
      )}

      {section === 'addBusiness' && isOwner && (
        <>
          <Text style={styles.label}>Nombre del negocio</Text>
          <TextInput style={styles.input} value={newName} onChangeText={setNewName} placeholder="Ej. Taquería El Güero" placeholderTextColor={colors.muted} />
          <Text style={styles.label}>Link del catálogo</Text>
          <TextInput style={styles.input} value={newSlug} onChangeText={setNewSlug} placeholder="Ej. taqueria-el-guero" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.label}>WhatsApp del negocio</Text>
          <TextInput style={styles.input} value={newWhatsapp} onChangeText={setNewWhatsapp} placeholder="Ej. 3312345678" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
          <Text style={styles.label}>Colonia / dirección</Text>
          <TextInput style={styles.input} value={newAddress} onChangeText={setNewAddress} placeholder="Ej. Alta California, Tlajomulco" placeholderTextColor={colors.muted} />
          <TouchableOpacity style={styles.btn} onPress={() => void addKitchen()} disabled={saving}><Text style={styles.btnText}>Guardar negocio</Text></TouchableOpacity>
        </>
      )}

      {section === 'share' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Tus clientes pueden pedir sin instalar la app.</Text>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrEmoji}>📱</Text>
            <Text style={styles.qrText}>QR para mostrador</Text>
            <Text style={styles.qrHint}>Comparte también el link directo</Text>
          </View>
          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Tu link público</Text>
            <Text style={styles.linkUrl} selectable>{catalogUrl}</Text>
          </View>
          <TouchableOpacity style={styles.btn} onPress={copyLink}><Text style={styles.btnText}>Copiar link</Text></TouchableOpacity>
        </>
      )}

      {section === 'mercadoPago' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Conecta tu cuenta para cobrar con tarjeta. El dinero llega directo a tu Mercado Pago.</Text>
          {kitchen.mercadoPagoConnected ? (
            <>
              <Text style={styles.fieldHint}>Conectado{kitchen.mercadoPagoNickname ? `: ${kitchen.mercadoPagoNickname}` : '.'}</Text>
              <TouchableOpacity style={styles.btnSecondary} onPress={unlinkMercadoPago} disabled={saving}><Text style={styles.btnSecondaryText}>Desconectar Mercado Pago</Text></TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={connectMercadoPago} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.btnText}>Conectar Mercado Pago</Text>}
            </TouchableOpacity>
          )}
        </>
      )}

      {section === 'paymentMethods' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Activa únicamente las formas de pago que aceptarás en el catálogo.</Text>
          {PAYMENT_METHODS.map((method) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodLabel}>{PAYMENT_METHOD_LABELS[method]}</Text>
              <Switch
                value={methods.includes(method)}
                onValueChange={(next) => {
                  if (method === 'tarjeta' && next && !kitchen.mercadoPagoConnected) {
                    Alert.alert('Conecta Mercado Pago', 'Primero conecta tu cuenta para aceptar tarjeta.');
                    return;
                  }
                  toggleMethod(method, next);
                }}
                trackColor={{ false: colors.dangerSoft, true: colors.successSoft }}
                thumbColor={methods.includes(method) ? colors.success : colors.danger}
              />
            </View>
          ))}
          <TouchableOpacity style={styles.btn} onPress={savePayments} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.btnText}>Guardar métodos de pago</Text>}
          </TouchableOpacity>
        </>
      )}

      {section === 'clabe' && isOwner && (
        <>
          <Text style={styles.sectionHint}>Escribe los 18 dígitos de la cuenta que recibirá las transferencias.</Text>
          <TextInput style={styles.input} value={clabe} onChangeText={(value) => setClabe(normalizeClabe(value))} placeholder="Ej. 012345678901234567" placeholderTextColor={colors.muted} keyboardType="number-pad" maxLength={18} />
          <TouchableOpacity style={styles.btn} onPress={savePayments} disabled={saving}><Text style={styles.btnText}>Guardar CLABE</Text></TouchableOpacity>
        </>
      )}

      {section === 'deleteAccount' && isOwner && kitchen.ownerId === uid && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerHint}>Borra definitivamente tu cuenta y todos tus negocios, productos, fotos, pedidos, clientes, equipo e invitaciones. No se puede deshacer.</Text>
          <Text style={styles.label}>Escribe ELIMINAR</Text>
          <TextInput style={styles.input} value={deleteConfirmation} onChangeText={setDeleteConfirmation} placeholder="ELIMINAR" placeholderTextColor={colors.muted} autoCapitalize="characters" editable={!deletingAccount} />
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput style={styles.input} value={deletePassword} onChangeText={setDeletePassword} placeholder="Confirma tu contraseña" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" editable={!deletingAccount} />
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDeleteAccount} disabled={deletingAccount}>
            {deletingAccount ? <ActivityIndicator color={colors.onAccent} /> : <Text style={styles.deleteBtnText}>Eliminar cuenta y todos mis datos</Text>}
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      {notice && <Text style={styles.notice}>{notice}</Text>}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: colors.text, letterSpacing: -0.7 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 3, marginBottom: 14 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 18, marginBottom: 8 },
  backButtonText: { color: colors.accentDark, fontSize: 16, fontWeight: '800' },
  profileMenu: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  profileItem: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  profileIconDanger: { backgroundColor: colors.dangerSoft },
  profileIconText: { color: colors.accentDark, fontSize: 18, fontWeight: '900' },
  profileItemCopy: { flex: 1, marginLeft: 12 },
  profileItemTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  profileItemDescription: { color: colors.muted, fontSize: 12, marginTop: 3 },
  profileTextDanger: { color: colors.danger },
  profileChevron: { color: colors.muted, fontSize: 25, marginLeft: 8 },
  themePicker: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  themeOption: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeOptionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  themePreview: { width: 24, height: 24, borderRadius: 12, borderWidth: 3 },
  themePreviewNormal: { backgroundColor: '#ffffff', borderColor: '#c2410c' },
  themePreviewDark: { backgroundColor: '#15151b', borderColor: '#a855f7' },
  themeOptionText: { color: colors.muted, fontSize: 15, fontWeight: '800' },
  themeOptionTextActive: { color: colors.accentDark },
  qrPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  qrEmoji: { fontSize: 48 },
  qrText: { fontSize: 17, fontWeight: '800', marginTop: 12, color: colors.text },
  qrHint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  linkBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  linkLabel: { fontSize: 12, fontWeight: '600', color: colors.accentDark },
  linkUrl: { fontSize: 15, fontWeight: '700', color: colors.accentDark, marginTop: 6 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 54,
    justifyContent: 'center',
  },
  btnText: { color: colors.onAccent, fontWeight: '900', fontSize: 16 },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  btnSecondaryText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  section: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 30, letterSpacing: -0.2 },
  sectionHint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 12, lineHeight: 18 },
  fieldHint: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  kitchenRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  kitchenName: { fontSize: 16, fontWeight: '800', color: colors.text },
  kitchenMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  kitchenPick: { fontSize: 13, fontWeight: '800', color: colors.accentDark },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    minHeight: 52,
  },
  methodLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  notice: { color: colors.success, fontSize: 13, marginTop: 12 },
  dangerZone: {
    marginTop: 36,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 20,
    backgroundColor: colors.dangerSoft,
  },
  dangerTitle: { fontSize: 18, fontWeight: '800', color: colors.danger },
  dangerHint: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6, marginBottom: 10 },
  deleteBtn: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteBtnText: { color: colors.onAccent, fontWeight: '900', fontSize: 15, textAlign: 'center' },
  footer: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
