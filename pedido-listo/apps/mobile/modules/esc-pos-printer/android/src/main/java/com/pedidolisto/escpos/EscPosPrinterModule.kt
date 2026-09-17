package com.pedidolisto.escpos

import android.annotation.SuppressLint
import android.bluetooth.BluetoothManager
import android.content.Context
import android.util.Log
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.Charset
import java.util.UUID

private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
private const val TAG = "PedidoListoPrinter"
private const val CHUNK_SIZE = 128

class EscPosPrinterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EscPosPrinter")

    AsyncFunction<List<Map<String, String>>>("getPairedDevices") {
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
        Log.i(TAG, "Conectando por SPP a ${device.name} (${device.address})")
        socket.connect()
        Log.i(TAG, "Conexion SPP lista")
        socket.outputStream.use { output ->
          output.write(byteArrayOf(0x1B, 0x40)) // ESC @: inicializar
          output.flush()
          Thread.sleep(150)

          // La PT210 pierde bytes cuando recibe un trabajo completo de golpe.
          // Tambien necesita LF+CR para vaciar su buffer de linea.
          val normalized = text
            .replace("\r\n", "\n")
            .replace('\r', '\n')
            .replace("\n", "\n\r")
          val payload = normalized.toByteArray(Charset.forName("CP850"))
          var offset = 0
          while (offset < payload.size) {
            val end = minOf(offset + CHUNK_SIZE, payload.size)
            output.write(payload, offset, end - offset)
            output.flush()
            Thread.sleep(25)
            offset = end
          }

          // Alimenta cuatro lineas. Esta impresora portatil no tiene cortador;
          // enviar GS V puede dejar algunos firmwares esperando mas datos.
          output.write(byteArrayOf(0x1B, 0x64, 0x04))
          output.flush()
          Log.i(TAG, "Trabajo enviado: ${payload.size} bytes")

          // No cerrar el RFCOMM hasta que el firmware procese su buffer.
          Thread.sleep(1500)
        }
      } catch (error: Exception) {
        Log.e(TAG, "Fallo de impresion", error)
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
