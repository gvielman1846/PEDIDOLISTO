import { useEffect, useState } from 'react';
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
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  STAFF_ROLE_LABELS,
  enabledPaymentMethods,
  normalizeClabe,
  type PaymentMethod,
  type StaffRole,
} from '@pedido-listo/types';
import {
  changeAccountEmail,
  changeAccountPassword,
  createOwnerBusiness,
  deleteOwnerAccount,
  getFirebaseAuth,
  getUserProfile,
  listUserKitchens,
  saveUserPhone,
  setActiveKitchen,
  signOutOwner,
  toMxMobileDigits,
  updateBusinessPaymentSettings,
  updateBusinessWhatsApp,
  writeOwnerMembership,
  type KitchenAccess,
} from '@pedido-listo/firebase';
import { buildCatalogUrl, slugify } from '../lib/catalog';
import { colors } from '../theme';

interface KitchenData {
  name: string;
  slug?: string;
  businessId: string;
  ownerId?: string;
  role: StaffRole;
  whatsapp?: string;
  paymentMethods?: PaymentMethod[];
  clabe?: string;
}

interface Props {
  kitchen: KitchenData;
  accountEmail: string;
  onKitchenChange: (patch: Partial<KitchenData>) => void;
  onSelectKitchen: (access: KitchenAccess) => void;
}

export function ShareScreen({ kitchen, accountEmail, onKitchenChange, onSelectKitchen }: Props) {
  const uid = getFirebaseAuth().currentUser?.uid;
  const slug = kitchen.slug ?? 'cocina-chef-cueto';
  const catalogUrl = buildCatalogUrl(slug);
  // Si el negocio ya guarda su ownerId, ese dato manda sobre el rol de la sesion.
  const isOwner =
    kitchen.role === 'owner' && (!kitchen.ownerId || kitchen.ownerId === uid);

  const [methods, setMethods] = useState<PaymentMethod[]>(() =>
    enabledPaymentMethods(kitchen)
  );
  const [clabe, setClabe] = useState(kitchen.clabe ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [kitchens, setKitchens] = useState<KitchenAccess[]>([]);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState(kitchen.whatsapp ?? '');
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

  useEffect(() => {
    setMethods(enabledPaymentMethods(kitchen));
    setClabe(kitchen.clabe ?? '');
    setWhatsapp(kitchen.whatsapp ?? '');
  }, [kitchen.businessId, kitchen.clabe, kitchen.paymentMethods, kitchen.whatsapp]);

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

  async function copyLink() {
    await Clipboard.setStringAsync(catalogUrl);
    Alert.alert('Copiado', 'Link copiado al portapapeles');
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

    setSaving(true);
    setError(null);
    try {
      await updateBusinessPaymentSettings(kitchen.businessId, {
        paymentMethods: methods,
        clabe: methods.includes('transferencia') ? digits : digits || null,
      });
      onKitchenChange({ paymentMethods: methods, clabe: digits || undefined });
      Alert.alert('Listo', 'Los metodos de pago ya aparecen en tu catalogo.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el WhatsApp.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el negocio.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Tu cuenta y los negocios de este correo</Text>

      <Text style={styles.section}>Cuenta</Text>
      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder="Ej. maria.lopez@gmail.com"
        placeholderTextColor={colors.muted}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Text style={styles.label}>Contraseña actual</Text>
      <TextInput
        style={styles.input}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Ej. la que usas para entrar"
        placeholderTextColor={colors.muted}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.btn} onPress={saveEmail} disabled={saving}>
        <Text style={styles.btnText}>Cambiar correo</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput
        style={styles.input}
        value={nextPassword}
        onChangeText={setNextPassword}
        placeholder="Ej. minimo 8 caracteres"
        placeholderTextColor={colors.muted}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.btn} onPress={savePassword} disabled={saving}>
        <Text style={styles.btnText}>Cambiar contraseña</Text>
      </TouchableOpacity>

      {isOwner && (
        <>
          <Text style={styles.label}>Numero de celular</Text>
          <Text style={styles.fieldHint}>Solo para contactarte. No recibe los pedidos.</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej. 3312345678"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.btnSecondary} onPress={savePhone} disabled={saving}>
            <Text style={styles.btnSecondaryText}>Guardar celular</Text>
          </TouchableOpacity>

          <Text style={styles.section}>WhatsApp de pedidos</Text>
          <Text style={styles.sectionHint}>
            Aqui llegan los pedidos de tu catalogo. Escribe los 10 digitos, sin la lada 52.
          </Text>
          <TextInput
            style={styles.input}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="Ej. 3312345678"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.btn} onPress={saveWhatsApp} disabled={saving}>
            <Text style={styles.btnText}>Guardar WhatsApp de pedidos</Text>
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.section}>Negocios</Text>
      <Text style={styles.sectionHint}>
        Un mismo correo puede tener varios negocios. Toca el que quieres ver en la app.
      </Text>
      {kitchens.map((access) => {
        const active = access.business.id === kitchen.businessId;
        return (
          <TouchableOpacity
            key={access.business.id}
            style={[styles.kitchenRow, active && styles.kitchenRowActive]}
            onPress={() => void switchKitchen(access)}
            disabled={saving}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.kitchenName}>{access.business.name}</Text>
              <Text style={styles.kitchenMeta}>{STAFF_ROLE_LABELS[access.role]}</Text>
            </View>
            <Text style={styles.kitchenPick}>{active ? 'Actual' : 'Cargar'}</Text>
          </TouchableOpacity>
        );
      })}

      {isOwner && (
        <>
          <Text style={styles.section}>Agregar negocio</Text>
          <Text style={styles.label}>Nombre del negocio</Text>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Ej. Taqueria El Guero"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.label}>Link del catalogo</Text>
          <TextInput
            style={styles.input}
            value={newSlug}
            onChangeText={setNewSlug}
            placeholder="Ej. taqueria-el-guero"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>WhatsApp del negocio</Text>
          <TextInput
            style={styles.input}
            value={newWhatsapp}
            onChangeText={setNewWhatsapp}
            placeholder="Ej. 3312345678"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Colonia / direccion</Text>
          <TextInput
            style={styles.input}
            value={newAddress}
            onChangeText={setNewAddress}
            placeholder="Ej. Alta California Residencial, Tlajomulco"
            placeholderTextColor={colors.muted}
          />
          <TouchableOpacity style={styles.btn} onPress={() => void addKitchen()} disabled={saving}>
            <Text style={styles.btnText}>Crear y cargar este negocio</Text>
          </TouchableOpacity>
        </>
      )}

      {isOwner && (
        <>
          <Text style={styles.section}>Compartir catálogo</Text>
          <Text style={styles.subtitle}>Tus clientes piden sin instalar app</Text>

          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrEmoji}>📱</Text>
            <Text style={styles.qrText}>QR para mostrador</Text>
            <Text style={styles.qrHint}>(expo-camera en semana 3)</Text>
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Tu link público</Text>
            <Text style={styles.linkUrl} selectable>
              {catalogUrl}
            </Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={copyLink}>
            <Text style={styles.btnText}>📋 Copiar link</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>📸 Compartir en Instagram</Text>
          </TouchableOpacity>

          <Text style={styles.section}>Metodos de pago</Text>
          <Text style={styles.sectionHint}>
            Solo los que actives aparecen al cliente. Si elige Transferencia, el WhatsApp lleva tu CLABE.
          </Text>

          {PAYMENT_METHODS.map((method) => (
            <View key={method} style={styles.methodRow}>
              <Text style={styles.methodLabel}>{PAYMENT_METHOD_LABELS[method]}</Text>
              <Switch
                value={methods.includes(method)}
                onValueChange={(next) => toggleMethod(method, next)}
                trackColor={{ false: '#fecaca', true: '#bbf7d0' }}
                thumbColor={methods.includes(method) ? colors.success : colors.danger}
              />
            </View>
          ))}

          {methods.includes('transferencia') && (
            <>
              <Text style={styles.label}>CLABE interbancaria</Text>
              <TextInput
                style={styles.input}
                value={clabe}
                onChangeText={(value) => setClabe(normalizeClabe(value))}
                placeholder="Ej. 012345678901234567"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={18}
              />
            </>
          )}

          <TouchableOpacity style={styles.btn} onPress={savePayments} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnText}>Guardar metodos de pago</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {isOwner && kitchen.ownerId === uid && (
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Eliminar cuenta</Text>
          <Text style={styles.dangerHint}>
            Borra definitivamente tu cuenta y todos tus negocios, productos, fotos,
            pedidos, clientes, equipo e invitaciones. No se puede deshacer.
          </Text>
          <Text style={styles.label}>Escribe ELIMINAR</Text>
          <TextInput
            style={styles.input}
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            placeholder="ELIMINAR"
            placeholderTextColor={colors.muted}
            autoCapitalize="characters"
            editable={!deletingAccount}
          />
          <Text style={styles.label}>Contraseña actual</Text>
          <TextInput
            style={styles.input}
            value={deletePassword}
            onChangeText={setDeletePassword}
            placeholder="Confirma tu contraseña"
            placeholderTextColor={colors.muted}
            secureTextEntry
            autoCapitalize="none"
            editable={!deletingAccount}
          />
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={confirmDeleteAccount}
            disabled={deletingAccount}
          >
            {deletingAccount ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.deleteBtnText}>Eliminar cuenta y todos mis datos</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
      {notice && <Text style={styles.notice}>{notice}</Text>}

      <Text style={styles.footer}>
        Plan Gratis incluye marca PedidoListo. Pro $99/mes para quitarla.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 12 },
  qrPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  qrEmoji: { fontSize: 48 },
  qrText: { fontSize: 16, fontWeight: '700', marginTop: 12, color: colors.text },
  qrHint: { fontSize: 12, color: colors.muted, marginTop: 4 },
  linkBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  linkLabel: { fontSize: 12, fontWeight: '600', color: colors.accentDark },
  linkUrl: { fontSize: 15, fontWeight: '700', color: colors.accentDark, marginTop: 6 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 54,
    justifyContent: 'center',
  },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  btnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 28 },
  sectionHint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 12, lineHeight: 18 },
  fieldHint: { fontSize: 12, color: colors.muted, marginBottom: 6 },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  kitchenRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  kitchenName: { fontSize: 16, fontWeight: '700', color: colors.text },
  kitchenMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  kitchenPick: { fontSize: 13, fontWeight: '800', color: colors.accentDark },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },
  notice: { color: colors.accentDark, fontSize: 13, marginTop: 12 },
  dangerZone: {
    marginTop: 36,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.danger,
  },
  dangerTitle: { fontSize: 18, fontWeight: '800', color: colors.danger },
  dangerHint: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6, marginBottom: 10 },
  deleteBtn: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteBtnText: { color: 'white', fontWeight: '800', fontSize: 15, textAlign: 'center' },
  footer: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
