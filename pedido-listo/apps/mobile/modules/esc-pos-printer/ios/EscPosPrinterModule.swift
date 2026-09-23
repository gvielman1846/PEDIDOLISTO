import CoreBluetooth
import ExpoModulesCore

private let pt210Service = CBUUID(string: "18F0")
private let pt210WriteCharacteristic = CBUUID(string: "2AF1")
private let isscService = CBUUID(string: "49535343-FE7D-4AE5-8FA9-9FAFD205E455")
private let isscWriteCharacteristic = CBUUID(string: "49535343-8841-43F4-A8D4-ECBE34729BB3")
private let chunkSize = 128

private struct PrinterError: LocalizedError {
  let message: String
  var errorDescription: String? { message }
}

private final class BLEPrinterManager: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
  private let bluetoothQueue = DispatchQueue(label: "mx.pedidolisto.printer.ble")
  private lazy var central = CBCentralManager(delegate: self, queue: bluetoothQueue)
  private let lock = NSLock()

  private var stateSignal = DispatchSemaphore(value: 0)
  private var connectionSignal = DispatchSemaphore(value: 0)
  private var characteristicSignal = DispatchSemaphore(value: 0)
  private var writeSignal = DispatchSemaphore(value: 0)

  private var discovered: [UUID: CBPeripheral] = [:]
  private var connectionError: Error?
  private var writeError: Error?
  private var writeCharacteristic: CBCharacteristic?
  private var pendingServices = 0

  override init() {
    super.init()
    _ = central
  }

  func scan() throws -> [[String: String]] {
    try ensureBluetoothReady()
    lock.lock()
    discovered.removeAll()
    lock.unlock()

    bluetoothQueue.async {
      self.central.scanForPeripherals(
        withServices: nil,
        options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
      )
    }
    Thread.sleep(forTimeInterval: 3.5)
    bluetoothQueue.async { self.central.stopScan() }

    lock.lock()
    let printers = discovered.values.sorted {
      ($0.name ?? "Impresora Bluetooth") < ($1.name ?? "Impresora Bluetooth")
    }
    lock.unlock()

    return printers.map {
      [
        "name": $0.name ?? "Impresora Bluetooth",
        "address": $0.identifier.uuidString
      ]
    }
  }

  func print(identifier: String, text: String) throws {
    try ensureBluetoothReady()
    guard let uuid = UUID(uuidString: identifier) else {
      throw PrinterError(message: "La impresora guardada ya no es valida. Seleccionala de nuevo.")
    }

    var peripheral = central.retrievePeripherals(withIdentifiers: [uuid]).first
    if peripheral == nil {
      _ = try scan()
      lock.lock()
      peripheral = discovered[uuid]
      lock.unlock()
    }
    guard let peripheral else {
      throw PrinterError(message: "No se encontro la impresora. Enciendela y acercala al iPhone.")
    }

    try connect(peripheral)
    defer {
      Thread.sleep(forTimeInterval: 1.5)
      bluetoothQueue.async { self.central.cancelPeripheralConnection(peripheral) }
    }

    let characteristic = try discoverWriteCharacteristic(on: peripheral)
    let payload = makePayload(text)
    try write(Data([0x1B, 0x40]), to: characteristic, on: peripheral)
    Thread.sleep(forTimeInterval: 0.15)

    var offset = 0
    while offset < payload.count {
      let end = min(offset + chunkSize, payload.count)
      try write(payload.subdata(in: offset..<end), to: characteristic, on: peripheral)
      Thread.sleep(forTimeInterval: 0.025)
      offset = end
    }
    try write(Data([0x1B, 0x64, 0x04]), to: characteristic, on: peripheral)
  }

  private func ensureBluetoothReady() throws {
    if central.state == .unknown {
      _ = stateSignal.wait(timeout: .now() + 5)
    }
    switch central.state {
    case .poweredOn:
      return
    case .poweredOff:
      throw PrinterError(message: "Enciende el Bluetooth del iPhone.")
    case .unauthorized:
      throw PrinterError(message: "Permite Bluetooth para PedidoListo en Configuracion.")
    case .unsupported:
      throw PrinterError(message: "Este iPhone no admite Bluetooth BLE.")
    default:
      throw PrinterError(message: "Bluetooth aun no esta disponible. Intenta de nuevo.")
    }
  }

  private func connect(_ peripheral: CBPeripheral) throws {
    if peripheral.state == .connected {
      return
    }
    connectionSignal = DispatchSemaphore(value: 0)
    connectionError = nil
    bluetoothQueue.async { self.central.connect(peripheral) }
    guard connectionSignal.wait(timeout: .now() + 12) == .success else {
      throw PrinterError(message: "La impresora no respondio. Verifica que este encendida.")
    }
    if let connectionError {
      throw PrinterError(message: "No se pudo conectar con la impresora: \(connectionError.localizedDescription)")
    }
  }

  private func discoverWriteCharacteristic(on peripheral: CBPeripheral) throws -> CBCharacteristic {
    characteristicSignal = DispatchSemaphore(value: 0)
    writeCharacteristic = nil
    peripheral.delegate = self
    bluetoothQueue.async {
      peripheral.discoverServices([pt210Service, isscService])
    }
    guard characteristicSignal.wait(timeout: .now() + 10) == .success,
          let writeCharacteristic else {
      throw PrinterError(message: "La impresora no ofrece un canal BLE compatible con PT210.")
    }
    return writeCharacteristic
  }

  private func write(_ data: Data, to characteristic: CBCharacteristic, on peripheral: CBPeripheral) throws {
    if characteristic.properties.contains(.write) {
      writeSignal = DispatchSemaphore(value: 0)
      writeError = nil
      peripheral.writeValue(data, for: characteristic, type: .withResponse)
      guard writeSignal.wait(timeout: .now() + 4) == .success else {
        throw PrinterError(message: "La impresora dejo de responder durante la impresion.")
      }
      if let writeError {
        throw PrinterError(message: "No se pudo enviar el ticket: \(writeError.localizedDescription)")
      }
    } else if characteristic.properties.contains(.writeWithoutResponse) {
      let deadline = Date().addingTimeInterval(4)
      while !peripheral.canSendWriteWithoutResponse && Date() < deadline {
        Thread.sleep(forTimeInterval: 0.02)
      }
      guard peripheral.canSendWriteWithoutResponse else {
        throw PrinterError(message: "La impresora no esta lista para recibir el ticket.")
      }
      peripheral.writeValue(data, for: characteristic, type: .withoutResponse)
    } else {
      throw PrinterError(message: "El canal Bluetooth de la impresora es de solo lectura.")
    }
  }

  private func makePayload(_ text: String) -> Data {
    let normalizedLines = text
      .replacingOccurrences(of: "\r\n", with: "\n")
      .replacingOccurrences(of: "\r", with: "\n")
      .replacingOccurrences(of: "\n", with: "\n\r")
    let printable = normalizedLines
      .folding(options: [.diacriticInsensitive, .widthInsensitive], locale: Locale(identifier: "es_MX"))
    return printable.data(using: .ascii, allowLossyConversion: true) ?? Data()
  }

  func centralManagerDidUpdateState(_ central: CBCentralManager) {
    stateSignal.signal()
  }

  func centralManager(
    _ central: CBCentralManager,
    didDiscover peripheral: CBPeripheral,
    advertisementData: [String: Any],
    rssi RSSI: NSNumber
  ) {
    let advertised = advertisementData[CBAdvertisementDataServiceUUIDsKey] as? [CBUUID] ?? []
    let name = (peripheral.name ?? advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? "").lowercased()
    let looksLikePrinter = advertised.contains(pt210Service)
      || advertised.contains(isscService)
      || name.contains("pt210")
      || name.contains("mtp")
      || name.contains("printer")
      || name.contains("pos")
    guard looksLikePrinter else { return }
    lock.lock()
    discovered[peripheral.identifier] = peripheral
    lock.unlock()
  }

  func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
    connectionSignal.signal()
  }

  func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
    connectionError = error ?? PrinterError(message: "Conexion Bluetooth rechazada.")
    connectionSignal.signal()
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
    guard error == nil, let services = peripheral.services, !services.isEmpty else {
      characteristicSignal.signal()
      return
    }
    pendingServices = services.count
    for service in services {
      let preferred = service.uuid == pt210Service
        ? [pt210WriteCharacteristic]
        : service.uuid == isscService ? [isscWriteCharacteristic] : nil
      peripheral.discoverCharacteristics(preferred, for: service)
    }
  }

  func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
    if error == nil, let characteristics = service.characteristics {
      let preferredUUID = service.uuid == pt210Service ? pt210WriteCharacteristic : isscWriteCharacteristic
      if let exact = characteristics.first(where: { $0.uuid == preferredUUID }) {
        writeCharacteristic = exact
        characteristicSignal.signal()
        return
      }
      if let writable = characteristics.first(where: {
        $0.properties.contains(.write) || $0.properties.contains(.writeWithoutResponse)
      }) {
        writeCharacteristic = writable
        characteristicSignal.signal()
        return
      }
    }
    pendingServices -= 1
    if pendingServices == 0 {
      characteristicSignal.signal()
    }
  }

  func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
    writeError = error
    writeSignal.signal()
  }
}

public final class EscPosPrinterModule: Module {
  private let manager = BLEPrinterManager()

  public func definition() -> ModuleDefinition {
    Name("EscPosPrinter")

    AsyncFunction("getPairedDevices") { () throws -> [[String: String]] in
      try self.manager.scan()
    }

    AsyncFunction("print") { (identifier: String, text: String) throws -> Bool in
      try self.manager.print(identifier: identifier, text: text)
      return true
    }
  }
}
