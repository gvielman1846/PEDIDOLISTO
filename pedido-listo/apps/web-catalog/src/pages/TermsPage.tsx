import { useEffect } from 'react';

const UPDATED_AT = '19 de septiembre de 2026';
const CONTACT = 'pedidolistomx@gmail.com';

export function TermsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Términos de uso — PedidoListo';
    const description =
      'Condiciones de uso de PedidoListo: catálogo, pedidos por WhatsApp, pagos y responsabilidades del negocio.';
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
        <span className="help-kicker">TÉRMINOS DE USO</span>
        <h1>Condiciones del servicio</h1>
        <p>
          Al crear una cuenta, descargar la app o usar el catálogo en pedidolisto.mx aceptas estos
          términos. Actualizados el {UPDATED_AT}.
        </p>
      </header>

      <nav className="help-nav" aria-label="Secciones de los términos">
        <a href="#servicio">El servicio</a>
        <a href="#cuenta">Tu cuenta</a>
        <a href="#catalogo">Catálogo y pedidos</a>
        <a href="#pagos">Pagos</a>
        <a href="#uso">Uso permitido</a>
        <a href="#responsabilidad">Responsabilidad</a>
        <a href="#contacto">Contacto</a>
      </nav>

      <main className="help-content">
        <section id="servicio" className="help-section">
          <span className="help-number">01</span>
          <h2>Qué es PedidoListo</h2>
          <p>
            PedidoListo es una herramienta para negocios en México: publicas un catálogo web,
            recibes pedidos organizados (normalmente por WhatsApp) y operas productos, equipo,
            ventas y cobros desde la app Android.
          </p>
          <p>
            El cliente final no necesita instalar PedidoListo. Abre tu enlace público y completa
            el pedido en el navegador. Nosotros no somos parte de la compraventa entre tú y tu cliente.
          </p>
        </section>

        <section id="cuenta" className="help-section">
          <span className="help-number">02</span>
          <h2>Cuenta y negocios</h2>
          <ul className="legal-list">
            <li>Debes proporcionar datos veraces y mantener el acceso a tu correo.</li>
            <li>Eres responsable de la contraseña, del equipo que invites y de lo que hagan con tu negocio.</li>
            <li>Una cuenta puede administrar varios negocios; cada uno tiene su propio catálogo y configuración.</li>
            <li>El dueño puede eliminar la cuenta desde Perfil. Eso borra negocios y datos operativos asociados, salvo lo que debamos conservar por ley.</li>
            <li>Podemos suspender o deshabilitar cuentas que incumplan estos términos, pongan en riesgo la plataforma o lo exija la ley.</li>
          </ul>
        </section>

        <section id="catalogo" className="help-section">
          <span className="help-number">03</span>
          <h2>Catálogo, pedidos y WhatsApp</h2>
          <p>
            Tú decides precios, disponibilidad, fotos, pedido mínimo, WhatsApp de pedidos y
            métodos de cobro. Garantizas tener derecho a publicar ese contenido y a vender esos productos.
          </p>
          <p>
            El mensaje de WhatsApp se envía al número que configures. WhatsApp es un servicio de
            terceros, con sus propias reglas. PedidoListo no controla la entrega de mensajes ni
            las conversaciones posteriores.
          </p>
          <p>
            Los datos del cliente (nombre, teléfono, dirección, notas) se capturan para que tú
            puedas cumplir el pedido. Eres responsable de tratarlos conforme a la ley y a nuestro{' '}
            <a href="/privacidad">aviso de privacidad</a>.
          </p>
        </section>

        <section id="pagos" className="help-section">
          <span className="help-number">04</span>
          <h2>Cobros</h2>
          <p>
            Puedes ofrecer efectivo, transferencia con CLABE y tarjeta mediante Mercado Pago.
            El dinero de las ventas llega a tu cuenta o a los datos que tú indiques, no a PedidoListo
            como intermediario de fondos.
          </p>
          <div className="help-note">
            <strong>PedidoListo no guarda datos de tarjetas</strong> y no es una entidad financiera.
            Mercado Pago aplica sus propios términos y comisiones. Si conectas esa cuenta, aceptas
            también las condiciones de Mercado Pago.
          </div>
        </section>

        <section id="uso" className="help-section">
          <span className="help-number">05</span>
          <h2>Uso permitido</h2>
          <p>No está permitido usar PedidoListo para:</p>
          <ul className="legal-list">
            <li>Actividades ilegales, fraude, phishing o contenido que infrinja derechos de terceros.</li>
            <li>Vender productos prohibidos o que requieran permisos que no tienes.</li>
            <li>Intentar acceder a cuentas ajenas, alterar el servicio o sobrecargar la infraestructura.</li>
            <li>Hacerte pasar por PedidoListo o usar la marca de forma engañosa.</li>
          </ul>
          <p>
            El software, el diseño y la marca PedidoListo nos pertenecen o están licenciados.
            Tienes una licencia limitada para usar el servicio mientras tu cuenta esté activa.
            El contenido de tu catálogo sigue siendo tuyo.
          </p>
        </section>

        <section id="responsabilidad" className="help-section">
          <span className="help-number">06</span>
          <h2>Disponibilidad y responsabilidad</h2>
          <p>
            Ofrecemos el servicio “tal cual”. Puede haber interrupciones, errores o cambios.
            No garantizamos un volumen de ventas ni que WhatsApp, Mercado Pago, Expo o tu
            impresora funcionen en todo momento.
          </p>
          <p>
            En la medida que permita la ley mexicana, PedidoListo no responde por pérdidas de
            ventas, datos del dispositivo, disputas con clientes o fallas de terceros. Nuestra
            responsabilidad, si existiera, se limita a lo estrictamente permitido por la ley
            aplicable en México.
          </p>
          <p>
            Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Si alguna
            cláusula no pudiera aplicarse, el resto sigue vigente.
          </p>
        </section>

        <section id="contacto" className="help-section">
          <span className="help-number">07</span>
          <h2>Cambios y contacto</h2>
          <p>
            Podemos actualizar estos términos publicando una nueva versión en esta página.
            El uso posterior del servicio implica que aceptas la versión vigente.
          </p>
          <p>
            Contacto: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            Privacidad: <a href="/privacidad">pedidolisto.mx/privacidad</a>.
            Ayuda: <a href="/ayuda">pedidolisto.mx/ayuda</a>.
          </p>
        </section>

        <section className="help-contact">
          <span>Condiciones claras</span>
          <h2>Tú vendes. PedidoListo organiza el pedido.</h2>
          <p>No intermediamos el dinero de tus clientes ni nos quedamos con los datos de sus tarjetas.</p>
          <a href="/">Volver a PedidoListo</a>
        </section>
      </main>

      <footer className="help-footer">PedidoListo · Términos de uso · {UPDATED_AT}</footer>
    </div>
  );
}
