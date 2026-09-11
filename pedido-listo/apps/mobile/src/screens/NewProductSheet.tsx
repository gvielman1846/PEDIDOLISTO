import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import type { Category, Product } from '@pedido-listo/types';
import type { NewProductDraft } from '../hooks/useProducts';
import { resolveProductImageUrl } from '../lib/catalog';
import { colors } from '../theme';

const FALLBACK_CATEGORY = 'general';

interface Props {
  visible: boolean;
  categories: Category[];
  product?: Product | null;
  onClose: () => void;
  onSubmit: (draft: NewProductDraft) => Promise<void>;
}

export function NewProductSheet({ visible, categories, product, onClose, onSubmit }: Props) {
  const isEditing = Boolean(product);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setPrice('');
    setDescription('');
    setEmoji('');
    setCategoryId('');
    setPhoto(null);
    setError(null);
  }

  useEffect(() => {
    if (!visible) return;

    if (product) {
      setName(product.name);
      setPrice(String(product.price));
      setDescription(product.description ?? '');
      setEmoji(product.emoji ?? '');
      setCategoryId(product.categoryId ?? '');
      setPhoto(null);
      setError(null);
      return;
    }

    reset();
  }, [visible, product]);

  function handleClose() {
    if (saving) return;
    reset();
    onClose();
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled) setPhoto(result.assets[0]);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Necesitamos permiso de camara para tomar la foto.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });

    if (!result.canceled) setPhoto(result.assets[0]);
  }

  async function handleSave() {
    const parsedPrice = Number(price.replace(',', '.'));

    if (!name.trim()) {
      setError('Ponle nombre al platillo.');
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError('El precio debe ser un numero mayor a cero.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: parsedPrice,
        categoryId: categoryId || categories[0]?.id || FALLBACK_CATEGORY,
        emoji: emoji.trim() || undefined,
        imageUri: photo?.uri,
        imageMimeType: photo?.mimeType ?? undefined,
      });

      Keyboard.dismiss();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el platillo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>{isEditing ? 'Editar platillo' : 'Nuevo platillo'}</Text>

              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Pozole rojo"
              />

              <Text style={styles.label}>Precio en pesos</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="75"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Descripcion</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Que incluye, tamano, porciones"
                multiline
              />

              {categories.length > 0 && (
                <>
                  <Text style={styles.label}>Categoria</Text>
                  <View style={styles.chips}>
                    {categories.map((category) => {
                      const active = (categoryId || categories[0]?.id) === category.id;
                      return (
                        <TouchableOpacity
                          key={category.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setCategoryId(category.id!)}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <Text style={styles.label}>Foto</Text>
              {(photo || resolveProductImageUrl(product?.imageUrl)) && (
                <Image
                  source={photo?.uri ?? resolveProductImageUrl(product?.imageUrl)!}
                  style={styles.preview}
                  contentFit="cover"
                />
              )}
              <View style={styles.photoRow}>
                <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                  <Text style={styles.photoBtnText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtn} onPress={pickFromLibrary}>
                  <Text style={styles.photoBtnText}>Elegir de galeria</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Emoji (si no subes foto)</Text>
              <TextInput
                style={styles.input}
                value={emoji}
                onChangeText={setEmoji}
                placeholder="🥣"
                maxLength={4}
              />

              {error && <Text style={styles.error}>{error}</Text>}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveText}>
                {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar platillo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  multiline: { minHeight: 76, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: colors.accentDark },
  preview: { width: '100%', height: 160, borderRadius: 14, marginBottom: 10 },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  photoBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  error: { color: colors.danger, fontSize: 13, marginTop: 14, lineHeight: 18 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 18,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: 'white', fontWeight: '700', fontSize: 16 },
  closeBtn: { marginTop: 10, padding: 12, alignItems: 'center' },
  closeText: { color: colors.muted, fontWeight: '600' },
});
