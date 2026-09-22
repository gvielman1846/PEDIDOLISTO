import { requireOptionalNativeModule } from 'expo-modules-core';

export interface PairedPrinter {
  name: string;
  address: string;
}

interface EscPosPrinterNativeModule {
  getPairedDevices(): Promise<PairedPrinter[]>;
  print(address: string, text: string): Promise<boolean>;
}

// El modulo nativo solo se compila en Android; en iOS queda null en vez de romper el arranque.
export default requireOptionalNativeModule<EscPosPrinterNativeModule>('EscPosPrinter');
