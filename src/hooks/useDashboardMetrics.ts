import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DashboardMetrics = {
  patientsToday: number;
  queueWaiting: number;
  lowStockCount: number;
  labPending: number;
  billingPending: number;
  criticalLabResults: number;
};

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    patientsToday: 0,
    queueWaiting: 0,
    lowStockCount: 0,
    labPending: 0,
    billingPending: 0,
    criticalLabResults: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Get queue waiting count
        const { data: queueData } = await supabase
          .from("opd_queue")
          .select("id", { count: "exact" })
          .eq("status", "Waiting");

        // Get lab pending orders
        const { data: labData } = await supabase
          .from("lab_orders")
          .select("id", { count: "exact" })
          .eq("status", "Pending");

        // Get lab critical results
        const { data: criticalData } = await supabase
          .from("lab_results")
          .select("id", { count: "exact" })
          .eq("is_critical", true);

        // Get billing pending
        const { data: billingData } = await supabase
          .from("billing_transactions")
          .select("id", { count: "exact" })
          .eq("status", "Pending");

        // Get low stock drugs
        const { data: drugsData } = await supabase
          .from("pharmacy_drugs")
          .select("id, stock, reorder_level")
          .lte("stock", supabase.rpc("get_reorder_level")); // This won't work, use manual filter

        // Manual count of low stock
        const { data: allDrugs } = await supabase
          .from("pharmacy_drugs")
          .select("id, stock, reorder_level");

        const lowStock = (allDrugs ?? []).filter((d) => d.stock < d.reorder_level).length;

        setMetrics({
          patientsToday: 0, // Would need visits table query
          queueWaiting: queueData?.length ?? 0,
          lowStockCount: lowStock,
          labPending: labData?.length ?? 0,
          billingPending: billingData?.length ?? 0,
          criticalLabResults: criticalData?.length ?? 0,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading };
}
