import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Category } from '@pedido-listo/types';
import { colors } from '../theme';

const BASE_CATEGORY_IDS = new Set(['antojitos', 'platos', 'bebidas', 'postres']);

interface Props {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  onEdit: (categoryId: string, name: string) => Promise<void>;
  onRemove: (categoryId: string) => Promise<void>;
}

export function CategorySheet({
  visible,
  categories,
  onClose,
  onAdd,
  onEdit,
  onRemove,
}: Props) {
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEditing(null);
    setName('');
    setError(null);
  }

  function close() {
    resetForm();
    onClose();
  }

  function startEditing(category: Category) {
    setEditing(category);
    setName(category.name);
    setError(null);
  }

  async function save() {
    const normalized = name.trim();
    if (!normalized) {
      setError('Escribe el nombre de la categoria.');
      return;
    }
    if (
      categories.some(
        (category) =>
          category.id !== editing?.id &&
          category.name.trim().toLowerCase() === normalized.toLowerCase()
      )
    ) {
      setError('Ya existe una categoria con ese nombre.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editing?.id) await onEdit(editing.id, normalized);
      else await onAdd(normalized);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la categoria.');
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(category: Category) {
    Alert.alert(
      'Eliminar categoria',
      `¿Eliminar "${category.name}"? Solo se puede si no tiene productos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemove(category.id!);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoria.');
            }
          },
        },
      ]
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={close} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Categorias de productos</Text>
          <Text style={styles.subtitle}>
            Se muestran también en el catalogo de tus clientes.
          </Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {categories.map((category) => (
              <View key={category.id} style={styles.row}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <TouchableOpacity style={styles.smallButton} onPress={() => startEditing(category)}>
                  <Text style={styles.editText}>Editar</Text>
                </TouchableOpacity>
                {!BASE_CATEGORY_IDS.has(category.id!) && (
                  <TouchableOpacity style={styles.smallButton} onPress={() => confirmRemove(category)}>
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>

          <Text style={styles.label}>{editing ? 'Editar categoria' : 'Nueva categoria'}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej. Desayunos"
            maxLength={40}
          />
          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveText}>{editing ? 'Guardar nombre' : '+ Agregar categoria'}</Text>
            )}
          </TouchableOpacity>
          {editing && (
            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancelar edicion</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={close}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 3, marginBottom: 14 },
  list: { maxHeight: 250 },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  smallButton: { paddingVertical: 10, paddingLeft: 14 },
  editText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
  saveButton: {
    minHeight: 50,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveText: { color: 'white', fontWeight: '800', fontSize: 15 },
  cancelButton: { alignItems: 'center', padding: 10 },
  cancelText: { color: colors.accent, fontWeight: '700' },
  closeButton: { alignItems: 'center', padding: 12 },
  closeText: { color: colors.muted, fontWeight: '700' },
});
