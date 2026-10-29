"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // El token viaja en una cookie httpOnly; aquí solo se guardan los datos para mostrar en la UI
        if (typeof window !== "undefined") {
          localStorage.setItem("employee", JSON.stringify(data.data.employee));
        }

        await Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: "Has iniciado sesión correctamente.",
          timer: 1500,
          showConfirmButton: false,
          background: "#FBFCF8",
          color: "#17201D",
          iconColor: "#91A91C",
        });

        router.push("/admin/catalogo");
      } else {
        await Swal.fire({
          icon: "error",
          title: "No pudimos iniciar sesión",
          text: data.error || "Verifica tu correo y contraseña.",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#34483B",
          background: "#FBFCF8",
          color: "#17201D",
        });
      }
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No fue posible conectar con el servidor. Inténtalo nuevamente.",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#34483B",
        background: "#FBFCF8",
        color: "#17201D",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex h-dvh w-full items-center justify-center overflow-hidden bg-[#17201D] px-4 py-2 sm:px-6">
      {/* Imagen de fondo */}
      <Image
        src="/auth.jpeg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover"
      />

      {/* Capas decorativas */}
      <div className="absolute inset-0 -z-20 bg-[#101914]/80" />

      <div className="absolute -left-32 top-[-8rem] -z-10 h-96 w-96 rounded-full bg-[#91A91C]/15 blur-[100px]" />
      <div className="absolute -bottom-40 -right-24 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#D7ED4B]/10 blur-[120px]" />

      {/* Patrón decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(#D7ED4B 1px, transparent 1px)",
          backgroundSize: "30px 30px",
          maskImage: "linear-gradient(to bottom right, black, transparent 75%)",
        }}
      />

      {/* Contenedor principal */}
      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#FBFCF8] shadow-[0_25px_70px_rgba(0,0,0,0.30)] md:grid-cols-[1fr_0.95fr]">
        {/* Panel de identidad visual */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#1D2923] p-10 text-white sm:p-12 md:flex lg:p-14">
          {/* Luces decorativas */}
          <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#D7ED4B]/10 blur-[80px]" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#91A91C]/15 blur-[70px]" />

          <div className="relative z-10">
            <div className="mb-12 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D7ED4B]/30 bg-[#D7ED4B]/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6 text-[#D7ED4B]"
                  aria-hidden="true"
                >
                  <path
                    d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5V10Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="15" r="1.4" fill="currentColor" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-bold tracking-[0.2em]">LICENCIAS</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-white/45">
                  Management System
                </p>
              </div>
            </div>

            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#D7ED4B]">
              Control · Seguridad · Gestión
            </p>

            <h2 className="max-w-sm text-4xl font-semibold leading-[1.15] tracking-tight lg:text-5xl">
              Todo bajo
              <br />
              <span className="text-[#D7ED4B]">control.</span>
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#D6DED7]/70 lg:text-base">
              Administra tus licencias digitales desde un espacio diseñado para
              simplificar tu trabajo y mantener todo organizado.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="h-[3px] w-10 rounded-full bg-[#D7ED4B]" />
              <div className="h-[3px] w-4 rounded-full bg-white/20" />
              <div className="h-[3px] w-4 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Tarjeta informativa */}
          <div className="relative z-10 mt-14 rounded-2xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D7ED4B]/10 text-[#D7ED4B]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="m12 3 8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Tu espacio de trabajo
                </p>
                <p className="mt-1 text-xs leading-5 text-white/50">
                  Accede a tus herramientas de administración desde un único
                  lugar.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-8 text-[10px] tracking-[0.15em] text-white/35">
            © {new Date().getFullYear()} SISTEMA DE LICENCIAS
          </p>
        </div>

        {/* Panel del formulario */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
          {/* Cabecera móvil */}
          <div className="mb-7 flex items-center gap-3 md:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1D2923] text-[#D7ED4B]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  d="M7 10V7a5 5 0 0 1 10 0v3M5 10h14v10H5V10Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.15em] text-[#17201D]">
                LICENCIAS
              </p>
              <p className="text-xs text-[#68716D]">Management System</p>
            </div>
          </div>

          <div className="mb-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DDE6CA] bg-[#F0F5E6] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#91A91C]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#52652A]">
                Acceso al sistema
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-[#17201D] sm:text-4xl">
              ¡Qué gusto verte!
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#758078]">
              Ingresa tus credenciales para acceder a tu espacio de
              administración.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Correo */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-xs font-bold tracking-wide text-[#344039]"
              >
                Correo electrónico
              </label>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#89938A] transition-colors group-focus-within:text-[#70891C]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[19px] w-[19px]"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="m4 7 8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="nombre@empresa.com"
                  className="h-13 w-full rounded-xl border border-[#E1E6DF] bg-[#F7F8F4] py-3 pl-12 pr-4 text-sm text-[#17201D] outline-none transition-all placeholder:text-[#A0A8A0] hover:border-[#C6D0BF] focus:border-[#91A91C] focus:bg-white focus:ring-4 focus:ring-[#91A91C]/10 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold tracking-wide text-[#344039]"
                >
                  Contraseña
                </label>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#89938A] transition-colors group-focus-within:text-[#70891C]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[19px] w-[19px]"
                    aria-hidden="true"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="11"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 10V7a4 4 0 0 1 8 0v3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="15" r="1.2" fill="currentColor" />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Ingresa tu contraseña"
                  className="h-13 w-full rounded-xl border border-[#E1E6DF] bg-[#F7F8F4] py-3 pl-12 pr-12 text-sm text-[#17201D] outline-none transition-all placeholder:text-[#A0A8A0] hover:border-[#C6D0BF] focus:border-[#91A91C] focus:bg-white focus:ring-4 focus:ring-[#91A91C]/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-[#89938A] transition-colors hover:text-[#34483B] disabled:opacity-50"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-3.1 3.8M6.2 6.2C3.8 7.9 3 12 3 12s3.5 7 9 7c1 0 1.9-.2 2.8-.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.6"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Botón de acceso */}
            <button
              type="submit"
              disabled={loading}
              className="group relative mt-3 flex h-13 w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-[#26372C] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(38,55,44,0.15)] transition-all duration-300 hover:bg-[#34483B] hover:shadow-[0_10px_25px_rgba(38,55,44,0.25)] focus:outline-none focus:ring-4 focus:ring-[#91A91C]/25 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-[#D7ED4B]" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 text-[#D7ED4B] transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Nota de seguridad */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#E8EBE3] bg-[#F7F8F4] p-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="mt-0.5 h-4 w-4 shrink-0 text-[#70891C]"
              aria-hidden="true"
            >
              <path
                d="m12 3 8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="text-xs leading-5 text-[#758078]">
              <span className="font-semibold text-[#344039]">
                Acceso protegido.
              </span>{" "}
              Utiliza tus credenciales autorizadas para ingresar al sistema.
            </p>
          </div>

          <p className="mt-6 text-center text-[10px] tracking-[0.12em] text-[#9AA198] md:hidden">
            © {new Date().getFullYear()} SISTEMA DE LICENCIAS
          </p>
        </div>
      </section>
    </main>
  );
}
