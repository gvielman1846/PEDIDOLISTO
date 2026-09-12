import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { STAFF_ROLE_LABELS, type StaffRole } from '@pedido-listo/types';
import { colors } from '../theme';

interface KitchenData {
  name: string;
  whatsapp: string;
  neighborhood: string;
  closeTime: string;
}

interface Props {
  kitchen: KitchenData;
  productCount: number;
  role: StaffRole;
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ kitchen, productCount, role, onNavigate }: Props) {
  const canManageMenu = role === 'owner' || role === 'kitchen';
  const canShare = role === 'owner';
  const canInvite = role === 'owner';
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🍲</Text>
        <Text style={styles.title}>{kitchen.name}</Text>
        <Text style={styles.subtitle}>{kitchen.neighborhood || 'Sin zona definida'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {STAFF_ROLE_LABELS[role]} · Cierra {kitchen.closeTime}
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{productCount}</Text>
          <Text style={styles.statLabel}>Platillos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>Gratis</Text>
          <Text style={styles.statLabel}>Plan actual</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.action} onPress={() => onNavigate('orders')}>
        <Text style={styles.actionEmoji}>🛒</Text>
        <View>
          <Text style={styles.actionTitle}>Ver pedidos</Text>
          <Text style={styles.actionDesc}>
            {role === 'delivery' ? 'Direccion, mapa y marcar entregado' : 'Lista en tiempo real para preparar'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={() => onNavigate('calendar')}>
        <Text style={styles.actionEmoji}>📅</Text>
        <View>
          <Text style={styles.actionTitle}>Calendario</Text>
          <Text style={styles.actionDesc}>Pedidos de dias anteriores</Text>
        </View>
      </TouchableOpacity>

      {canManageMenu && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('menu')}>
          <Text style={styles.actionEmoji}>📋</Text>
          <View>
            <Text style={styles.actionTitle}>Gestionar menú</Text>
            <Text style={styles.actionDesc}>
              {role === 'kitchen' ? 'Marcar platillos agotados' : 'Agregar platillos, marcar agotados'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {canShare && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('share')}>
          <Text style={styles.actionEmoji}>🔗</Text>
          <View>
            <Text style={styles.actionTitle}>Compartir catálogo</Text>
            <Text style={styles.actionDesc}>Link, QR e Instagram</Text>
          </View>
        </TouchableOpacity>
      )}

      {canInvite && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('team')}>
          <Text style={styles.actionEmoji}>👥</Text>
          <View>
            <Text style={styles.actionTitle}>Equipo</Text>
            <Text style={styles.actionDesc}>Invitar cocina y entrega</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  hero: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 22, fontWeight: '700', color: 'white', marginTop: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
  },
  badgeText: { color: 'white', fontWeight: '600', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '700', color: colors.accentDark },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionEmoji: { fontSize: 28 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  actionDesc: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
