import { useEffect } from 'react';

const sections = [
  ['inicio', 'Primeros pasos'],
  ['catalogo', 'Catálogo y productos'],
  ['pedidos', 'Pedidos y ventas'],
  ['equipo', 'Equipo y permisos'],
  ['pagos', 'Pagos y Mercado Pago'],
  ['impresora', 'Impresora Bluetooth'],
  ['cuenta', 'Cuenta y perfil'],
  ['problemas', 'Solución de problemas'],
] as const;

export function HelpPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Ayuda — PedidoListo';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="help-page">
      <header className="help-hero">
        <a className="help-brand" href="/">PedidoListo</a>
        <span className="help-kicker">CENTRO DE AYUDA</span>
        <h1>Todo lo necesario para operar tu negocio</h1>
        <p>Configura tu catálogo, recibe pedidos, cobra y organiza a tu equipo desde el celular.</p>
      </header>

      <nav className="help-nav" aria-label="Temas de ayuda">
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <main className="help-content">
        <section id="inicio" className="help-section">
          <span className="help-number">01</span>
          <h2>Primeros pasos</h2>
          <ol className="help-steps">
            <li><strong>Crea tu cuenta.</strong> Escribe correo, nombre del negocio, link del catálogo y WhatsApp. Abre el correo de activación y crea tu contraseña.</li>
            <li><strong>Inicia sesión.</strong> Usa el correo y la contraseña que acabas de configurar.</li>
            <li><strong>Agrega productos.</strong> En Productos crea categorías, nombres, precios, fotos y disponibilidad.</li>
            <li><strong>Configura Perfil.</strong> Define WhatsApp, pedido mínimo, métodos de pago y, si lo deseas, Mercado Pago.</li>
            <li><strong>Comparte el catálogo.</strong> Copia tu link público y envíalo a tus clientes.</li>
          </ol>
          <div className="help-note"><strong>Importante:</strong> el cliente no instala ninguna app. Abre el catálogo desde su navegador.</div>
        </section>

        <section id="catalogo" className="help-section">
          <span className="help-number">02</span>
          <h2>Catálogo y productos</h2>
          <h3>Crear y editar productos</h3>
          <p>Abre <strong>Productos</strong> y toca <strong>Agregar producto</strong>. Captura nombre, precio, categoría, descripción y fotografía. Editar cambia el producto existente; Eliminar lo retira definitivamente.</p>
          <h3>Disponibilidad</h3>
          <p>Desactiva el interruptor de un producto agotado. Dejará de estar disponible para pedir, sin perder su información, y podrás activarlo nuevamente.</p>
          <h3>Categorías</h3>
          <p>Usa Administrar categorías para agrupar el menú, por ejemplo: Entradas, Comida, Bebidas y Postres.</p>
          <h3>Compartir el catálogo</h3>
          <p>En <strong>Perfil → Compartir catálogo</strong> copia el enlace. Cada negocio tiene un link distinto; comprueba que esté seleccionado el negocio correcto antes de compartirlo.</p>
        </section>

        <section id="pedidos" className="help-section">
          <span className="help-number">03</span>
          <h2>Pedidos y ventas</h2>
          <h3>Flujo de un pedido</h3>
          <div className="help-flow">
            <span>Nuevo</span><b>→</b><span>Preparando</span><b>→</b><span>Listo</span><b>→</b><span>Entregado</span>
          </div>
          <p>La pestaña <strong>Pedidos</strong> muestra los pedidos del día, cliente, productos y estado. Toca una tarjeta para ver teléfono, entrega, pago, notas, total, imprimir y avanzar el estado.</p>
          <h3>Ventas y corte de caja</h3>
          <p>Ventas permite elegir un día y consultar su historial. El corte de caja suma únicamente pedidos con estado <strong>Entregado</strong>, desglosados por producto, precio unitario, cantidad y total.</p>
          <h3>Entrega</h3>
          <p>Cuando el pedido es a domicilio, el detalle permite llamar, enviar WhatsApp y abrir la ubicación en Google Maps o Waze.</p>
        </section>

        <section id="equipo" className="help-section">
          <span className="help-number">04</span>
          <h2>Equipo y permisos</h2>
          <p>El dueño puede invitar personas desde <strong>Equipo</strong> usando su correo.</p>
          <div className="help-grid">
            <article><h3>Dueño</h3><p>Administra cuenta, negocios, catálogo, cobros, equipo y configuración.</p></article>
            <article><h3>Preparador</h3><p>Consulta pedidos, avanza preparación y marca productos agotados.</p></article>
            <article><h3>Entrega</h3><p>Consulta datos de entrega, ubicación y marca pedidos como entregados.</p></article>
          </div>
          <p>La persona invitada debe crear o iniciar sesión con <strong>exactamente el mismo correo</strong> usado en la invitación.</p>
        </section>

        <section id="pagos" className="help-section">
          <span className="help-number">05</span>
          <h2>Pagos, CLABE y Mercado Pago</h2>
          <h3>Métodos de pago</h3>
          <p>En <strong>Perfil → Métodos de pago</strong> activa Efectivo, Transferencia o Tarjeta. Deja al menos uno activo.</p>
          <h3>Transferencia y CLABE</h3>
          <p>Captura una CLABE interbancaria válida de 18 dígitos. El cliente verá esa cuenta al elegir transferencia. Verifica cuidadosamente los dígitos antes de guardar.</p>
          <h3>Conectar Mercado Pago</h3>
          <ol className="help-steps">
            <li>Abre <strong>Perfil → Mercado Pago</strong>.</li>
            <li>Toca <strong>Conectar Mercado Pago</strong> e inicia sesión en la cuenta del negocio.</li>
            <li>Autoriza a PedidoListo y regresa a la aplicación.</li>
            <li>En Métodos de pago activa <strong>Tarjeta</strong>.</li>
          </ol>
          <p>El dinero de cada venta cae directamente en la cuenta de Mercado Pago conectada. PedidoListo no recibe ni guarda los datos de la tarjeta.</p>
          <div className="help-note">Un pedido con tarjeta solo aparece para preparación después de que Mercado Pago confirma el cobro.</div>
        </section>

        <section id="impresora" className="help-section">
          <span className="help-number">06</span>
          <h2>Impresora térmica Bluetooth</h2>
          <ol className="help-steps">
            <li>En Android, abre Ajustes → Bluetooth y empareja primero la impresora.</li>
            <li>Comprueba papel, tapa cerrada y batería suficiente.</li>
            <li>En PedidoListo abre un pedido y toca <strong>Imprimir</strong>.</li>
            <li>Selecciona la impresora emparejada. PedidoListo recordará la selección.</li>
          </ol>
          <p>La integración usa comandos ESC/POS y está validada con la PT210 de 58 mm. Si no imprime, apaga y enciende la impresora, confirma que siga emparejada y vuelve a seleccionarla desde <strong>Cambiar</strong>.</p>
          <p>Si emite pitidos, revisa primero el papel, la tapa y la batería: normalmente es una alerta física, no un problema del pedido.</p>
        </section>

        <section id="cuenta" className="help-section">
          <span className="help-number">07</span>
          <h2>Cuenta, perfil y negocios</h2>
          <h3>Apariencia</h3><p>Selecciona tema Normal u Oscuro. La preferencia queda guardada en el teléfono.</p>
          <h3>Correo y contraseña</h3><p>Para cambiar datos de acceso se solicita la contraseña actual. Revisa tu correo cuando PedidoListo envíe un enlace de confirmación.</p>
          <h3>WhatsApp y celular</h3><p><strong>WhatsApp de pedidos</strong> recibe pedidos del catálogo. <strong>Celular del dueño</strong> es únicamente un dato de contacto; no recibe pedidos.</p>
          <h3>Pedido mínimo</h3><p>Define el importe mínimo del carrito. Usa 0 para permitir pedidos sin mínimo.</p>
          <h3>Varios negocios</h3><p>Una cuenta puede administrar varios negocios. En Negocios selecciona cuál deseas operar; cada uno conserva sus productos, pedidos y configuración.</p>
          <h3>Eliminar cuenta</h3><p>Esta opción elimina de forma definitiva la cuenta del dueño, sus negocios y datos asociados. No se puede deshacer.</p>
        </section>

        <section id="problemas" className="help-section">
          <span className="help-number">08</span>
          <h2>Solución de problemas</h2>
          <details><summary>No puedo iniciar sesión</summary><p>Comprueba el correo, usa ¿Olvidaste tu contraseña? y revisa spam. Si fuiste invitado, usa el mismo correo de la invitación.</p></details>
          <details><summary>No veo un pedido</summary><p>Confirma el negocio activo y la fecha. En pagos con tarjeta, espera la confirmación de Mercado Pago. Revisa también tu conexión a internet.</p></details>
          <details><summary>El WhatsApp incorrecto recibe pedidos</summary><p>Ve a Perfil → WhatsApp de pedidos, guarda los 10 dígitos y comprueba el link del negocio que compartiste.</p></details>
          <details><summary>El cliente no puede completar el carrito</summary><p>Revisa el pedido mínimo, disponibilidad de productos y que exista al menos un método de pago activo.</p></details>
          <details><summary>Mercado Pago no abre o no conecta</summary><p>Usa Chrome, desactiva temporalmente bloqueadores o VPN y vuelve a iniciar la conexión desde Perfil. No compartas tu contraseña ni credenciales.</p></details>
          <details><summary>La app no muestra una actualización</summary><p>Ciérrala completamente y ábrela de nuevo con internet. Las mejoras OTA se descargan primero y se aplican en el siguiente arranque.</p></details>
        </section>

        <section className="help-contact">
          <span>¿Aún necesitas ayuda?</span>
          <h2>Describe qué estabas haciendo y qué mensaje apareció.</h2>
          <p>Al solicitar soporte incluye el nombre del negocio, modelo del teléfono y una captura. Nunca envíes contraseñas, Client Secrets ni datos completos de tarjetas.</p>
          <a href="/">Volver a PedidoListo</a>
        </section>
      </main>

      <footer className="help-footer">PedidoListo · Tu negocio, en movimiento · <a href="/privacidad">Privacidad</a></footer>
    </div>
  );
}
