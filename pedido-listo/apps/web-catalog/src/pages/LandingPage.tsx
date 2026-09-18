import { useEffect } from 'react';
import './LandingPage.css';

const APK_URL = 'https://expo.dev/artifacts/eas/g0BzbUkmUzPGZ9-olujyDrXROD0ACIVmTmU56hWk0co.apk';

const industries = [
  { icon: '🍽️', name: 'Comida', example: 'Menús, bebidas y entregas' },
  { icon: '✨', name: 'Perfumes', example: 'Fragancias, tamaños y existencias' },
  { icon: '👖', name: 'Ropa', example: 'Modelos, tallas y colores' },
  { icon: '🎁', name: 'Regalos', example: 'Detalles, paquetes y temporadas' },
  { icon: '💄', name: 'Belleza', example: 'Cosméticos y cuidado personal' },
  { icon: '🏪', name: 'Tu negocio', example: 'Cualquier producto que vendas' },
];

const features = [
  { number: '01', title: 'Catálogo que vende', text: 'Comparte un link profesional con fotos, precios, categorías y disponibilidad en tiempo real.' },
  { number: '02', title: 'WhatsApp como canal', text: 'El cliente arma su pedido sin instalar nada y lo envía al WhatsApp que tú configures.' },
  { number: '03', title: 'Pedidos organizados', text: 'Recibe cada venta con cliente, productos, cantidades, pago, notas y entrega en una sola vista.' },
  { number: '04', title: 'Control desde el celular', text: 'Administra productos, equipo, pedidos, ventas y varios negocios desde la app Android.' },
  { number: '05', title: 'Cobros flexibles', text: 'Acepta efectivo, transferencia con CLABE y tarjeta conectando tu propia cuenta de Mercado Pago.' },
  { number: '06', title: 'Operación completa', text: 'Estados de pedido, corte de caja, roles para el equipo e impresión térmica Bluetooth.' },
];

export function LandingPage() {
  useEffect(() => {
    document.title = 'PedidoListo — Tu catálogo, pedidos y ventas por WhatsApp';
    const description =
      'Crea un catálogo profesional, recibe pedidos por WhatsApp y administra tus ventas desde el celular.';
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);

  return (
    <div className="marketing-page">
      <nav className="marketing-nav">
        <a className="marketing-logo" href="/">PedidoListo</a>
        <div className="marketing-nav__links">
          <a href="#beneficios">Beneficios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="/ayuda">Ayuda</a>
        </div>
        <a className="marketing-nav__cta" href={APK_URL}>Descargar app</a>
      </nav>

      <main>
        <section className="marketing-hero">
          <div className="marketing-hero__copy">
            <span className="marketing-eyebrow">VENDE MÁS. OPERA MEJOR.</span>
            <h1>Convierte WhatsApp en tu canal de ventas.</h1>
            <p>
              Tu catálogo, pedidos, cobros y equipo en un solo lugar.
              Para comida, perfumes, ropa y cualquier negocio que venda por WhatsApp.
            </p>
            <div className="marketing-actions">
              <a className="marketing-btn marketing-btn--primary" href={APK_URL}>Empezar gratis en Android</a>
              <a className="marketing-btn marketing-btn--ghost" href="/cocina-chef-cueto">Ver catálogo de ejemplo</a>
            </div>
            <div className="marketing-trust">
              <span>✓ Sin app para tus clientes</span>
              <span>✓ Tu propio WhatsApp</span>
              <span>✓ Configuración sencilla</span>
            </div>
          </div>

          <div className="marketing-product" aria-label="Vista previa de PedidoListo">
            <div className="marketing-glow" />
            <div className="marketing-phone">
              <div className="marketing-phone__bar"><span>9:41</span><span>● ● ●</span></div>
              <div className="marketing-phone__hero">
                <small>TU NEGOCIO</small>
                <strong>Casa Aurea</strong>
                <span>Catálogo abierto · Entrega hoy</span>
              </div>
              <div className="marketing-phone__tabs"><b>Todos</b><span>Nuevos</span><span>Favoritos</span></div>
              <div className="marketing-phone__item">
                <div className="marketing-phone__photo marketing-phone__photo--one">✨</div>
                <div><strong>Esencia No. 05</strong><span>Fragancia · 100 ml</span><b>$680 MXN</b></div>
                <i>+</i>
              </div>
              <div className="marketing-phone__item">
                <div className="marketing-phone__photo marketing-phone__photo--two">🎁</div>
                <div><strong>Set de regalo</strong><span>Edición especial</span><b>$950 MXN</b></div>
                <i>+</i>
              </div>
              <div className="marketing-phone__cart"><span>2 productos</span><strong>Enviar pedido →</strong></div>
            </div>
            <div className="marketing-order-card">
              <span className="marketing-order-card__status">NUEVO PEDIDO</span>
              <strong>María López</strong>
              <span>2 productos · $1,630</span>
              <b>Recibido por WhatsApp ✓</b>
            </div>
          </div>
        </section>

        <section className="marketing-industries" aria-label="Tipos de negocio">
          <p>Una plataforma. Todos los rubros.</p>
          <div>
            {industries.map((industry) => (
              <article key={industry.name}>
                <span>{industry.icon}</span>
                <strong>{industry.name}</strong>
                <small>{industry.example}</small>
              </article>
            ))}
          </div>
        </section>

        <section id="beneficios" className="marketing-section">
          <div className="marketing-section__intro">
            <span className="marketing-eyebrow">TODO EN ORDEN</span>
            <h2>De un mensaje suelto a una venta bien organizada.</h2>
            <p>PedidoListo conserva la cercanía de WhatsApp y agrega la estructura que necesita tu negocio para crecer.</p>
          </div>
          <div className="marketing-features">
            {features.map((feature) => (
              <article key={feature.number}>
                <span>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="marketing-how">
          <div className="marketing-how__copy">
            <span className="marketing-eyebrow">ASÍ DE SIMPLE</span>
            <h2>Tú publicas. Tu cliente elige. PedidoListo organiza.</h2>
          </div>
          <ol>
            <li><b>1</b><div><strong>Crea tu catálogo</strong><span>Sube productos, fotos, precios y categorías desde el celular.</span></div></li>
            <li><b>2</b><div><strong>Comparte tu link</strong><span>Úsalo en Instagram, Facebook, códigos QR o conversaciones de WhatsApp.</span></div></li>
            <li><b>3</b><div><strong>Recibe pedidos claros</strong><span>El cliente selecciona productos y envía un pedido completo, sin mensajes confusos.</span></div></li>
            <li><b>4</b><div><strong>Vende y da seguimiento</strong><span>Actualiza estados, cobra, imprime y revisa tu corte de caja.</span></div></li>
          </ol>
        </section>

        <section className="marketing-whatsapp">
          <div className="marketing-whatsapp__visual">
            <div className="marketing-chat">
              <div className="marketing-chat__header"><span>PL</span><div><strong>Nuevo pedido</strong><small>PedidoListo</small></div></div>
              <div className="marketing-chat__bubble">
                <strong>Pedido de Andrea</strong>
                <span>1× Pantalón recto · Talla M</span>
                <span>2× Blusa lino · Beige</span>
                <hr />
                <b>Total: $1,490 MXN</b>
                <small>Entrega a domicilio · Efectivo</small>
              </div>
            </div>
          </div>
          <div className="marketing-whatsapp__copy">
            <span className="marketing-eyebrow">WHATSAPP, PERO PROFESIONAL</span>
            <h2>El canal que tus clientes ya conocen.</h2>
            <p>No los obligues a crear otra cuenta ni descargar otra aplicación. Ellos compran desde el navegador y tú recibes la información en el WhatsApp del negocio.</p>
            <ul>
              <li>Menos preguntas repetidas sobre precios y disponibilidad.</li>
              <li>Menos errores en productos, cantidades y direcciones.</li>
              <li>Más rapidez para confirmar y preparar cada venta.</li>
            </ul>
          </div>
        </section>

        <section className="marketing-payments">
          <span className="marketing-eyebrow">TÚ DECIDES CÓMO COBRAR</span>
          <h2>Efectivo, transferencia o tarjeta.</h2>
          <p>Configura los métodos que acepta cada negocio. Con Mercado Pago, el dinero llega directamente a tu propia cuenta.</p>
          <div>
            <span>💵 Efectivo</span>
            <span>🏦 Transferencia y CLABE</span>
            <span>💳 Mercado Pago</span>
          </div>
          <small>Mercado Pago aplica sus propios términos y comisiones. PedidoListo no guarda datos de tarjetas.</small>
        </section>

        <section className="marketing-final">
          <div>
            <span className="marketing-eyebrow">TU NEGOCIO, EN MOVIMIENTO</span>
            <h2>Tu próxima venta puede empezar con un link.</h2>
            <p>Crea tu cuenta, publica tus productos y convierte conversaciones en pedidos organizados.</p>
          </div>
          <div className="marketing-actions">
            <a className="marketing-btn marketing-btn--light" href={APK_URL}>Descargar PedidoListo</a>
            <a className="marketing-btn marketing-btn--outline" href="/ayuda">Conocer cómo funciona</a>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <a className="marketing-logo" href="/">PedidoListo</a>
        <p>Catálogo y pedidos para negocios que venden por WhatsApp.</p>
        <div><a href="/ayuda">Ayuda</a><a href="/cocina-chef-cueto">Catálogo demo</a></div>
      </footer>
    </div>
  );
}
