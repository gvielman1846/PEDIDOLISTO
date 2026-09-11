import { Alert, Linking } from 'react-native';

function mapsQuery(address: string): string {
  return encodeURIComponent(address.trim());
}

async function openUrl(url: string): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('No se pudo abrir la aplicacion de mapas');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir el mapa', 'Revisa que Waze o Google Maps este instalado.');
  }
}

export function openInGoogleMaps(address: string): Promise<void> {
  return openUrl(`https://www.google.com/maps/search/?api=1&query=${mapsQuery(address)}`);
}

export function openInWaze(address: string): Promise<void> {
  return openUrl(`https://waze.com/ul?q=${mapsQuery(address)}&navigate=yes`);
}
