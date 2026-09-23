package com.pedidolisto.escpos

import android.annotation.SuppressLint
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
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

@SuppressLint("MissingPermission")
class EscPosPrinterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EscPosPrinter")

    AsyncFunction<List<Map<String, String>>>("getPairedDevices") {
      val adapter = bluetoothManager.adapter
        ?: throw Exception("Este telefono no tiene Bluetooth.")
      if (!adapter.isEnabled) {
        throw Exception("Enciende el Bluetooth del telefono.")
      }

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

      val device = adapter.getRemoteDevice(address)
      if (device.bondState != BluetoothDevice.BOND_BONDED) {
        throw Exception(
          "${device.name ?: "La impresora"} ya no esta emparejada. " +
            "Emparejala en Ajustes > Bluetooth y vuelve a intentar."
        )
      }

      // cancelDiscovery exige BLUETOOTH_SCAN desde Android 12 y la app no lo pide;
      // si falla no importa, solo es para liberar la radio antes de conectar.
      runCatching { adapter.cancelDiscovery() }

      val socket = openSocket(device)
      try {
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
        Log.e(TAG, "Fallo al enviar el trabajo", error)
        throw Exception(
          "Se perdio la conexion con ${device.name ?: "la impresora"} mientras imprimia.",
          error
        )
      } finally {
        runCatching { socket.close() }
      }

      true
    }
  }

  /**
   * Muchas termicas economicas no publican el servicio SPP, y en esos equipos
   * createInsecureRfcommSocketToServiceRecord falla al conectar. El canal RFCOMM 1
   * por reflexion es el camino que si funciona con ellas.
   */
  private fun openSocket(device: BluetoothDevice): BluetoothSocket {
    val serviceSocket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID)
    try {
      Log.i(TAG, "Conectando por SPP a ${device.name} (${device.address})")
      serviceSocket.connect()
      Log.i(TAG, "Conexion SPP lista")
      return serviceSocket
    } catch (sppError: Exception) {
      runCatching { serviceSocket.close() }
      Log.w(TAG, "SPP fallo, intentando canal RFCOMM 1", sppError)

      val fallbackSocket = runCatching {
        val factory = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
        factory.invoke(device, 1) as BluetoothSocket
      }.getOrElse {
        Log.e(TAG, "No se pudo crear el socket alterno", it)
        throw connectionError(device, sppError)
      }

      try {
        fallbackSocket.connect()
        Log.i(TAG, "Conexion lista por canal RFCOMM 1")
        return fallbackSocket
      } catch (fallbackError: Exception) {
        runCatching { fallbackSocket.close() }
        Log.e(TAG, "Canal RFCOMM 1 tambien fallo", fallbackError)
        throw connectionError(device, fallbackError)
      }
    }
  }

  private fun connectionError(device: BluetoothDevice, cause: Exception) = Exception(
    "No se pudo conectar con ${device.name ?: "la impresora"}. " +
      "Verifica que este encendida, con papel y sin otro telefono conectado.",
    cause
  )

  private val bluetoothManager: BluetoothManager
    get() {
      val context = requireNotNull(appContext.reactContext) {
        "La aplicacion aun no esta lista."
      }
      return context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    }
}
