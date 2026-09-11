import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { Order } from '@pedido-listo/types';
import { useOrders } from '../hooks/useOrders';
import { formatMXN, formatTime, getStatusColor, ORDER_STATUS_LABELS } from '../lib/orders';
import { formatCustomerPhone } from '../lib/contact';
import { OrderDetailSheet } from './OrderDetailSheet';
import { colors } from '../theme';

interface Props {
  businessId: string;
}

export function OrdersScreen({ businessId }: Props) {
  const { orders, loading, error } = useOrders(businessId);
  const [selected, setSelected] = useState<Order | null>(null);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pedidos</Text>
      <Text style={styles.subtitle}>Toca un pedido para ver el detalle y prepararlo</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Sin pedidos aun</Text>
            <Text style={styles.emptyText}>Cuando un cliente envie un pedido, aparecera aqui</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                  {ORDER_STATUS_LABELS[item.status]}
                </Text>
              </View>
            </View>
            <Text style={styles.customer}>{item.customerName}</Text>
            {item.customerPhone ? (
              <Text style={styles.phone}>{formatCustomerPhone(item.customerPhone)}</Text>
            ) : null}
            <View style={styles.cardBottom}>
              <Text style={styles.items}>{item.items.length} platillo{item.items.length === 1 ? '' : 's'}</Text>
              <Text style={styles.total}>{formatMXN(item.total)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <OrderDetailSheet
        order={selected}
        businessId={businessId}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
  error: { color: colors.danger, marginBottom: 12, fontSize: 13 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  customer: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 8 },
  phone: { fontSize: 13, color: colors.muted, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  items: { fontSize: 13, color: colors.muted },
  total: { fontSize: 16, fontWeight: '800', color: colors.accentDark },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
});
