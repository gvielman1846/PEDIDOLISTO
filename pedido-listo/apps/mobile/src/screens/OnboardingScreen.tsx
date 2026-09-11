import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme';

interface Props {
  onComplete: (data: {
    catalogSlug: string;
    whatsapp: string;
    neighborhood: string;
    closeTime: string;
  }) => void;
  loading?: boolean;
  error?: string | null;
}

export function OnboardingScreen({ onComplete, loading = false, error = null }: Props) {
  const [catalogSlug, setCatalogSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [closeTime, setCloseTime] = useState('20:00');

  function handleSubmit() {
    if (!catalogSlug.trim() || !whatsapp.trim()) return;
    onComplete({
      catalogSlug: catalogSlug.trim(),
      whatsapp: whatsapp.trim(),
      neighborhood: neighborhood.trim(),
      closeTime,
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>🍲</Text>
        <Text style={styles.title}>Conecta tu cocina</Text>
        <Text style={styles.subtitle}>Vincula tu negocio para ver pedidos en tiempo real</Text>

        <Text style={styles.label}>Link de tu catálogo</Text>
        <TextInput
          style={styles.input}
          value={catalogSlug}
          onChangeText={setCatalogSlug}
          placeholder="restaurant-antiguos"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Solo la parte final del link: pedidolisto.../restaurant-antiguos</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>WhatsApp para pedidos</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="5512345678"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Colonia / zona de entrega</Text>
        <TextInput
          style={styles.input}
          value={neighborhood}
          onChangeText={setNeighborhood}
          placeholder="Ej. Alta California Residencial, Tlajomulco"
        />

        <Text style={styles.label}>Hora de cierre</Text>
        <TextInput
          style={styles.input}
          value={closeTime}
          onChangeText={setCloseTime}
          placeholder="20:00"
        />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Conectando...' : 'Entrar a mi cocina'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 24, paddingTop: 48 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  error: { fontSize: 13, color: colors.danger, marginTop: 10, lineHeight: 18 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
