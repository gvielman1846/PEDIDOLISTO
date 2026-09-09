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
  onComplete: (data: { name: string; whatsapp: string; neighborhood: string; closeTime: string }) => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [closeTime, setCloseTime] = useState('20:00');

  function handleSubmit() {
    if (!name.trim() || !whatsapp.trim()) return;
    onComplete({
      name: name.trim(),
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
        <Text style={styles.title}>Configura tu cocina</Text>
        <Text style={styles.subtitle}>En 2 minutos tendrás tu menú listo para compartir</Text>

        <Text style={styles.label}>Nombre de tu cocina</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej. Cocina Chef Cueto"
        />

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

        <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Crear mi menú</Text>
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
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});
