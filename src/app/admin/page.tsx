"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, DollarSign, Globe, Package, Receipt, Store, TriangleAlert } from "lucide-react";
import { DigitalLicense, Sale } from "@/src/type";
import { useSession } from "@/src/components/session";

const CHART_DAYS = 14;
const LOW_STOCK = 2;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(price);

// SQLite guarda CURRENT_TIMESTAMP en UTC con formato "YYYY-MM-DD HH:MM:SS"
const parseSqliteDate = (value: string) => new Date(`${value.replace(" ", "T")}Z`);

// Fecha local "YYYY-MM-DD" para agrupar por día
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const countUnits = (sale: Sale) => sale.items.reduce((sum, item) => sum + item.quantity, 0);

const greeting = (now: Date) => {
  const hour = now.getHours();
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
};

export default function AdminPage() {
  const router = useRouter();
  const user = useSession();
  const [sales, setSales] = useState<Sale[]>([]);
  const [licenses, setLicenses] = useState<DigitalLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // La fecha actual se toma en el navegador (useEffect): con cacheComponents, leerla en el
  // render la evaluaría durante el prerender del servidor
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      setNow(new Date());
      try {
        const [salesRes, licensesRes] = await Promise.all([fetch("/api/sales"), fetch("/api/licenses")]);
        if (salesRes.status === 401 || licensesRes.status === 401) {
          router.push("/login");
          return;
        }
        const [salesData, licensesData] = await Promise.all([salesRes.json(), licensesRes.json()]);
        if (salesData.success) setSales(salesData.data);
        if (licensesData.success) setLicenses(licensesData.data);
        if (!salesData.success || !licensesData.success) setError("No se pudieron cargar todos los datos");
      } catch {
        setError("Error al conectar con el servidor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const stats = useMemo(() => {
    if (!now) return null;
    const monthSales = sales.filter((sale) => {
      const date = parseSqliteDate(sale.created_at);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    });

    // Ingresos por día de los últimos CHART_DAYS días (incluye hoy)
    const days = Array.from({ length: CHART_DAYS }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (CHART_DAYS - 1 - i));
      return { key: dateKey(date), date, total: 0 };
    });
    const byKey = new Map(days.map((day) => [day.key, day]));
    for (const sale of sales) {
      const day = byKey.get(dateKey(parseSqliteDate(sale.created_at)));
      if (day) day.total += sale.total;
    }
    const maxDay = Math.max(...days.map((day) => day.total), 0);

    // Licencias más vendidas por unidades
    const top = new Map<string, number>();
    for (const sale of sales) {
      for (const item of sale.items) {
        top.set(item.license_name, (top.get(item.license_name) ?? 0) + item.quantity);
      }
    }
    const topLicenses = [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const webTotal = sales.filter((s) => s.channel === "web").reduce((sum, s) => sum + s.total, 0);
    const posTotal = sales.filter((s) => s.channel === "pos").reduce((sum, s) => sum + s.total, 0);

    return {
      monthRevenue: monthSales.reduce((sum, sale) => sum + sale.total, 0),
      monthSales: monthSales.length,
      monthUnits: monthSales.reduce((sum, sale) => sum + countUnits(sale), 0),
      stock: licenses.reduce((sum, license) => sum + license.stock, 0),
      days,
      maxDay,
      chartTotal: days.reduce((sum, day) => sum + day.total, 0),
      topLicenses,
      webTotal,
      posTotal,
      lowStock: licenses
        .filter((license) => license.stock <= LOW_STOCK)
        .sort((a, b) => a.stock - b.stock),
      recent: [...sales]
        .sort((a, b) => parseSqliteDate(b.created_at).getTime() - parseSqliteDate(a.created_at).getTime())
        .slice(0, 5),
    };
  }, [sales, licenses, now]);

  const isAdmin = user?.role === "administrator";
  const channelTotal = stats ? stats.webTotal + stats.posTotal : 0;
  const webShare = stats && channelTotal > 0 ? (stats.webTotal / channelTotal) * 100 : 0;
  const topMax = stats?.topLicenses[0]?.[1] ?? 0;
  const monthName = now?.toLocaleDateString("es-ES", { month: "long" }) ?? "";

  const kpis = stats
    ? [
        { label: `Ingresos de ${monthName}`, value: formatPrice(stats.monthRevenue), icon: DollarSign },
        { label: "Ventas del mes", value: String(stats.monthSales), icon: Receipt },
        { label: "Unidades vendidas", value: String(stats.monthUnits), icon: Package },
        { label: "Claves en stock", value: String(stats.stock), icon: Store },
      ]
    : [];

  const card = "bg-[#FBFCF8] rounded-2xl border border-[#DFE3DD] shadow-sm";
  const cardTitle = "text-xs font-semibold text-[#859087] uppercase tracking-wider";

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#17201D]">
            {now ? greeting(now) : "Hola"}
            {user ? `, ${user.first_name}` : ""}
          </h1>
          <p className="text-[#68716D] mt-1">
            {isAdmin || !user ? "Así va la tienda." : "Así van tus ventas."}
          </p>
        </div>

        {error && (
          <p className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-xl px-4 py-3">{error}</p>
        )}

        {loading || !stats ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#91A91C]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map(({ label, value, icon: Icon }) => (
                <div key={label} className={`${card} p-5`}>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className={`${cardTitle} truncate`}>{label}</span>
                    <Icon className="h-5 w-5 shrink-0 text-[#91A91C]" />
                  </div>
                  <p className="text-2xl font-bold text-[#17201D] truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Ingresos diarios */}
              <div className={`${card} p-6 lg:col-span-2`}>
                <div className="flex items-baseline justify-between gap-4 mb-6">
                  <h2 className={cardTitle}>Ingresos · últimos {CHART_DAYS} días</h2>
                  <span className="text-lg font-bold text-[#17201D]">{formatPrice(stats.chartTotal)}</span>
                </div>
                <div className="flex items-end gap-1.5 h-44 2xl:h-60">
                  {stats.days.map((day) => {
                    const height = stats.maxDay > 0 ? (day.total / stats.maxDay) * 100 : 0;
                    const label = day.date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
                    return (
                      <div
                        key={day.key}
                        className="group relative flex-1 h-full flex items-end"
                        title={`${label}: ${formatPrice(day.total)}`}
                      >
                        <div
                          className={`w-full rounded-t-md transition-colors ${
                            day.total > 0 ? "bg-[#D7ED4B] group-hover:bg-[#91A91C]" : "bg-[#E7EDE2]"
                          }`}
                          style={{ height: `${Math.max(height, 3)}%` }}
                        />
                        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#17201D] px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {label} · {formatPrice(day.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-[#859087]">
                  <span>
                    {stats.days[0].date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span>Hoy</span>
                </div>
              </div>

              {/* Canal de venta */}
              <div className={`${card} p-6 flex flex-col`}>
                <h2 className={`${cardTitle} mb-6`}>Ventas por canal</h2>
                {channelTotal > 0 ? (
                  <>
                    <div className="flex h-3 rounded-full overflow-hidden bg-[#E7EDE2]">
                      <div className="bg-[#17201D]" style={{ width: `${100 - webShare}%` }} />
                      <div className="bg-[#D7ED4B]" style={{ width: `${webShare}%` }} />
                    </div>
                    <div className="mt-6 space-y-4">
                      {[
                        { label: "Mostrador (POS)", total: stats.posTotal, share: 100 - webShare, dot: "bg-[#17201D]", icon: Store },
                        { label: "Tienda web", total: stats.webTotal, share: webShare, dot: "bg-[#D7ED4B]", icon: Globe },
                      ].map(({ label, total, share, dot, icon: Icon }) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                          <Icon className="h-4 w-4 text-[#859087]" />
                          <span className="text-sm text-[#17201D] flex-1">{label}</span>
                          <span className="text-sm font-semibold text-[#17201D]">{formatPrice(total)}</span>
                          <span className="text-xs text-[#859087] w-10 text-right">{Math.round(share)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#859087]">Aún no hay ventas.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Más vendidas */}
              <div className={`${card} p-6`}>
                <h2 className={`${cardTitle} mb-5`}>Más vendidas</h2>
                {stats.topLicenses.length ? (
                  <ul className="space-y-4">
                    {stats.topLicenses.map(([name, units]) => (
                      <li key={name}>
                        <div className="flex justify-between gap-3 text-sm mb-1.5">
                          <span className="text-[#17201D] truncate">{name}</span>
                          <span className="text-[#68716D] shrink-0">{units} u.</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#E7EDE2]">
                          <div
                            className="h-full rounded-full bg-[#91A91C]"
                            style={{ width: `${(units / topMax) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#859087]">Aún no hay ventas.</p>
                )}
              </div>

              {/* Stock bajo */}
              <div className={`${card} p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={cardTitle}>Stock bajo</h2>
                  {isAdmin && (
                    <Link href="/admin/catalogo" className="text-xs text-[#91A91C] font-semibold hover:underline">
                      Ir al catálogo
                    </Link>
                  )}
                </div>
                {stats.lowStock.length ? (
                  <ul className="divide-y divide-[#DFE3DD]">
                    {stats.lowStock.map((license) => (
                      <li key={license.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="text-sm text-[#17201D] truncate">{license.name}</span>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            license.stock === 0 ? "bg-[#17201D] text-[#D7ED4B]" : "bg-[#FEF0C7] text-[#93370D]"
                          }`}
                        >
                          {license.stock === 0 ? (
                            "Agotado"
                          ) : (
                            <>
                              <TriangleAlert className="h-3 w-3" /> {license.stock}
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#859087]">Todo el catálogo tiene stock suficiente.</p>
                )}
              </div>

              {/* Últimas ventas */}
              <div className={`${card} p-6`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={cardTitle}>Últimas ventas</h2>
                  <Link
                    href="/admin/ventas"
                    className="text-xs text-[#91A91C] font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                {stats.recent.length ? (
                  <ul className="divide-y divide-[#DFE3DD]">
                    {stats.recent.map((sale) => (
                      <li key={sale.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm text-[#17201D] truncate">
                            #{sale.id} · {sale.items.map((item) => item.license_name).join(", ")}
                          </p>
                          <p className="text-xs text-[#859087]">
                            {sale.channel === "web" ? "Tienda web" : (sale.employee_name ?? "POS")} ·{" "}
                            {parseSqliteDate(sale.created_at).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[#17201D] shrink-0">
                          {formatPrice(sale.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#859087]">Aún no hay ventas.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
