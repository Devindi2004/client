import { api, isApiUnavailable } from "@/lib/api";
import { getAnalyticsDashboardData } from "@/lib/data/analytics";
import type { AnalyticsDashboardData, AnalyticsRange } from "@/types/analytics";

export async function getAnalytics(range: AnalyticsRange = "7d") {
  try {
    const response = await api.get<{ data: AnalyticsDashboardData }>(
      `/api/analytics?range=${range}`
    );
    return response.data.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return getAnalyticsDashboardData(range);
    }
    return getAnalyticsDashboardData(range);
  }
}
