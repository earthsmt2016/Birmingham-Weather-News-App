import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGeneralWeatherSummary,
  detectServerAlerts,
  detectWeatherAlerts,
} from "../src/weather-alerts";

test("detectWeatherAlerts prioritizes current dangerous conditions", () => {
  const alerts = detectWeatherAlerts(
    {
      weatherCode: 95,
      temperature: 36,
      windSpeed: 92,
      uvIndex: 9,
    },
    [
      {
        date: new Date().toISOString().slice(0, 10),
        weatherCode: 65,
        temperatureMax: 22,
        temperatureMin: 13,
        windSpeedMax: 30,
        precipitationProbabilityMax: 90,
      },
    ],
  );

  assert.equal(alerts[0].severity, "danger");
  assert.equal(alerts[0].when, "Now");
  assert.ok(alerts.some((alert) => alert.type === "Thunderstorm"));
  assert.ok(alerts.some((alert) => alert.type === "Extreme Heat"));
  assert.ok(alerts.some((alert) => alert.type === "Storm-Force Winds"));
});

test("detectServerAlerts returns push-ready extreme weather messages", () => {
  const alerts = detectServerAlerts(
    {
      weather_code: 75,
      temperature_2m: -2,
      wind_speed_10m: 20,
    },
    [
      {},
      {
        weather_code: 95,
        temperature_2m_max: 18,
        temperature_2m_min: 8,
      },
    ],
  );

  assert.deepEqual(alerts.map((alert) => alert.title), [
    "Snow Alert",
    "Thunderstorms Tomorrow",
  ]);
  assert.ok(alerts.every((alert) => alert.isExtreme));
});

test("buildGeneralWeatherSummary keeps notification copy ASCII-safe", () => {
  const summary = buildGeneralWeatherSummary(
    {
      weather_code: 0,
      temperature_2m: 12.4,
      wind_speed_10m: 14.2,
    },
    [
      {
        temperature_2m_max: 15.2,
        temperature_2m_min: 8.7,
      },
      {
        weather_code: 61,
        temperature_2m_max: 14.6,
        temperature_2m_min: 7.3,
      },
    ],
    "Birmingham",
  );

  assert.equal(
    summary,
    "Birmingham: 12 deg C, Clear sky, wind 14 km/h. Today: 9 deg C-15 deg C. Tomorrow: 7 deg C-15 deg C, Slight rain.",
  );
});
