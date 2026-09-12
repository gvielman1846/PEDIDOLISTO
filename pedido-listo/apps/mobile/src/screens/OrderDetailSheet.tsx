import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import type { Order, StaffRole } from '@pedido-listo/types';
import { updateOrderStatus } from '@pedido-listo/firebase';
import { openInGoogleMaps, openInWaze } from '../lib/maps';
import { callCustomer, formatCustomerPhone, whatsappCustomer } from '../lib/contact';
import {
  formatMXN,
  formatTime,
  getDeliveryLabel,
  getNextStatusForRole,
  getStatusColor,
  ORDER_STATUS_LABELS,
} from '../lib/orders';
import { colors } from '../theme';

interface Props {
  order: Order | null;
  businessId: string;
  role: StaffRole;
  onClose: () => void;
}

export function OrderDetailSheet({ order, businessId, role, onClose }: Props) {
  const [updating, setUpdating] = useState(false);

  if (!order) return null;

  const nextStatus = getNextStatusForRole(order.status, role);

  async function handleAdvanceStatus() {
    if (!order || !nextStatus) return;
    setUpdating(true);
    try {
      await updateOrderStatus(businessId, order.id!, nextStatus);
      if (nextStatus === 'entregado') onClose();
    } catch {
      // keep sheet open on error
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{order.customerName}</Text>
                <Text style={styles.meta}>{formatTime(order.createdAt)} · {getDeliveryLabel(order)}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) + '22' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(order.status) }]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.section}>Platillos</Text>
            {order.items.map((item) => (
              <View key={item.productId} style={styles.line}>
                <Text style={styles.lineQty}>{item.quantity}×</Text>
                <Text style={styles.lineName}>{item.name}</Text>
                <Text style={styles.linePrice}>{formatMXN(item.price * item.quantity)}</Text>
              </View>
            ))}

            {order.deliveryFee > 0 && (
              <View style={styles.line}>
                <Text style={styles.lineName}>Envio</Text>
                <Text style={styles.linePrice}>{formatMXN(order.deliveryFee)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatMXN(order.total)}</Text>
            </View>

            {order.customerPhone && (
              <>
                <Text style={styles.section}>Celular</Text>
                <Text style={styles.noteBox}>{formatCustomerPhone(order.customerPhone)}</Text>
                <View style={styles.mapRow}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => whatsappCustomer(order.customerPhone!)}
                  >
                    <Text style={styles.mapBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => callCustomer(order.customerPhone!)}
                  >
                    <Text style={styles.mapBtnText}>Llamar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {order.address && (
              <>
                <Text style={styles.section}>Direccion</Text>
                <Text style={styles.noteBox}>{order.address}</Text>
                <View style={styles.mapRow}>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => openInWaze(order.address!)}
                  >
                    <Text style={styles.mapBtnText}>Abrir en Waze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.mapBtn}
                    onPress={() => openInGoogleMaps(order.address!)}
                  >
                    <Text style={styles.mapBtnText}>Abrir en Maps</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {order.note && (
              <>
                <Text style={styles.section}>Nota para cocina</Text>
                <Text style={styles.noteBox}>{order.note}</Text>
              </>
            )}
          </ScrollView>

          {nextStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: getStatusColor(nextStatus) }]}
              onPress={handleAdvanceStatus}
              disabled={updating}
            >
              <Text style={styles.actionText}>
                {updating ? 'Actualizando...' : `Marcar como ${ORDER_STATUS_LABELS[nextStatus]}`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.muted,
    marginTop: 16,
    marginBottom: 8,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  lineQty: { width: 28, fontWeight: '700', color: colors.accent },
  lineName: { flex: 1, fontSize: 15, color: colors.text },
  linePrice: { fontWeight: '700', color: colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 18, fontWeight: '800' },
  totalValue: { fontSize: 18, fontWeight: '800', color: colors.accentDark },
  noteBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.accentDark,
    lineHeight: 22,
  },
  mapRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  mapBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  actionBtn: {
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  actionText: { color: 'white', fontWeight: '700', fontSize: 16 },
  closeBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  closeText: { color: colors.muted, fontWeight: '600' },
});
