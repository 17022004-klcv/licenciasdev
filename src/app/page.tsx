"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  FileKey,
  LockKeyhole,
  Mail,
  Menu,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  LICENSE_TYPES,
  LICENSE_TYPE_LABELS,
  type LicenseType,
  type PublicLicense,
  type WebPurchaseResult,
} from "@/src/type";

// "YYYY-MM-DD" → "DD/MM/YYYY" sin pasar por Date (evita el desfase de zona horaria)
const formatDay = (value: string) => value.split("-").reverse().join("/");

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(
    price,
  );

export default function Home() {
  const [licenses, setLicenses] = useState<PublicLicense[]>([]);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<LicenseType | "">("");
  const [selected, setSelected] = useState<PublicLicense | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchase, setPurchase] = useState<WebPurchaseResult | null>(null);
  const [copied, setCopied] = useState(false);

  const loadLicenses = useCallback(
    () =>
      fetch("/api/public/licenses")
        .then((response) => response.json())
        .then((data) => setLicenses(data.success ? data.data : []))
        .catch(() => setLicenses([])),
    [],
  );

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  const openCheckout = () => {
    setPurchase(null);
    setPurchaseError("");
    setCopied(false);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (purchasing) return;
    setCheckoutOpen(false);
    // Tras una compra se vuelve al catálogo; si se canceló, el detalle sigue abierto
    if (purchase) setSelected(null);
  };

  const submitPurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;

    setPurchasing(true);
    setPurchaseError("");
    try {
      const response = await fetch("/api/public/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_id: selected.id,
          customer_name: customerName,
          customer_email: customerEmail,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setPurchaseError(data.error || "No se pudo completar la compra");
        // Si se agotó mientras el cliente llenaba el formulario, actualiza el stock
        if (response.status === 409) loadLicenses();
        return;
      }
      setPurchase(data.data);
      loadLicenses();
    } catch {
      setPurchaseError("Error al conectar con el servidor");
    } finally {
      setPurchasing(false);
    }
  };

  const copyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const visibleLicenses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return licenses.filter((license) => {
      const matchesType =
        !selectedType || license.license_type === selectedType;
      const matchesSearch =
        !term ||
        `${license.name} ${license.provider} ${license.notes || ""}`
          .toLowerCase()
          .includes(term);

      return matchesType && matchesSearch;
    });
  }, [licenses, search, selectedType]);

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
          <div className="catalog-filters">
            <div className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o proveedor"
              />
            </div>
            <label className="category-select">
              <span className="sr-only">Filtrar por duración</span>
              <select
                value={selectedType}
                onChange={(event) =>
                  setSelectedType(event.target.value as LicenseType | "")
                }
                aria-label="Filtrar por duración"
              >
                <option value="">Todas las duraciones</option>
                {LICENSE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {LICENSE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </label>
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
                    {LICENSE_TYPE_LABELS[license.license_type]}
                  </span>
                  {license.stock === 0 && (
                    <span className="sold-out-label">Agotado</span>
                  )}
                </div>
                <div className="license-content">
                  <div className="provider">{license.provider}</div>
                  <h3>{license.name}</h3>
                  <div className="license-meta">
                    <span>
                      {license.license_type === "indefinite"
                        ? "Pago único, sin vencimiento"
                        : `Vigencia de ${LICENSE_TYPE_LABELS[license.license_type]}`}
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
              <span>
                Precio final ·{" "}
                {selected.license_type === "indefinite"
                  ? "sin vencimiento"
                  : `vigencia de ${LICENSE_TYPE_LABELS[selected.license_type]}`}
              </span>
              <strong>{formatPrice(selected.price)}</strong>
            </div>
            <button
              className="primary-button full-button"
              onClick={openCheckout}
              disabled={selected.stock === 0}
            >
              {selected.stock === 0 ? (
                "Agotado"
              ) : (
                <>
                  Comprar licencia <CreditCard size={17} />
                </>
              )}
            </button>
            <small className="secure-note">
              <LockKeyhole size={13} /> Pago simulado · No se realizará ningún
              cargo
            </small>
          </div>
        </div>
      )}
      {checkoutOpen && selected && (
        <div className="modal-backdrop" onClick={closeCheckout}>
          <div
            className="product-modal checkout-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={closeCheckout}
              aria-label="Cerrar"
              disabled={purchasing}
            >
              <X size={19} />
            </button>
            {purchase ? (
              <div className="success-state">
                <div className="success-icon">
                  <Check size={30} />
                </div>
                <h2>¡Compra lista!</h2>
                <p>
                  Gracias, <strong>{purchase.customer_name}</strong>. Esta es tu
                  clave de <strong>{purchase.license_name}</strong>. Guárdala en
                  un lugar seguro.
                </p>
                {purchase.keys.map((key) => (
                  <div className="purchase-key" key={key.license_key}>
                    <code>{key.license_key}</code>
                    <button
                      type="button"
                      onClick={() => copyKey(key.license_key)}
                      aria-label="Copiar clave"
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <small>
                      {key.expires_at
                        ? `Válida hasta el ${formatDay(key.expires_at)}`
                        : "Sin fecha de vencimiento"}
                    </small>
                  </div>
                ))}
                <p className="purchase-receipt">
                  Pedido #{purchase.sale_id} · {formatPrice(purchase.total)} ·{" "}
                  {purchase.customer_email}
                </p>
                <button className="primary-button" onClick={closeCheckout}>
                  Volver al catálogo
                </button>
              </div>
            ) : (
              <form onSubmit={submitPurchase}>
                <span className="section-kicker">Finalizar compra</span>
                <h2>Completa tus datos</h2>
                <p className="checkout-copy">
                  Estás adquiriendo <strong>{selected.name}</strong> por{" "}
                  <strong>{formatPrice(selected.price)}</strong>. Recibirás tu
                  clave en cuanto confirmes.
                </p>
                <div className="checkout-form">
                  <div className="card-input">
                    <User size={17} />
                    <input
                      placeholder="Nombre de usuario"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      autoComplete="username"
                      minLength={3}
                      maxLength={30}
                      pattern="[\p{L}\p{N}._\-]{3,30}"
                      title="Entre 3 y 30 caracteres: letras, números, punto, guion o guion bajo"
                      required
                    />
                  </div>
                  <div className="card-input">
                    <Mail size={17} />
                    <input
                      placeholder="Correo electrónico"
                      type="email"
                      value={customerEmail}
                      onChange={(event) => setCustomerEmail(event.target.value)}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />
                  </div>
                </div>
                {purchaseError && (
                  <p className="form-error" role="alert">
                    {purchaseError}
                  </p>
                )}
                <button
                  type="submit"
                  className="primary-button full-button"
                  disabled={purchasing}
                >
                  {purchasing ? "Procesando..." : "Confirmar compra"}{" "}
                  <ArrowRight size={17} />
                </button>
                <small className="secure-note">
                  <LockKeyhole size={13} /> Pago simulado · No se realizará
                  ningún cargo
                </small>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}