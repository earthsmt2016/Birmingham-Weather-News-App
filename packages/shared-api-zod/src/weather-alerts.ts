export const SNOW_CODES = [71, 73, 75, 77, 85, 86];
export const HEAVY_RAIN_CODES = [65, 67, 82];
export const THUNDERSTORM_CODES = [95, 96, 99];
export const FREEZING_CODES = [56, 57, 66, 67];
export const FOG_CODES = [45, 48];

export const weatherCodeDescriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export interface ClientWeatherAlert {
  severity: "warning" | "danger";
  type: string;
  message: string;
  when: string;
}

export interface ServerWeatherAlert {
  title: string;
  body: string;
  isExtreme: boolean;
}

export interface CurrentWeatherRaw {
  weather_code?: number;
  weatherCode?: number;
  temperature_2m?: number;
  temperature?: number;
  wind_speed_10m?: number;
  windSpeed?: number;
  uv_index?: number;
  uvIndex?: number;
}

export interface DailyWeatherRaw {
  date?: string;
  weather_code?: number;
  weatherCode?: number;
  temperature_2m_max?: number;
  temperatureMax?: number;
  temperature_2m_min?: number;
  temperatureMin?: number;
  wind_speed_10m_max?: number;
  windSpeedMax?: number;
  uv_index_max?: number;
  uvIndexMax?: number;
  precipitation_probability_max?: number;
  precipitationProbabilityMax?: number;
}

export function getWeatherDescription(code: number): string {
  return weatherCodeDescriptions[code] || "Unknown";
}

export function detectServerAlerts(current: CurrentWeatherRaw, daily: DailyWeatherRaw[]): ServerWeatherAlert[] {
  const alerts: ServerWeatherAlert[] = [];
  const code = current.weather_code ?? current.weatherCode ?? 0;
  const temp = current.temperature_2m ?? current.temperature ?? 0;
  const wind = current.wind_speed_10m ?? current.windSpeed ?? 0;

  if (THUNDERSTORM_CODES.includes(code))
    alerts.push({ title: "Thunderstorm Alert", body: "Thunderstorm activity detected. Stay safe indoors.", isExtreme: true });
  if (SNOW_CODES.includes(code))
    alerts.push({ title: "Snow Alert", body: `Snow falling now at ${Math.round(temp)} deg C. Take care on roads.`, isExtreme: true });
  if (HEAVY_RAIN_CODES.includes(code))
    alerts.push({ title: "Heavy Rain Alert", body: "Heavy rain occurring now. Possible localised flooding.", isExtreme: true });
  if (FREEZING_CODES.includes(code))
    alerts.push({ title: "Freezing Rain Alert", body: "Freezing conditions. Roads and surfaces extremely slippery.", isExtreme: true });
  if (FOG_CODES.includes(code))
    alerts.push({ title: "Fog Alert", body: "Foggy conditions. Reduced visibility for driving.", isExtreme: false });
  if (temp >= 35)
    alerts.push({ title: "Extreme Heat Warning", body: `Temperature ${Math.round(temp)} deg C. Stay hydrated and avoid direct sun.`, isExtreme: true });
  if (temp <= -10)
    alerts.push({ title: "Extreme Cold Warning", body: `Temperature ${Math.round(temp)} deg C. Risk of hypothermia.`, isExtreme: true });
  if (wind >= 90)
    alerts.push({ title: "Storm-Force Wind Alert", body: `Winds at ${Math.round(wind)} km/h. Stay indoors.`, isExtreme: true });
  else if (wind >= 60)
    alerts.push({ title: "High Wind Alert", body: `Winds at ${Math.round(wind)} km/h. Secure loose objects.`, isExtreme: true });

  const tomorrow = daily[1];
  if (tomorrow) {
    const tCode = tomorrow.weather_code ?? tomorrow.weatherCode ?? 0;
    const tMax = tomorrow.temperature_2m_max ?? tomorrow.temperatureMax ?? 0;
    const tMin = tomorrow.temperature_2m_min ?? tomorrow.temperatureMin ?? 0;
    if (SNOW_CODES.includes(tCode))
      alerts.push({ title: "Snow Expected Tomorrow", body: `Snow forecast for tomorrow with a low of ${Math.round(tMin)} deg C.`, isExtreme: true });
    if (THUNDERSTORM_CODES.includes(tCode))
      alerts.push({ title: "Thunderstorms Tomorrow", body: "Thunderstorms are forecast for tomorrow.", isExtreme: true });
    if (HEAVY_RAIN_CODES.includes(tCode))
      alerts.push({ title: "Heavy Rain Tomorrow", body: "Heavy rain expected tomorrow.", isExtreme: true });
    if (tMax >= 35)
      alerts.push({ title: "Extreme Heat Tomorrow", body: `High of ${Math.round(tMax)} deg C expected tomorrow.`, isExtreme: true });
    if (tMin <= -10)
      alerts.push({ title: "Extreme Cold Tomorrow", body: `Low of ${Math.round(tMin)} deg C expected tomorrow.`, isExtreme: true });
  }

  return alerts;
}

export function buildGeneralWeatherSummary(current: CurrentWeatherRaw, daily: DailyWeatherRaw[], locationName: string): string {
  const temp = Math.round(current.temperature_2m ?? current.temperature ?? 0);
  const code = current.weather_code ?? current.weatherCode ?? 0;
  const desc = getWeatherDescription(code);
  const wind = Math.round(current.wind_speed_10m ?? current.windSpeed ?? 0);
  let summary = `${locationName}: ${temp} deg C, ${desc}, wind ${wind} km/h.`;

  if (daily[0]) {
    const hi = Math.round(daily[0].temperature_2m_max ?? daily[0].temperatureMax ?? 0);
    const lo = Math.round(daily[0].temperature_2m_min ?? daily[0].temperatureMin ?? 0);
    summary += ` Today: ${lo} deg C-${hi} deg C.`;
  }

  if (daily[1]) {
    const tHi = Math.round(daily[1].temperature_2m_max ?? daily[1].temperatureMax ?? 0);
    const tLo = Math.round(daily[1].temperature_2m_min ?? daily[1].temperatureMin ?? 0);
    const tCode = daily[1].weather_code ?? daily[1].weatherCode ?? 0;
    summary += ` Tomorrow: ${tLo} deg C-${tHi} deg C, ${getWeatherDescription(tCode)}.`;
  }

  return summary;
}

export function detectWeatherAlerts(current: CurrentWeatherRaw, daily: DailyWeatherRaw[]): ClientWeatherAlert[] {
  const alerts: ClientWeatherAlert[] = [];
  const weatherCode = current.weatherCode ?? current.weather_code ?? 0;
  const temperature = current.temperature ?? current.temperature_2m ?? 0;
  const windSpeed = current.windSpeed ?? current.wind_speed_10m ?? 0;
  const uvIndex = current.uvIndex ?? current.uv_index ?? 0;

  if (THUNDERSTORM_CODES.includes(weatherCode)) {
    alerts.push({ severity: "danger", type: "Thunderstorm", message: "Thunderstorm activity right now. Stay indoors and away from windows.", when: "Now" });
  }
  if (SNOW_CODES.includes(weatherCode)) {
    alerts.push({ severity: "warning", type: "Snow", message: `Snow falling now. Temperature ${Math.round(temperature)} deg C. Take care on roads.`, when: "Now" });
  }
  if (HEAVY_RAIN_CODES.includes(weatherCode)) {
    alerts.push({ severity: "warning", type: "Heavy Rain", message: "Heavy rain occurring now. Possible localised flooding.", when: "Now" });
  }
  if (FREEZING_CODES.includes(weatherCode)) {
    alerts.push({ severity: "danger", type: "Freezing Rain", message: "Freezing rain or drizzle. Roads and surfaces may be extremely slippery.", when: "Now" });
  }
  if (FOG_CODES.includes(weatherCode)) {
    alerts.push({ severity: "warning", type: "Fog", message: "Foggy conditions. Reduced visibility for driving.", when: "Now" });
  }
  if (temperature >= 35) {
    alerts.push({ severity: "danger", type: "Extreme Heat", message: `Temperature ${Math.round(temperature)} deg C. Stay hydrated, avoid direct sun, and check on vulnerable people.`, when: "Now" });
  } else if (temperature >= 30) {
    alerts.push({ severity: "warning", type: "Very Hot", message: `Temperature ${Math.round(temperature)} deg C. Stay hydrated and limit time in direct sun.`, when: "Now" });
  }
  if (temperature <= -10) {
    alerts.push({ severity: "danger", type: "Extreme Cold", message: `Temperature ${Math.round(temperature)} deg C. Risk of hypothermia and ice. Keep warm and limit outdoor exposure.`, when: "Now" });
  } else if (temperature <= -5) {
    alerts.push({ severity: "warning", type: "Very Cold", message: `Temperature ${Math.round(temperature)} deg C. Icy conditions likely. Wrap up warm.`, when: "Now" });
  }
  if (windSpeed >= 90) {
    alerts.push({ severity: "danger", type: "Storm-Force Winds", message: `Wind speed ${Math.round(windSpeed)} km/h. Danger to life from flying debris. Stay indoors.`, when: "Now" });
  } else if (windSpeed >= 60) {
    alerts.push({ severity: "warning", type: "High Winds", message: `Wind speed ${Math.round(windSpeed)} km/h. Secure loose objects, take care outdoors.`, when: "Now" });
  }
  if (uvIndex >= 11) {
    alerts.push({ severity: "danger", type: "Extreme UV", message: `UV index ${uvIndex}. Avoid sun exposure. Apply SPF 50+ if outdoors.`, when: "Now" });
  } else if (uvIndex >= 8) {
    alerts.push({ severity: "warning", type: "Very High UV", message: `UV index ${uvIndex}. Use sun protection and avoid prolonged exposure.`, when: "Now" });
  }

  for (const day of daily.slice(0, 3)) {
    const dayLabel = formatUpcomingDay(day.date ?? "");
    const dayCode = day.weatherCode ?? day.weather_code ?? 0;
    const dayMax = day.temperatureMax ?? day.temperature_2m_max ?? 0;
    const dayMin = day.temperatureMin ?? day.temperature_2m_min ?? 0;
    const dayWind = day.windSpeedMax ?? day.wind_speed_10m_max ?? 0;
    const precipitation = day.precipitationProbabilityMax ?? day.precipitation_probability_max ?? 0;

    if (THUNDERSTORM_CODES.includes(dayCode) && !alerts.some(a => a.type === "Thunderstorm")) {
      alerts.push({ severity: "danger", type: "Thunderstorm", message: `Thunderstorms expected ${dayLabel}.`, when: dayLabel });
    }
    if (SNOW_CODES.includes(dayCode) && !alerts.some(a => a.type === "Snow")) {
      alerts.push({ severity: "warning", type: "Snow", message: `Snow expected ${dayLabel}. Low of ${Math.round(dayMin)} deg C.`, when: dayLabel });
    }
    if (HEAVY_RAIN_CODES.includes(dayCode) && !alerts.some(a => a.type === "Heavy Rain")) {
      alerts.push({ severity: "warning", type: "Heavy Rain", message: `Heavy rain expected ${dayLabel}. ${precipitation}% chance of precipitation.`, when: dayLabel });
    }
    if (FREEZING_CODES.includes(dayCode) && !alerts.some(a => a.type === "Freezing Rain")) {
      alerts.push({ severity: "danger", type: "Freezing Rain", message: `Freezing rain expected ${dayLabel}. Roads may be hazardous.`, when: dayLabel });
    }
    if (dayMax >= 35 && !alerts.some(a => a.type === "Extreme Heat" || a.type === "Very Hot")) {
      alerts.push({ severity: "danger", type: "Extreme Heat", message: `High of ${Math.round(dayMax)} deg C expected ${dayLabel}.`, when: dayLabel });
    } else if (dayMax >= 30 && !alerts.some(a => a.type === "Very Hot")) {
      alerts.push({ severity: "warning", type: "Very Hot", message: `High of ${Math.round(dayMax)} deg C expected ${dayLabel}.`, when: dayLabel });
    }
    if (dayMin <= -10 && !alerts.some(a => a.type === "Extreme Cold" || a.type === "Very Cold")) {
      alerts.push({ severity: "danger", type: "Extreme Cold", message: `Low of ${Math.round(dayMin)} deg C expected ${dayLabel}.`, when: dayLabel });
    } else if (dayMin <= -5 && !alerts.some(a => a.type === "Very Cold")) {
      alerts.push({ severity: "warning", type: "Very Cold", message: `Low of ${Math.round(dayMin)} deg C expected ${dayLabel}.`, when: dayLabel });
    }
    if (dayWind >= 60 && !alerts.some(a => a.type.includes("Wind"))) {
      alerts.push({ severity: "warning", type: "High Winds", message: `Winds up to ${Math.round(dayWind)} km/h expected ${dayLabel}.`, when: dayLabel });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { danger: 0, warning: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    if (a.when === "Now" && b.when !== "Now") return -1;
    if (a.when !== "Now" && b.when === "Now") return 1;
    return 0;
  });
}

function formatUpcomingDay(dateStr: string): string {
  if (!dateStr) return "soon";
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  if (dateStr === todayStr) return "today";
  if (dateStr === tomorrowStr) return "tomorrow";
  return "on " + new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long" });
}
