import { useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { Order, StaffRole } from '@pedido-listo/types';
import { useOrders } from '../hooks/useOrders';
import {
  dayKey,
  formatDayLabel,
  formatMXN,
  formatTime,
  getStatusColor,
  isSameLocalDay,
  ORDER_STATUS_LABELS,
  startOfLocalDay,
} from '../lib/orders';
import { formatCustomerPhone } from '../lib/contact';
import { OrderDetailSheet } from './OrderDetailSheet';
import { colors } from '../theme';

interface ListProps {
  businessId: string;
  role: StaffRole;
  orders: Order[];
  loading: boolean;
  error: string | null;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyText: string;
  header?: ReactNode;
}

export function OrderList({
  businessId,
  role,
  orders,
  loading,
  error,
  title,
  subtitle,
  emptyTitle,
  emptyText,
  header,
}: ListProps) {
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {header}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
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
              <Text style={styles.items}>
                {item.items.length} platillo{item.items.length === 1 ? '' : 's'}
              </Text>
              <Text style={styles.total}>{formatMXN(item.total)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <OrderDetailSheet
        order={selected}
        businessId={businessId}
        role={role}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

export function OrdersScreen({ businessId, role }: { businessId: string; role: StaffRole }) {
  const { orders, loading, error } = useOrders(businessId);
  const todayOrders = useMemo(
    () => orders.filter((order) => isSameLocalDay(order.createdAt)),
    [orders]
  );

  return (
    <OrderList
      businessId={businessId}
      role={role}
      orders={todayOrders}
      loading={loading}
      error={error}
      title="Pedidos de hoy"
      subtitle="Solo aparecen los pedidos de este dia"
      emptyTitle="Sin pedidos hoy"
      emptyText="Cuando un cliente envie un pedido, aparecera aqui. El historial esta en Calendario."
    />
  );
}

export function CalendarScreen({ businessId, role }: { businessId: string; role: StaffRole }) {
  const { orders, loading, error } = useOrders(businessId);
  const days = useMemo(() => {
    const today = dayKey();
    const counts = new Map<string, { date: Date; count: number }>();
    for (const order of orders) {
      const key = dayKey(order.createdAt);
      if (key === today) continue;
      const date = startOfLocalDay(order.createdAt ?? new Date());
      const current = counts.get(key);
      counts.set(key, { date, count: (current?.count ?? 0) + 1 });
    }
    return [...counts.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({ key, ...value }));
  }, [orders]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const activeDay = selectedDay && days.some((day) => day.key === selectedDay)
    ? selectedDay
    : days[0]?.key ?? null;

  const dayOrders = useMemo(
    () => orders.filter((order) => dayKey(order.createdAt) === activeDay),
    [orders, activeDay]
  );

  return (
    <OrderList
      businessId={businessId}
      role={role}
      orders={dayOrders}
      loading={loading}
      error={error}
      title="Calendario"
      subtitle="Pedidos de dias anteriores"
      emptyTitle={days.length === 0 ? 'Sin historial' : 'Sin pedidos ese dia'}
      emptyText={
        days.length === 0
          ? 'Cuando cierren el dia, los pedidos pasados apareceran aqui.'
          : 'Elige otro dia en la lista de arriba.'
      }
      header={
        days.length > 0 ? (
          <FlatList
            horizontal
            data={days}
            keyExtractor={(item) => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
            style={styles.daysList}
            renderItem={({ item }) => {
              const active = item.key === activeDay;
              return (
                <TouchableOpacity
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setSelectedDay(item.key)}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                    {formatDayLabel(item.date)}
                  </Text>
                  <Text style={[styles.dayChipCount, active && styles.dayChipTextActive]}>
                    {item.count}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : null
      }
    />
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
  daysList: { marginBottom: 12, flexGrow: 0 },
  days: { gap: 8, paddingBottom: 4 },
  dayChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
  },
  dayChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  dayChipText: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'capitalize' },
  dayChipCount: { fontSize: 12, color: colors.muted, marginTop: 2 },
  dayChipTextActive: { color: colors.accentDark },
});
