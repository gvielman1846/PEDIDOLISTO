import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme';

interface KitchenData {
  name: string;
  slug?: string;
}

interface Props {
  kitchen: KitchenData;
}

export function ShareScreen({ kitchen }: Props) {
  const slug = kitchen.slug ?? 'cocina-dona-carmen';
  const catalogUrl = `https://pedidolisto.mx/${slug}`;

  async function copyLink() {
    await Clipboard.setStringAsync(catalogUrl);
    Alert.alert('Copiado', 'Link copiado al portapapeles');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compartir catálogo</Text>
      <Text style={styles.subtitle}>Tus clientes piden sin instalar app</Text>

      <View style={styles.qrPlaceholder}>
        <Text style={styles.qrEmoji}>📱</Text>
        <Text style={styles.qrText}>QR para mostrador</Text>
        <Text style={styles.qrHint}>(expo-camera en semana 3)</Text>
      </View>

      <View style={styles.linkBox}>
        <Text style={styles.linkLabel}>Tu link público</Text>
        <Text style={styles.linkUrl} selectable>{catalogUrl}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={copyLink}>
        <Text style={styles.btnText}>📋 Copiar link</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSecondary}>
        <Text style={styles.btnSecondaryText}>📸 Compartir en Instagram</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Plan Gratis incluye marca PedidoListo. Pro $99/mes para quitarla.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
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
  footer: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
