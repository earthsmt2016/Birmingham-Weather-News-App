import type { GeocodeResult } from "@workspace/shared-api-zod";

interface GeocodingApiResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  state_district?: string;
  country?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

export async function searchLocations(query: string): Promise<GeocodeResult[]> {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query.trim());
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);

  const data = (await response.json()) as { results?: GeocodingApiResult[] };
  return (data.results ?? []).map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country || "",
    region: result.admin1 || "",
  }));
}

export async function reverseGeocode(lat: number, lon: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: { "User-Agent": "WeatherDashboardApp/1.0" },
  });
  if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);

  const data = (await response.json()) as NominatimResponse;
  const address = data.address ?? {};
  const name =
    address.city ||
    address.town ||
    address.village ||
    address.county ||
    address.state ||
    data.display_name?.split(",")[0] ||
    "Unknown";
  const regionParts = [address.state_district, address.county, address.state].filter(Boolean);
  const region = Array.from(new Set(regionParts)).join(", ");

  return {
    name,
    region,
    country: address.country || "",
    lat,
    lon,
  };
}
