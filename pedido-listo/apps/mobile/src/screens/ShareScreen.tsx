import { useState } from 'react';
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
  enabledPaymentMethods,
  normalizeClabe,
  type PaymentMethod,
} from '@pedido-listo/types';
import { updateBusinessPaymentSettings } from '@pedido-listo/firebase';
import { buildCatalogUrl } from '../lib/catalog';
import { colors } from '../theme';

interface KitchenData {
  name: string;
  slug?: string;
  businessId: string;
  paymentMethods?: PaymentMethod[];
  clabe?: string;
}

interface Props {
  kitchen: KitchenData;
  onKitchenChange: (patch: Partial<KitchenData>) => void;
}

export function ShareScreen({ kitchen, onKitchenChange }: Props) {
  const slug = kitchen.slug ?? 'cocina-chef-cueto';
  const catalogUrl = buildCatalogUrl(slug);
  const [methods, setMethods] = useState<PaymentMethod[]>(() =>
    enabledPaymentMethods(kitchen)
  );
  const [clabe, setClabe] = useState(kitchen.clabe ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Compartir catálogo</Text>
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
            placeholder="18 digitos"
            keyboardType="number-pad"
            maxLength={18}
          />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={styles.btn} onPress={savePayments} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>Guardar metodos de pago</Text>
        )}
      </TouchableOpacity>

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
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 20 },
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
  },
  btnSecondaryText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  section: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 28 },
  sectionHint: { fontSize: 13, color: colors.muted, marginTop: 4, marginBottom: 12, lineHeight: 18 },
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
    letterSpacing: 1,
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
  footer: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
