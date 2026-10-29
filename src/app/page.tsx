"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  CreditCard,
  FileKey,
  LockKeyhole,
  Mail,
  Menu,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import type { DigitalLicense } from "@/src/type";

const typeLabels = {
  perpetual: "Permanente",
  subscription: "Suscripción",
  temporary: "Temporal",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(
    price,
  );

export default function Home() {
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DigitalLicense | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/licenses?status=active")
      .then((response) => response.json())
      .then((data) => {
        setLicenses(data.success ? data.data : []);
        setLoading(false);
      })
      .catch(() => {
        setLicenses([]);
        setLoading(false);
      });
  }, []);

  const visibleLicenses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return licenses.filter(
      (license) =>
        !term ||
        `${license.name} ${license.provider} ${license.notes || ""}`
          .toLowerCase()
          .includes(term),
    );
  }, [licenses, search]);

  const scrollToCatalog = () =>
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="landing-page">
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Licensia inicio">
          <span className="brand-mark">
            <FileKey size={18} />
          </span>
          <span>
            licensia<span className="brand-dot">.</span>
          </span>
        </Link>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
          <a href="#catalogo" onClick={() => setMenuOpen(false)}>
            Catálogo
          </a>
          <a href="#beneficios" onClick={() => setMenuOpen(false)}>
            Por qué nosotros
          </a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>
            Contacto
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> Licencias digitales, sin complicaciones
          </div>
          <h1>
            Tu próximo
            <br />
            <em>nivel de software.</em>
          </h1>
          <p>
            Encuentra herramientas profesionales, activa tu licencia en minutos
            y trabaja con la tranquilidad de comprar siempre de forma segura.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={scrollToCatalog}>
              Explorar catálogo <ArrowRight size={17} />
            </button>
            <a className="text-button" href="#beneficios">
              Conoce la experiencia <ChevronDown size={16} />
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-icons">
              <BadgeCheck size={17} />
              <ShieldCheck size={17} />
              <LockKeyhole size={17} />
            </div>
            <span>Compra segura · Entrega inmediata · Soporte humano</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-grid" />
          <div className="floating-card card-top">
            <span className="mini-icon">
              <ShieldCheck size={16} />
            </span>
            <span>
              <b>Compra protegida</b>
              <small>Siempre respaldada</small>
            </span>
          </div>
          <div className="license-orbit">
            <div className="orbit-ring" />
            <div className="license-tile">
              <FileKey size={42} />
              <span>
                LICENCIA
                <br />
                <b>ACTIVADA</b>
              </span>
              <Check className="tile-check" size={17} />
            </div>
          </div>
          <div className="floating-card card-bottom">
            <span className="pulse-dot" />
            <span>
              <b>Entrega instantánea</b>
              <small>Tu clave está lista</small>
            </span>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <span>Herramientas para hacer más</span>
        <strong>ADOBE</strong>
        <strong>Microsoft</strong>
        <strong>JetBrains</strong>
        <strong>CANVA</strong>
        <strong>Notion</strong>
      </section>

      <section className="catalog-section" id="catalogo">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Selección curada</span>
            <h2>
              Software que <em>sí necesitas.</em>
            </h2>
          </div>
          <p>
            Licencias verificadas para crear, organizar y llevar tus proyectos
            más lejos.
          </p>
        </div>
        <div className="catalog-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o proveedor"
            />
          </div>
          <span>{visibleLicenses.length} disponibles</span>
        </div>
        {visibleLicenses.length ? (
          <div className="license-grid">
            {visibleLicenses.slice(0, 6).map((license, index) => (
              <article
                className={`license-card ${index === 0 ? "featured" : ""}`}
                key={license.id}
              >
                <div className="license-image">
                  {license.image ? (
                    <img src={license.image} alt="" />
                  ) : (
                    <div className="license-image-placeholder">
                      <Monitor size={28} />
                    </div>
                  )}
                  <span className="type-label">
                    {typeLabels[license.license_type]}
                  </span>
                </div>
                <div className="license-content">
                  <div className="provider">{license.provider}</div>
                  <h3>{license.name}</h3>
                  <div className="license-meta">
                    <span>
                      {license.license_type === "perpetual"
                        ? "Pago único"
                        : "Acceso flexible"}
                    </span>
                    <strong>{formatPrice(license.price)}</strong>
                  </div>
                  <button
                    className="card-button"
                    onClick={() => setSelected(license)}
                  >
                    Ver licencia <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-catalog">
            <FileKey size={28} />
            <p>Aún estamos preparando nuevas licencias.</p>
          </div>
        )}
      </section>

      <section className="benefits-section" id="beneficios">
        <div className="benefits-intro">
          <span className="section-kicker">La diferencia licensia</span>
          <h2>
            Comprar software
            <br />
            <em>debería sentirse así.</em>
          </h2>
          <p>
            Un proceso claro, soporte real y la certeza de que tu licencia
            funciona desde el primer momento.
          </p>
        </div>
        <div className="benefit-list">
          <div>
            <span>01</span>
            <div>
              <h3>Activación sin vueltas</h3>
              <p>
                Recibe tu clave y las instrucciones precisas justo después de tu
                compra.
              </p>
            </div>
          </div>
          <div>
            <span>02</span>
            <div>
              <h3>Selección confiable</h3>
              <p>
                Revisamos cada licencia para que puedas comprar con total
                tranquilidad.
              </p>
            </div>
          </div>
          <div>
            <span>03</span>
            <div>
              <h3>Estamos contigo</h3>
              <p>
                Si algo se complica, una persona real está lista para ayudarte.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contacto">
        <div>
          <span className="section-kicker">¿Tienes una pregunta?</span>
          <h2>
            Hablemos de
            <br />
            <em>lo que necesitas.</em>
          </h2>
        </div>
        <a className="contact-link" href="mailto:hola@licensia.mx">
          <Mail size={18} /> hola@licensia.mx <ArrowRight size={17} />
        </a>
      </section>
      <footer>
        <Link href="/" className="brand">
          <span className="brand-mark">
            <FileKey size={15} />
          </span>
          <span>
            licensia<span className="brand-dot">.</span>
          </span>
        </Link>
        <span>Licencias que impulsan ideas.</span>
        <span>© 2026 Licensia</span>
      </footer>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelected(null)}
              aria-label="Cerrar"
            >
              <X size={19} />
            </button>
            <div className="modal-icon">
              <FileKey size={34} />
            </div>
            <span className="section-kicker">{selected.provider}</span>
            <h2>{selected.name}</h2>
            <p>
              {selected.notes ||
                "Una licencia verificada para trabajar mejor, crear más y avanzar sin límites."}
            </p>
            <div className="modal-price">
              <span>Precio final</span>
              <strong>{formatPrice(selected.price)}</strong>
            </div>
            <button
              className="primary-button full-button"
              onClick={() => {
                setPaid(false);
                setCheckoutOpen(true);
              }}
            >
              Simular compra <CreditCard size={17} />
            </button>
            <small className="secure-note">
              <LockKeyhole size={13} /> Simulación estática · No se realizará
              ningún cargo
            </small>
          </div>
        </div>
      )}
      {checkoutOpen && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div
            className="product-modal checkout-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setCheckoutOpen(false)}
              aria-label="Cerrar"
            >
              <X size={19} />
            </button>
            {paid ? (
              <div className="success-state">
                <div className="success-icon">
                  <Check size={30} />
                </div>
                <h2>¡Todo listo!</h2>
                <p>
                  Esta fue una simulación. En una compra real, tu licencia
                  aparecería aquí de inmediato.
                </p>
                <button
                  className="primary-button"
                  onClick={() => {
                    setCheckoutOpen(false);
                    setSelected(null);
                  }}
                >
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <>
                <span className="section-kicker">Checkout de demostración</span>
                <h2>Completa tus datos</h2>
                <p className="checkout-copy">
                  Estás adquiriendo <strong>{selected?.name}</strong>. No se
                  guardará información ni se procesará ningún pago.
                </p>
                <div className="checkout-form">
                  <input placeholder="Nombre completo" />
                  <input placeholder="Correo electrónico" type="email" />
                  <div className="card-input">
                    <CreditCard size={17} />
                    <input placeholder="Número de tarjeta (simulado)" />
                  </div>
                  <div className="form-row">
                    <input placeholder="MM / AA" />
                    <input placeholder="CVC" />
                  </div>
                </div>
                <button
                  className="primary-button full-button"
                  onClick={() => setPaid(true)}
                >
                  Confirmar simulación <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
