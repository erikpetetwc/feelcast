import { NextRequest, NextResponse } from "next/server";
import { getCurrentObs, getDailyForecast, getAchePainIndex, getBreathingIndex, getPollenIndex, getHourlyForecast, getAirQuality } from "@/lib/twc";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
  }

  const [obs, forecast, achePain, breathing, pollen, hourly, airQuality] = await Promise.allSettled([
    getCurrentObs(lat, lon),
    getDailyForecast(lat, lon),
    getAchePainIndex(lat, lon),
    getBreathingIndex(lat, lon),
    getPollenIndex(lat, lon),
    getHourlyForecast(lat, lon),
    getAirQuality(lat, lon),
  ]);

  return NextResponse.json({
    obs: obs.status === "fulfilled" ? obs.value : null,
    forecast: forecast.status === "fulfilled" ? forecast.value : null,
    achePain: achePain.status === "fulfilled" ? achePain.value : null,
    breathing: breathing.status === "fulfilled" ? breathing.value : null,
    pollen: pollen.status === "fulfilled" ? pollen.value : null,
    hourly: hourly.status === "fulfilled" ? hourly.value : null,
    airQuality: airQuality.status === "fulfilled" ? airQuality.value : null,
  });
}
