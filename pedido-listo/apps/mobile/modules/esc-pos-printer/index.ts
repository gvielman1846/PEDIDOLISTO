import { requireNativeModule } from 'expo-modules-core';

export interface PairedPrinter {
  name: string;
  address: string;
}

interface EscPosPrinterNativeModule {
  getPairedDevices(): Promise<PairedPrinter[]>;
  print(address: string, text: string): Promise<boolean>;
}

export default requireNativeModule<EscPosPrinterNativeModule>('EscPosPrinter');
