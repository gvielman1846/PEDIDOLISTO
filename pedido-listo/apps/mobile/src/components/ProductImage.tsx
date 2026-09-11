import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Product } from '@pedido-listo/types';
import { resolveProductImageUrl } from '../lib/catalog';
import { colors } from '../theme';

interface Props {
  product: Product;
  size?: number;
}

export function ProductImage({ product, size = 52 }: Props) {
  const [failed, setFailed] = useState(false);
  const url = resolveProductImageUrl(product.imageUrl);
  const box = { width: size, height: size, borderRadius: 12 };

  if (url && !failed) {
    return (
      <Image
        source={url}
        style={box}
        contentFit="cover"
        transition={150}
        onError={() => setFailed(true)}
        accessibilityLabel={product.name}
      />
    );
  }

  return (
    <View style={[styles.placeholder, box]}>
      <Text style={{ fontSize: size * 0.5 }}>{product.emoji ?? '🍽️'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
