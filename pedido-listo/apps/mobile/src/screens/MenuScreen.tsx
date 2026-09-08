import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch } from 'react-native';
import type { Product } from '@pedido-listo/types';
import { colors } from '../theme';

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Tacos de guisado (3 pzas)', description: 'Tinga, picadillo o chicharrón', price: 45, categoryId: 'antojitos', emoji: '🌮', available: true, order: 0 },
  { id: '2', name: 'Enchiladas verdes', description: 'Pollo, arroz y frijoles', price: 95, categoryId: 'platos', emoji: '🍽️', available: true, order: 1 },
  { id: '3', name: 'Mole con pollo', description: '2 piezas, arroz y tortillas', price: 110, categoryId: 'platos', emoji: '🍗', available: false, order: 2 },
  { id: '4', name: 'Agua de horchata', description: '1 litro', price: 40, categoryId: 'bebidas', emoji: '🥤', available: true, order: 3 },
];

interface Props {
  onProductCountChange: (count: number) => void;
}

export function MenuScreen({ onProductCountChange }: Props) {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  function toggleAvailable(id: string) {
    setProducts((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, available: !p.available } : p
      );
      onProductCountChange(next.length);
      return next;
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menú del día</Text>
      <Text style={styles.subtitle}>Marca platillos agotados con un tap</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.available && styles.cardOff]}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price} MXN</Text>
              {!item.available && <Text style={styles.soldOut}>Agotado hoy</Text>}
            </View>
            <View style={styles.toggle}>
              <Text style={styles.toggleLabel}>{item.available ? 'Disponible' : 'Agotado'}</Text>
              <Switch
                value={item.available}
                onValueChange={() => toggleAvailable(item.id!)}
                trackColor={{ false: '#fecaca', true: '#bbf7d0' }}
                thumbColor={item.available ? colors.success : colors.danger}
              />
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Agregar platillo</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, paddingTop: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginBottom: 16 },
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
  emoji: { fontSize: 32 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 14, color: colors.accentDark, fontWeight: '600', marginTop: 2 },
  soldOut: { fontSize: 12, color: colors.danger, fontWeight: '700', marginTop: 4 },
  toggle: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 10, color: colors.muted, fontWeight: '600' },
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
