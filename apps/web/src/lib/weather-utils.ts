export {
  detectWeatherAlerts,
  getWeatherDescription,
  type ClientWeatherAlert as WeatherAlert,
} from "@workspace/shared-api-zod";

export function getWeatherIcon(code: number, isDay: number): string {
  const day = isDay === 1;
  const icons: Record<number, string> = {
    0: day ? "sun" : "moon",
    1: day ? "sun-dim" : "moon",
    2: day ? "cloud-sun" : "cloud-moon",
    3: "cloud",
    45: "cloud-fog",
    48: "cloud-fog",
    51: "cloud-drizzle",
    53: "cloud-drizzle",
    55: "cloud-drizzle",
    56: "cloud-hail",
    57: "cloud-hail",
    61: "cloud-rain",
    63: "cloud-rain",
    65: "cloud-rain-wind",
    66: "cloud-hail",
    67: "cloud-hail",
    71: "snowflake",
    73: "snowflake",
    75: "snowflake",
    77: "snowflake",
    80: "cloud-rain",
    81: "cloud-rain",
    82: "cloud-rain-wind",
    85: "snowflake",
    86: "snowflake",
    95: "cloud-lightning",
    96: "cloud-lightning",
    99: "cloud-lightning",
  };
  return icons[code] || "cloud";
}

const WEATHER_GRADIENTS = {
  clearDay:     "from-amber-400/20 to-sky-400/20",
  clearNight:   "from-indigo-900/20 to-slate-800/20",
  cloudyDay:    "from-slate-300/20 to-sky-300/20",
  cloudyNight:  "from-slate-700/20 to-indigo-800/20",
  rain:         "from-slate-400/20 to-blue-400/20",
  snow:         "from-slate-200/20 to-blue-200/20",
  storm:        "from-slate-600/20 to-purple-600/20",
  default:      "from-slate-300/20 to-slate-400/20",
} as const;

export function getWeatherGradient(code: number, isDay: number): string {
  const day = isDay === 1;
  if (code === 0 || code === 1) return day ? WEATHER_GRADIENTS.clearDay   : WEATHER_GRADIENTS.clearNight;
  if (code === 2 || code === 3) return day ? WEATHER_GRADIENTS.cloudyDay  : WEATHER_GRADIENTS.cloudyNight;
  if (code >= 51 && code <= 67) return WEATHER_GRADIENTS.rain;
  if (code >= 71 && code <= 86) return WEATHER_GRADIENTS.snow;
  if (code >= 95)               return WEATHER_GRADIENTS.storm;
  return WEATHER_GRADIENTS.default;
}

export function formatTime(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDate(timeStr: string): string {
  const date = new Date(timeStr);
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
