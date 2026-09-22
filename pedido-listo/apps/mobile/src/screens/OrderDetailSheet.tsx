import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Order, StaffRole } from '@pedido-listo/types';
import { PAYMENT_METHOD_LABELS } from '@pedido-listo/types';
import { updateOrderStatus } from '@pedido-listo/firebase';
import { openInGoogleMaps, openInWaze } from '../lib/maps';
import { callCustomer, formatCustomerPhone, whatsappCustomer } from '../lib/contact';
import {
  getPairedPrinters,
  getSavedPrinter,
  isPrintingSupported,
  printToPrinter,
  type PairedPrinter,
} from '../lib/printer';
import { buildOrderReceipt } from '../lib/receipt';
import {
  formatMXN,
  formatTime,
  getDeliveryLabel,
  getNextStatusForRole,
  getStatusColor,
  ORDER_STATUS_LABELS,
} from '../lib/orders';
import { useTheme, type ThemeColors } from '../theme';

interface Props {
  order: Order | null;
  businessId: string;
  businessName: string;
  role: StaffRole;
  onClose: () => void;
}

export function OrderDetailSheet({ order, businessId, businessName, role, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [updating, setUpdating] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [savedPrinter, setSavedPrinter] = useState<PairedPrinter | null>(null);
  const [printers, setPrinters] = useState<PairedPrinter[]>([]);
  const [printerPickerOpen, setPrinterPickerOpen] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void getSavedPrinter().then(setSavedPrinter);
  }, []);

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

  async function printWith(printer: PairedPrinter) {
    if (!order) return;
    setPrinting(true);
    setPrinterPickerOpen(false);
    try {
      await printToPrinter(printer, buildOrderReceipt(order, businessName));
      setSavedPrinter(printer);
      Alert.alert('Pedido impreso', `Se envio a ${printer.name}.`);
    } catch (error) {
      Alert.alert(
        'No se pudo imprimir',
        error instanceof Error ? error.message : 'Revisa la impresora e intenta de nuevo.'
      );
    } finally {
      setPrinting(false);
    }
  }

  async function handlePrint(changePrinter = false) {
    setPrinting(true);
    try {
      const paired = await getPairedPrinters();
      if (paired.length === 0) {
        Alert.alert(
          'No hay impresoras emparejadas',
          'Enciende la impresora y emparejala primero desde Ajustes > Bluetooth del telefono.'
        );
        return;
      }

      const availableSaved = !changePrinter && savedPrinter
        ? paired.find((item) => item.address === savedPrinter.address)
        : null;
      if (availableSaved) {
        await printWith(availableSaved);
        return;
      }
      if (paired.length === 1) {
        await printWith(paired[0]);
        return;
      }
      setPrinters(paired);
      setPrinterPickerOpen(true);
    } catch (error) {
      Alert.alert(
        'No se pudo buscar la impresora',
        error instanceof Error ? error.message : 'Revisa que Bluetooth este encendido.'
      );
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* El fondo va aparte: si la hoja es un Pressable se queda con el
            gesto y la lista de adentro nunca alcanza a desplazarse. */}
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {/* flexShrink deja que la lista ceda el alto que necesitan los botones,
              en vez de adivinarlo con una medida fija que no cuadra en todos los
              telefonos ni cuando el boton de estado no aparece. */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator>
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <Text style={styles.title}>{order.customerName}</Text>
                <Text style={styles.meta}>
                  {formatTime(order.createdAt)} · {getDeliveryLabel(order)}
                  {order.paymentMethod ? ` · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}` : ''}
                  {order.paymentMethod === 'tarjeta' && order.paymentStatus === 'paid' ? ' · Pagado' : ''}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getStatusColor(order.status, colors) + '22' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(order.status, colors) }]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.section}>Productos</Text>
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
                <Text style={styles.section}>Nota para el preparador</Text>
                <Text style={styles.noteBox}>{order.note}</Text>
              </>
            )}
          </ScrollView>

          {isPrintingSupported && (
            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => handlePrint()}
              disabled={printing}
            >
              {printing ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Text style={styles.printText}>🖨 Imprimir</Text>
              )}
            </TouchableOpacity>
          )}
          {isPrintingSupported && savedPrinter && !printing && (
            <TouchableOpacity onPress={() => handlePrint(true)} style={styles.changePrinterBtn}>
              <Text style={styles.changePrinterText}>
                Impresora: {savedPrinter.name} · Cambiar
              </Text>
            </TouchableOpacity>
          )}

          {nextStatus && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: getStatusColor(nextStatus, colors) }]}
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
        </View>

        <Modal
          visible={printerPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPrinterPickerOpen(false)}
        >
          <View style={styles.printerOverlay}>
            <Pressable style={styles.printerBackdrop} onPress={() => setPrinterPickerOpen(false)} />
            <View style={styles.printerCard}>
              <Text style={styles.printerTitle}>Selecciona la impresora</Text>
              <Text style={styles.printerHint}>
                Se muestran los dispositivos emparejados en Ajustes de Bluetooth.
              </Text>
              {printers.map((printer) => (
                <TouchableOpacity
                  key={printer.address}
                  style={styles.printerOption}
                  onPress={() => printWith(printer)}
                >
                  <Text style={styles.printerName}>{printer.name}</Text>
                  <Text style={styles.printerAddress}>{printer.address}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPrinterPickerOpen(false)}
              >
                <Text style={styles.closeText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: 4 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  // Sin flex el nombre y la fecha no cortan linea y empujan la etiqueta fuera
  // de la pantalla.
  headerInfo: { flex: 1 },
  title: { fontSize: 25, lineHeight: 30, fontWeight: '900', color: colors.text, letterSpacing: -0.4 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexShrink: 0 },
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
  totalLabel: { fontSize: 18, fontWeight: '900', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: colors.accentDark },
  noteBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
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
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mapBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
  printBtn: {
    marginTop: 20,
    minHeight: 54,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  changePrinterBtn: { paddingVertical: 8, alignItems: 'center' },
  changePrinterText: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  actionBtn: {
    marginTop: 10,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  actionText: { color: colors.onAccent, fontWeight: '900', fontSize: 16 },
  closeBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  closeText: { color: colors.muted, fontWeight: '600' },
  printerOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  printerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.scrim,
  },
  printerCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  printerTitle: { fontSize: 22, fontWeight: '900', color: colors.text },
  printerHint: { fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 5, marginBottom: 12 },
  printerOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  printerName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  printerAddress: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
