import { Alert, Linking } from 'react-native';

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

function lastTenDigits(phone: string): string {
  const digits = digitsOnly(phone);
  return digits.slice(-10);
}

export function formatCustomerPhone(phone: string): string {
  const local = lastTenDigits(phone);
  if (local.length !== 10) return phone;
  return `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
}

function whatsappPhone(phone: string): string {
  const local = lastTenDigits(phone);
  if (local.length !== 10) return digitsOnly(phone);
  return `521${local}`;
}

function callPhone(phone: string): string {
  const local = lastTenDigits(phone);
  if (local.length !== 10) return digitsOnly(phone);
  return `+52${local}`;
}

async function openUrl(url: string, fallback: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No se pudo abrir', fallback);
  }
}

export function callCustomer(phone: string): Promise<void> {
  return openUrl(`tel:${callPhone(phone)}`, 'Revisa que el celular tenga permiso para llamadas.');
}

export function whatsappCustomer(phone: string, message?: string): Promise<void> {
  const base = `https://wa.me/${whatsappPhone(phone)}`;
  const url = message ? `${base}?text=${encodeURIComponent(message)}` : base;
  return openUrl(url, 'Revisa que WhatsApp este instalado.');
}
