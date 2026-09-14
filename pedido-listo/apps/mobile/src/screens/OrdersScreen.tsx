import { useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type { Order, StaffRole } from '@pedido-listo/types';
import { PAYMENT_METHOD_LABELS } from '@pedido-listo/types';
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
  summarizeDaySales,
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
  // Pedidos de hoy solo muestra nombre y productos; Ventas conserva la tarjeta completa.
  compact?: boolean;
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
  compact = false,
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
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id!}
        style={styles.listFlex}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          header ? <View style={styles.listHeader}>{header}</View> : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            {compact ? (
              <>
                <View style={styles.cardTop}>
                  <Text style={styles.customerCompact}>{item.customerName}</Text>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                    <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                      {ORDER_STATUS_LABELS[item.status]}
                    </Text>
                  </View>
                </View>
                {item.items.map((line) => (
                  <View key={`${item.id}-${line.productId}`} style={styles.previewLine}>
                    <Text style={styles.previewQty}>{line.quantity}×</Text>
                    <Text style={styles.previewName}>{line.name}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
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
                {item.paymentMethod ? (
                  <Text style={styles.phone}>{PAYMENT_METHOD_LABELS[item.paymentMethod]}</Text>
                ) : null}
                <View style={styles.cardBottom}>
                  <Text style={styles.items}>
                    {item.items.length} producto{item.items.length === 1 ? '' : 's'}
                  </Text>
                  <Text style={styles.total}>{formatMXN(item.total)}</Text>
                </View>
              </>
            )}
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
      emptyText="Cuando un cliente envie un pedido, aparecera aqui. El historial esta en Ventas."
      compact
    />
  );
}

function CashCutCard({ orders }: { orders: Order[] }) {
  const cut = useMemo(() => summarizeDaySales(orders), [orders]);

  return (
    <View style={styles.cutCard}>
      <Text style={styles.cutTitle}>Corte de caja</Text>
      <Text style={styles.cutHint}>Solo pedidos entregados</Text>
      {cut.lines.length === 0 ? (
        <Text style={styles.cutEmpty}>Aun no hay pedidos entregados este dia.</Text>
      ) : (
        cut.lines.map((line) => (
          <View key={line.key} style={styles.cutRow}>
            <Text style={styles.cutName} numberOfLines={2}>
              {line.name}
            </Text>
            <View style={styles.cutMeta}>
              <Text style={styles.cutMetaText}>
                P. unitario {formatMXN(line.unitPrice)} · {line.quantity} vendido
                {line.quantity === 1 ? '' : 's'}
              </Text>
              <Text style={styles.cutSale}>{formatMXN(line.amount)}</Text>
            </View>
          </View>
        ))
      )}
      {cut.deliveryTotal > 0 && (
        <View style={styles.cutRow}>
          <Text style={styles.cutName}>Envios</Text>
          <View style={styles.cutMeta}>
            <Text style={styles.cutMetaText}>Costo de entrega</Text>
            <Text style={styles.cutSale}>{formatMXN(cut.deliveryTotal)}</Text>
          </View>
        </View>
      )}
      <View style={styles.cutTotalRow}>
        <Text style={styles.cutTotalLabel}>Total del dia</Text>
        <Text style={styles.cutTotalValue}>{formatMXN(cut.total)}</Text>
      </View>
    </View>
  );
}

export function CalendarScreen({ businessId, role }: { businessId: string; role: StaffRole }) {
  const { orders, loading, error } = useOrders(businessId);
  const today = dayKey();
  const days = useMemo(() => {
    const counts = new Map<string, { date: Date; count: number }>();
    counts.set(today, { date: startOfLocalDay(), count: 0 });
    for (const order of orders) {
      const key = dayKey(order.createdAt);
      const date = startOfLocalDay(order.createdAt ?? new Date());
      const current = counts.get(key);
      counts.set(key, { date, count: (current?.count ?? 0) + 1 });
    }
    return [...counts.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, value]) => ({ key, ...value }));
  }, [orders, today]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const activeDay = selectedDay && days.some((day) => day.key === selectedDay)
    ? selectedDay
    : today;

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
      title="Ventas"
      subtitle="Corte de caja y pedidos del dia"
      emptyTitle="Sin pedidos este dia"
      emptyText="El corte de caja aparece arriba. Elige otro dia o espera el primer pedido."
      header={
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.days}
            style={styles.daysList}
          >
            {days.map((item) => {
              const active = item.key === activeDay;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => setSelectedDay(item.key)}
                >
                  <Text
                    style={[styles.dayChipText, active && styles.dayChipTextActive]}
                    numberOfLines={1}
                  >
                    {item.key === today ? 'Hoy' : formatDayLabel(item.date)}
                  </Text>
                  <Text style={[styles.dayChipCount, active && styles.dayChipTextActive]}>
                    {item.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <CashCutCard orders={dayOrders} />
        </>
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
  // Sin flex la lista crece con su contenido y se pasa de la pantalla, asi que
  // el scroll se corta antes del ultimo pedido.
  listFlex: { flex: 1 },
  listHeader: { marginBottom: 12 },
  list: { gap: 10, paddingBottom: 24, flexGrow: 1 },
  cutCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cutTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  cutHint: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 4 },
  cutEmpty: { fontSize: 13, color: colors.muted, paddingVertical: 8 },
  cutRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cutName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  cutMetaText: { flex: 1, fontSize: 12, color: colors.muted },
  cutSale: { fontSize: 15, fontWeight: '800', color: colors.text },
  cutTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.text,
  },
  cutTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  cutTotalValue: { fontSize: 18, fontWeight: '800', color: colors.accentDark },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  time: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  customer: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 8 },
  customerCompact: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, marginRight: 8 },
  previewLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 3 },
  previewQty: { width: 28, fontWeight: '700', color: colors.accent },
  previewName: { flex: 1, fontSize: 15, color: colors.text },
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 96,
  },
  dayChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  // Sin textTransform: Android mide el texto original y lo deja fuera del chip.
  dayChipText: { fontSize: 13, fontWeight: '700', color: colors.text },
  dayChipCount: { fontSize: 12, color: colors.muted, marginTop: 2 },
  dayChipTextActive: { color: colors.accentDark },
});
