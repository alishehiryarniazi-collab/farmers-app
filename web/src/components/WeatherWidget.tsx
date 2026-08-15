"use client";

import { useEffect, useState } from "react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  humidity: number;
  windSpeed: number;
  todayMax: number;
  todayMin: number;
  rainChance: number;
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Heavy rain showers",
  95: "Thunderstorm",
};

function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "❄️";
  if (code <= 82) return "🌦️";
  return "⛈️";
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "denied" | "error" | "unsupported">("loading");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const params = new URLSearchParams({
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
            current: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
            daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            timezone: "auto",
          });
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
          if (!res.ok) throw new Error("Weather request failed");
          const data = await res.json();
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            weatherCode: data.current.weather_code,
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            todayMax: Math.round(data.daily.temperature_2m_max[0]),
            todayMin: Math.round(data.daily.temperature_2m_min[0]),
            rainChance: data.daily.precipitation_probability_max[0],
          });
          setStatus("ready");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("denied"),
      { timeout: 10000 }
    );
  }, []);

  if (status === "unsupported") return null;

  return (
    <div className="rounded-lg border border-brand-200 bg-white p-5 shadow-sm">
      <p className="font-heading font-semibold text-brand-800">Local weather</p>

      {status === "loading" && <p className="mt-2 text-sm text-brand-500">Getting your location...</p>}

      {status === "denied" && (
        <p className="mt-2 text-sm text-brand-500">
          Enable location access in your browser to see local weather for planning your farm work.
        </p>
      )}

      {status === "error" && <p className="mt-2 text-sm text-brand-500">Couldn't load weather right now.</p>}

      {status === "ready" && weather && (
        <div className="mt-2 flex items-center gap-4">
          <span className="text-4xl">{weatherIcon(weather.weatherCode)}</span>
          <div>
            <p className="text-2xl font-bold text-brand-800">{weather.temperature}°C</p>
            <p className="text-sm text-brand-600">{WEATHER_DESCRIPTIONS[weather.weatherCode] ?? "—"}</p>
          </div>
          <div className="ml-auto space-y-0.5 text-right text-xs text-brand-500">
            <p>
              H: {weather.todayMax}° L: {weather.todayMin}°
            </p>
            <p>💧 {weather.humidity}% · 🌬️ {weather.windSpeed} km/h</p>
            <p>🌧️ {weather.rainChance}% chance of rain</p>
          </div>
        </div>
      )}
    </div>
  );
}
