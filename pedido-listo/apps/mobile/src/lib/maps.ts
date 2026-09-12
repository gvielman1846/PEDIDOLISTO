import { Alert, Linking } from 'react-native';

function mapsQuery(address: string): string {
  return encodeURIComponent(address.trim());
}

/**
 * Intenta cada url en orden y se queda con la primera que el sistema acepte.
 * No se usa canOpenURL porque para https siempre responde que si, y entonces
 * el enlace universal de Waze termina abriendose en el navegador.
 */
async function openFirstAvailable(urls: string[], fallbackMessage: string): Promise<void> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // la siguiente url puede funcionar
    }
  }

  Alert.alert('No se pudo abrir el mapa', fallbackMessage);
}

export function openInGoogleMaps(address: string): Promise<void> {
  const query = mapsQuery(address);

  return openFirstAvailable(
    [
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      `geo:0,0?q=${query}`,
    ],
    'Revisa que Google Maps este instalado.'
  );
}

export function openInWaze(address: string): Promise<void> {
  const query = mapsQuery(address);

  return openFirstAvailable(
    [
      `waze://?q=${query}&navigate=yes`,
      `https://waze.com/ul?q=${query}&navigate=yes`,
    ],
    'Revisa que Waze este instalado.'
  );
}
