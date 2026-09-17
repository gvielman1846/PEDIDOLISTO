import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { STAFF_ROLE_LABELS, type StaffRole } from '@pedido-listo/types';
import { colors, gradients } from '../theme';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>PEDIDOLISTO</Text>
        <Text style={styles.title}>{kitchen.name}</Text>
        <Text style={styles.subtitle}>{kitchen.neighborhood || 'Sin zona definida'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {STAFF_ROLE_LABELS[role]} · Cierra {kitchen.closeTime}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{productCount}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>Gratis</Text>
          <Text style={styles.statLabel}>Plan actual</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.action} onPress={() => onNavigate('orders')}>
        <Text style={styles.actionEmoji}>🛒</Text>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>Ver pedidos</Text>
          <Text style={styles.actionDesc}>
            {role === 'delivery' ? 'Direccion, mapa y marcar entregado' : 'Lista en tiempo real para preparar'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.action} onPress={() => onNavigate('calendar')}>
        <Text style={styles.actionEmoji}>📅</Text>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>Ventas</Text>
          <Text style={styles.actionDesc}>Pedidos de dias anteriores</Text>
        </View>
      </TouchableOpacity>

      {canManageMenu && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('menu')}>
          <Text style={styles.actionEmoji}>📋</Text>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Productos</Text>
            <Text style={styles.actionDesc}>
              {role === 'kitchen' ? 'Marcar productos agotados' : 'Agregar productos, marcar agotados'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {canShare && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('share')}>
          <Text style={styles.actionEmoji}>🔗</Text>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Perfil</Text>
            <Text style={styles.actionDesc}>Link, QR e Instagram</Text>
          </View>
        </TouchableOpacity>
      )}

      {canInvite && (
        <TouchableOpacity style={styles.action} onPress={() => onNavigate('team')}>
          <Text style={styles.actionEmoji}>👥</Text>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Equipo</Text>
            <Text style={styles.actionDesc}>Invitar preparador y entrega</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 32 },
  hero: {
    borderRadius: 28,
    padding: 26,
    paddingTop: 54,
    minHeight: 220,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroOrb: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.13)',
    top: -70,
    right: -40,
  },
  eyebrow: { fontSize: 11, letterSpacing: 2.4, fontWeight: '900', color: 'rgba(255,255,255,0.76)' },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: colors.onAccent, marginTop: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.82)', marginTop: 6 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
  },
  badgeText: { color: colors.onAccent, fontWeight: '700', fontSize: 12 },
  stats: { flexDirection: 'row', gap: 12, marginTop: 20 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 13, color: colors.muted, marginTop: 4 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 17,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionEmoji: { fontSize: 24 },
  actionCopy: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  actionDesc: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 18 },
});
