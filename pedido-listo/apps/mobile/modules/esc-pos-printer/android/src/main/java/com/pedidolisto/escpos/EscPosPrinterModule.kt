package com.pedidolisto.escpos

import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.content.Context
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.Charset
import java.util.UUID

private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

class EscPosPrinterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EscPosPrinter")

    AsyncFunction("getPairedDevices") Coroutine {
      val adapter = bluetoothManager.adapter
        ?: throw Exception("Este telefono no tiene Bluetooth.")
      if (!adapter.isEnabled) {
        throw Exception("Enciende el Bluetooth del telefono.")
      }

      @SuppressLint("MissingPermission")
      adapter.bondedDevices
        .sortedBy { it.name ?: it.address }
        .map {
          mapOf(
            "name" to (it.name ?: "Impresora Bluetooth"),
            "address" to it.address
          )
        }
    }

    AsyncFunction("print") Coroutine { address: String, text: String ->
      val adapter = bluetoothManager.adapter
        ?: throw Exception("Este telefono no tiene Bluetooth.")
      if (!adapter.isEnabled) {
        throw Exception("Enciende el Bluetooth del telefono.")
      }

      @SuppressLint("MissingPermission")
      val device = adapter.getRemoteDevice(address)
      adapter.cancelDiscovery()

      // Las impresoras termicas genericas usan Bluetooth Classic SPP.
      @SuppressLint("MissingPermission")
      val socket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID)
      try {
        socket.connect()
        socket.outputStream.use { output ->
          output.write(byteArrayOf(0x1B, 0x40)) // ESC @: inicializar
          output.write(byteArrayOf(0x1B, 0x74, 0x02)) // pagina PC850
          output.write(text.toByteArray(Charset.forName("CP850")))
          output.write(byteArrayOf(0x0A, 0x0A, 0x0A))
          output.write(byteArrayOf(0x1D, 0x56, 0x00)) // corte completo si existe
          output.flush()
        }
      } catch (error: Exception) {
        throw Exception(
          "No se pudo conectar con ${device.name ?: "la impresora"}. " +
            "Verifica que este encendida y emparejada.",
          error
        )
      } finally {
        runCatching { socket.close() }
      }

      true
    }
  }

  private val bluetoothManager: BluetoothManager
    get() {
      val context = requireNotNull(appContext.reactContext) {
        "La aplicacion aun no esta lista."
      }
      return context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    }
}
