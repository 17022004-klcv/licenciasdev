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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (data.success) {
        // Guardar token en localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("employee", JSON.stringify(data.data.employee));
        }

        await Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: "Autenticación exitosa",
          timer: 1500,
          showConfirmButton: false,
        });

        router.push("/");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error || "Credenciales inválidas",
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al conectar con el servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Bolas de colores de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Bolas grandes */}
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gray-700 opacity-40 blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-gray-600 opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-60 left-1/4 h-72 w-72 rounded-full bg-gray-700 opacity-35 blur-3xl animate-pulse"></div>

        {/* Bolas pequeñas */}
        <div className="absolute top-40 left-60 h-40 w-40 rounded-full bg-gray-600 opacity-40 blur-2xl"></div>
        <div className="absolute bottom-40 right-60 h-36 w-36 rounded-full bg-gray-700 opacity-35 blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 h-32 w-32 rounded-full bg-gray-600 opacity-40 blur-2xl"></div>
        <div className="absolute bottom-20 left-10 h-28 w-28 rounded-full bg-gray-700 opacity-40 blur-2xl"></div>
        <div className="absolute top-10 right-40 h-24 w-24 rounded-full bg-gray-600 opacity-45 blur-xl"></div>
      </div>

      {/* Contenedor principal con efecto blur */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/20">
          <div className="grid md:grid-cols-2">
            {/* Lado izquierdo - Imagen */}
            <div className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80"></div>
              <Image
                src="/auth.jpg"
                alt="Login illustration"
                width={500}
                height={500}
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                <h2 className="mb-4 text-3xl font-bold">
                  Sistema de Licencias
                </h2>
                <p className="text-center text-lg opacity-90">
                  Gestión de licencias digitales
                </p>
              </div>
            </div>

            {/* Lado derecho - Formulario */}
            <div className="p-8 md:p-12">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-white">
                  Iniciar Sesión
                </h1>
                <p className="text-white/70">
                  Ingresa tus credenciales para continuar
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-white"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-gray-700 to-gray-900 px-4 py-3 font-semibold text-white transition-all hover:from-gray-600 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
