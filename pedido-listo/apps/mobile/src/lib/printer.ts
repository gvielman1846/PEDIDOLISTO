import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsAndroid, Platform } from 'react-native';
import EscPosPrinter, {
  type PairedPrinter,
} from '../../modules/esc-pos-printer';

const SAVED_PRINTER_KEY = '@pedidolisto/esc-pos-printer';

function friendlyPrinterError(error: unknown, fallback: string): Error {
  const message = error instanceof Error ? error.message : fallback;
  const nativeCause = message.match(/java\.lang\.Exception:\s*([^\n]+)/)?.[1];
  return new Error(nativeCause ?? message);
}

export const isPrintingSupported =
  (Platform.OS === 'android' || Platform.OS === 'ios') && EscPosPrinter !== null;

// Android imprime por Bluetooth Classic y solo ve equipos ya emparejados;
// iOS usa BLE y descubre la impresora en el momento.
export const printerDiscoveryHint =
  Platform.OS === 'android'
    ? 'Se muestran las impresoras emparejadas en Ajustes > Bluetooth.'
    : 'Se muestran las impresoras Bluetooth disponibles cerca del telefono.';

export const printerNotFoundMessage =
  Platform.OS === 'android'
    ? 'Enciende la impresora y emparejala en Ajustes > Bluetooth; despues vuelve a intentar.'
    : 'Enciende la impresora, acercala al telefono y vuelve a intentar.';

function requireNativePrinter() {
  if (!EscPosPrinter) {
    throw new Error('La impresion Bluetooth no esta disponible en esta instalacion.');
  }
  return EscPosPrinter;
}

async function requestBluetoothPermission(): Promise<void> {
  // CoreBluetooth presenta el permiso del sistema al escanear por primera vez en iOS.
  if (Platform.OS === 'ios') return;
  if (Platform.OS !== 'android') throw new Error('Bluetooth no esta disponible.');
  if (Platform.Version < 31) return;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: 'Permiso para impresora Bluetooth',
      message: 'PedidoListo necesita conectarse con tu impresora termica.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    }
  );
  if (result !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Permite la conexion Bluetooth para imprimir pedidos.');
  }
}

export async function getPairedPrinters(): Promise<PairedPrinter[]> {
  await requestBluetoothPermission();
  try {
    return await requireNativePrinter().getPairedDevices();
  } catch (error) {
    throw friendlyPrinterError(error, 'No se pudieron buscar impresoras.');
  }
}

export async function getSavedPrinter(): Promise<PairedPrinter | null> {
  const value = await AsyncStorage.getItem(SAVED_PRINTER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as PairedPrinter;
  } catch {
    await AsyncStorage.removeItem(SAVED_PRINTER_KEY);
    return null;
  }
}

export async function printToPrinter(
  printer: PairedPrinter,
  receipt: string
): Promise<void> {
  await requestBluetoothPermission();
  try {
    await requireNativePrinter().print(printer.address, receipt);
  } catch (error) {
    throw friendlyPrinterError(error, 'No se pudo imprimir el pedido.');
  }
  await AsyncStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify(printer));
}

export type { PairedPrinter };
