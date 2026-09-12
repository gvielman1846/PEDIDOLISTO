import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { StaffRole, TeamInvite, TeamMember } from '@pedido-listo/types';
import { STAFF_ROLE_LABELS } from '@pedido-listo/types';
import { cancelInvite, inviteStaff, listInvites, listMembers, removeMember } from '@pedido-listo/firebase';
import { colors } from '../theme';

interface Props {
  businessId: string;
}

export function TeamScreen({ businessId }: Props) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<StaffRole, 'owner'>>('kitchen');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const [nextMembers, nextInvites] = await Promise.all([
      listMembers(businessId),
      listInvites(businessId),
    ]);
    setMembers(nextMembers);
    setInvites(nextInvites);
  }

  useEffect(() => {
    void refresh().catch((err) => {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el equipo');
    });
  }, [businessId]);

  async function handleInvite() {
    setSaving(true);
    setError(null);
    try {
      await inviteStaff(businessId, email, role);
      setEmail('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitacion');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Equipo</Text>
      <Text style={styles.subtitle}>
        Invita con el correo de cada persona. Ellos crean su propia cuenta y entran a esta cocina.
      </Text>

      <Text style={styles.label}>Correo a invitar</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="cocinero@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.chips}>
        {(['kitchen', 'delivery'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, role === option && styles.chipActive]}
            onPress={() => setRole(option)}
          >
            <Text style={[styles.chipText, role === option && styles.chipTextActive]}>
              {STAFF_ROLE_LABELS[option]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleInvite}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? 'Enviando...' : 'Enviar invitacion'}</Text>
      </TouchableOpacity>

      <Text style={styles.section}>Miembros</Text>
      {members.map((member) => (
        <View key={member.id} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{member.email || 'Sin correo'}</Text>
            <Text style={styles.rowMeta}>{STAFF_ROLE_LABELS[member.role]}</Text>
          </View>
          {member.role !== 'owner' && (
            <TouchableOpacity
              onPress={() => {
                void removeMember(businessId, member.id).then(refresh).catch((err) => {
                  setError(err instanceof Error ? err.message : 'No se pudo quitar');
                });
              }}
            >
              <Text style={styles.remove}>Quitar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {invites.length > 0 && <Text style={styles.section}>Pendientes</Text>}
      {invites.map((invite) => (
        <View key={invite.id} style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>{invite.email}</Text>
            <Text style={styles.rowMeta}>{STAFF_ROLE_LABELS[invite.role]} · esperando que cree su cuenta</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              void cancelInvite(invite.id).then(refresh).catch((err) => {
                setError(err instanceof Error ? err.message : 'No se pudo cancelar');
              });
            }}
          >
            <Text style={styles.remove}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { fontWeight: '700', color: colors.muted },
  chipTextActive: { color: colors.accentDark },
  error: { color: colors.danger, marginTop: 12, fontSize: 13, lineHeight: 18 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 28, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  remove: { color: colors.danger, fontWeight: '700', fontSize: 13 },
});
