import { useEffect } from 'react';

const UPDATED_AT = '19 de septiembre de 2026';

export function PrivacyPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Aviso de privacidad — PedidoListo';
    const description =
      'Cómo PedidoListo trata correo, teléfono, pedidos, fotos, WhatsApp y Mercado Pago. No guardamos datos de tarjetas.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="help-page">
      <header className="help-hero">
        <a className="help-brand" href="/">PedidoListo</a>
        <span className="help-kicker">AVISO DE PRIVACIDAD</span>
        <h1>Cómo usamos tus datos</h1>
        <p>
          Este aviso explica qué información trata PedidoListo, para qué, con quién se comparte
          y cómo puedes accederla o eliminarla. Actualizado el {UPDATED_AT}.
        </p>
      </header>

      <nav className="help-nav" aria-label="Secciones del aviso">
        <a href="#responsable">Responsable</a>
        <a href="#datos">Datos que tratamos</a>
        <a href="#uso">Para qué</a>
        <a href="#pagos">Pagos</a>
        <a href="#proveedores">Proveedores</a>
        <a href="#derechos">Tus derechos</a>
        <a href="#contacto">Contacto</a>
      </nav>

      <main className="help-content">
        <section id="responsable" className="help-section">
          <span className="help-number">01</span>
          <h2>Quién es responsable</h2>
          <p>
            PedidoListo es una plataforma para que negocios en México publiquen un catálogo,
            reciban pedidos por WhatsApp y administren su operación desde la app Android y la web
            en <a href="https://pedidolisto.mx">pedidolisto.mx</a>.
          </p>
          <p>
            El responsable del tratamiento es el operador de PedidoListo. Para ejercer derechos o
            hacer preguntas sobre privacidad escribe a{' '}
            <a href="mailto:pedidolistomx@gmail.com">pedidolistomx@gmail.com</a>.
          </p>
        </section>

        <section id="datos" className="help-section">
          <span className="help-number">02</span>
          <h2>Datos que tratamos</h2>
          <p>Según cómo uses el servicio, podemos tratar:</p>
          <h3>Cuenta del negocio</h3>
          <ul className="legal-list">
            <li>Correo electrónico y contraseña (esta última la guarda Firebase Authentication, no en texto plano).</li>
            <li>Nombre del negocio, enlace del catálogo, dirección y pedido mínimo.</li>
            <li>Teléfono del dueño y WhatsApp al que se envían los pedidos.</li>
            <li>Roles del equipo (dueño, preparador, entrega) y correos de las personas invitadas.</li>
          </ul>
          <h3>Catálogo</h3>
          <ul className="legal-list">
            <li>Nombres, precios, descripciones, categorías y disponibilidad de productos.</li>
            <li>Fotos de productos que subes desde la cámara o la galería.</li>
          </ul>
          <h3>Pedidos y clientes de tu negocio</h3>
          <ul className="legal-list">
            <li>Nombre, teléfono y, si aplica, dirección de entrega y notas del pedido.</li>
            <li>Productos, cantidades, totales, método de pago y estado del pedido.</li>
          </ul>
          <p>
            Esos datos del cliente los captura tu catálogo para que tú puedas cumplir la venta.
            PedidoListo no usa esa información para mercadotecnia propia.
          </p>
        </section>

        <section id="uso" className="help-section">
          <span className="help-number">03</span>
          <h2>Para qué los usamos</h2>
          <ul className="legal-list">
            <li>Crear y autenticar tu cuenta, varios negocios y al equipo.</li>
            <li>Mostrar el catálogo público y registrar pedidos.</li>
            <li>Enviar el pedido al WhatsApp que configures.</li>
            <li>Operar corte de caja, estados de pedido e impresión local por Bluetooth.</li>
            <li>Conectar cobros con Mercado Pago cuando tú lo actives.</li>
            <li>Dar soporte, seguridad, estadísticas internas de la plataforma y cumplir obligaciones legales.</li>
          </ul>
          <p>
            En el celular podemos guardar preferencias locales, como el tema de la app. La
            impresora Bluetooth se comunica en el dispositivo; no enviamos el contenido del ticket
            a nuestros servidores solo por imprimir.
          </p>
        </section>

        <section id="pagos" className="help-section">
          <span className="help-number">04</span>
          <h2>Pagos, CLABE y Mercado Pago</h2>
          <p>
            Puedes activar efectivo, transferencia y tarjeta. Si capturas una CLABE, se guarda
            para mostrarla a tus clientes al pagar por transferencia.
          </p>
          <div className="help-note">
            <strong>PedidoListo no guarda datos de tarjetas.</strong> Los pagos con tarjeta los
            procesa Mercado Pago en su checkout. Nosotros no vemos ni almacenamos número de
            tarjeta, CVV ni fecha de vencimiento.
          </div>
          <p>
            Si conectas Mercado Pago, conservamos identificadores y tokens de vinculación de tu
            cuenta de vendedor para crear preferencias de pago y conciliar el estado del cobro.
            Mercado Pago trata los datos de cobro conforme a su propia política.
          </p>
        </section>

        <section id="proveedores" className="help-section">
          <span className="help-number">05</span>
          <h2>Con quién se comparte</h2>
          <p>Usamos proveedores para operar el servicio, no para vender tu información:</p>
          <ul className="legal-list">
            <li><strong>Firebase (Google):</strong> autenticación, base de datos, almacenamiento de fotos y funciones del servidor.</li>
            <li><strong>Mercado Pago:</strong> solo si conectas cobros con tarjeta.</li>
            <li><strong>WhatsApp:</strong> el cliente o la app abren una conversación hacia el número que tú definiste; WhatsApp es responsable de ese canal.</li>
            <li><strong>Expo / EAS:</strong> distribución y actualizaciones de la app Android.</li>
            <li><strong>Vercel:</strong> hospedaje del sitio y del catálogo web.</li>
          </ul>
          <p>
            No vendemos bases de datos a terceros. Podemos divulgar información si una autoridad
            competente lo requiere conforme a la ley mexicana.
          </p>
        </section>

        <section id="derechos" className="help-section">
          <span className="help-number">06</span>
          <h2>Conservación y tus derechos</h2>
          <p>
            Conservamos la cuenta y los pedidos mientras el negocio use PedidoListo. El dueño
            puede eliminar la cuenta desde <strong>Perfil → Eliminar cuenta</strong>; eso borra
            negocios asociados y datos operativos en Firebase, salvo lo que debamos retener por
            ley o registros técnicos mínimos de seguridad.
          </p>
          <p>
            Puedes solicitar acceso, rectificación, cancelación u oposición, o la revocación del
            consentimiento, escribiendo al correo de contacto. También puedes cerrar sesión y
            dejar de usar el servicio en cualquier momento.
          </p>
          <p>
            El sitio usa el almacenamiento del navegador cuando hace falta para el flujo de pago
            (por ejemplo, recuperar el carrito al volver de Mercado Pago). No usamos publicidad
            de terceros en la app.
          </p>
        </section>

        <section id="contacto" className="help-section">
          <span className="help-number">07</span>
          <h2>Contacto y cambios</h2>
          <p>
            Dudas sobre este aviso: <a href="mailto:pedidolistomx@gmail.com">pedidolistomx@gmail.com</a>.
            Guía de uso: <a href="/ayuda">pedidolisto.mx/ayuda</a>.
            Términos: <a href="/terminos">pedidolisto.mx/terminos</a>.
          </p>
          <p>
            Si el tratamiento cambia de forma relevante, actualizaremos esta página y la fecha
            de vigencia. El uso continuado del servicio después de un cambio implica que
            conoces la versión publicada aquí.
          </p>
        </section>

        <section className="help-contact">
          <span>Transparencia</span>
          <h2>PedidoListo no guarda datos de tarjetas.</h2>
          <p>Los cobros con tarjeta ocurren en Mercado Pago. Tú controlas el WhatsApp, la CLABE y la cuenta de cobro de tu negocio.</p>
          <a href="/">Volver a PedidoListo</a>
        </section>
      </main>

      <footer className="help-footer">PedidoListo · Aviso de privacidad · {UPDATED_AT} · <a href="/terminos">Términos</a></footer>
    </div>
  );
}
