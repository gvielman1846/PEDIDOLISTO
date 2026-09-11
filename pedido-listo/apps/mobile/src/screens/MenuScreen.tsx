import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Category, Product } from '@pedido-listo/types';
import { ProductImage } from '../components/ProductImage';
import { NewProductSheet } from './NewProductSheet';
import type { NewProductDraft } from '../hooks/useProducts';
import { colors } from '../theme';

interface Props {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  onToggleAvailable: (productId: string, available: boolean) => void;
  /** Devuelve un aviso cuando el platillo se guardo pero la foto no. */
  onAddProduct: (draft: NewProductDraft) => Promise<string | null>;
  onEditProduct: (productId: string, draft: NewProductDraft) => Promise<string | null>;
  onRemoveProduct: (productId: string) => Promise<void>;
}

export function MenuScreen({
  products,
  categories,
  loading,
  error,
  onToggleAvailable,
  onAddProduct,
  onEditProduct,
  onRemoveProduct,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function confirmDelete(product: Product) {
    Alert.alert(
      'Eliminar platillo',
      `¿Quitar "${product.name}" del menu? Tambien desaparecera del catalogo web.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemoveProduct(product.id!);
            } catch {
              // el hook ya guarda el error visible
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú del día</Text>
      <Text style={styles.subtitle}>Marca platillos agotados o eliminalos del menu</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {notice && (
        <TouchableOpacity style={styles.notice} onPress={() => setNotice(null)}>
          <Text style={styles.noticeText}>{notice}</Text>
          <Text style={styles.noticeHint}>Toca para ocultar</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Sin platillos aun</Text>
            <Text style={styles.emptyText}>
              Los platillos de tu catálogo web apareceran aqui
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.available && styles.cardOff]}>
            <ProductImage product={item} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price} MXN</Text>
              {!item.available && <Text style={styles.soldOut}>Agotado hoy</Text>}
            </View>
            <View style={styles.actions}>
              <View style={styles.toggle}>
                <Text style={styles.toggleLabel}>{item.available ? 'Disponible' : 'Agotado'}</Text>
                <Switch
                  value={item.available}
                  onValueChange={(next) => onToggleAvailable(item.id!, next)}
                  trackColor={{ false: '#fecaca', true: '#bbf7d0' }}
                  thumbColor={item.available ? colors.success : colors.danger}
                />
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setEditing(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.editText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => setAdding(true)}>
            <Text style={styles.addBtnText}>+ Agregar platillo</Text>
          </TouchableOpacity>
        }
      />

      <NewProductSheet
        visible={adding || Boolean(editing)}
        product={editing}
        categories={categories}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        onSubmit={async (draft) => {
          if (editing?.id) {
            setNotice(await onEditProduct(editing.id, draft));
            return;
          }
          setNotice(await onAddProduct(draft));
        }}
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
  notice: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noticeText: { color: colors.accentDark, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  noticeHint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  cardOff: { opacity: 0.65 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 14, color: colors.accentDark, fontWeight: '600', marginTop: 2 },
  soldOut: { fontSize: 12, color: colors.danger, fontWeight: '700', marginTop: 4 },
  actions: { alignItems: 'flex-end', gap: 8 },
  toggle: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 10, color: colors.muted, fontWeight: '600' },
  deleteBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  editText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  deleteText: { fontSize: 12, fontWeight: '700', color: colors.danger },
  addBtn: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
});
