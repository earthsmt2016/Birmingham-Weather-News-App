import { useEffect, useMemo, useState } from "react";
import type { WeatherCondition } from "@workspace/shared-api-zod";
import { WeatherIcon } from "./weather-icon";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getWeatherIcon,
  getWeatherDescription,
  formatTime,
} from "@/lib/weather-utils";
import {
  ChevronDown,
  ChevronUp,
  Cloud,
  Clock,
  Droplets,
  Thermometer,
  Wind,
} from "lucide-react";
import { MUTED_LABEL } from "@/lib/styles";

const STAT_CLASSES = {
  icon: "w-3 h-3 text-muted-foreground",
  label: MUTED_LABEL,
} as const;

const HOURLY_CLASSES = {
  card: "p-4",
  header: "flex items-center justify-between gap-2 mb-4 flex-wrap",
  heading: "text-sm font-medium text-muted-foreground",
  badgeRow: "flex items-center gap-2",
  clockIcon: "w-3.5 h-3.5 text-muted-foreground",
  control: "px-1",
  controlHeader: "flex items-center justify-between gap-2 mb-2",
  controlLabel: "text-xs font-medium",
  controlValue: "text-xs text-muted-foreground",
  sliderEnds: "flex justify-between mt-1.5",
  sliderText: "text-[10px] text-muted-foreground",
  tabs: "w-full",
  tabsList: "grid w-full grid-cols-2",
  content: "mt-4",
  grid: "grid gap-2",
  dayCard:
    "w-full rounded-md bg-muted/30 p-3 text-left transition-colors hover:bg-muted/50",
  dayCardHeader: "flex items-center gap-3",
  dayCardDate: "text-sm font-medium",
  dayCardIcon: "w-6 h-6 text-foreground",
  dayCardSummary: "text-sm text-muted-foreground",
  dayCardChevron: "ml-auto w-4 h-4 text-muted-foreground",
  dayCardHours: "mt-3 space-y-2",
  entry: "flex items-center gap-4 p-3 rounded-md bg-muted/30 flex-wrap",
  time: "text-sm font-medium w-12 text-muted-foreground",
  entryIcon: "w-6 h-6 text-foreground",
  temp: "text-sm font-medium w-10",
  statsRow: "flex items-center gap-4 ml-auto flex-wrap",
  statItem: "flex items-center gap-1",
  empty: "py-4 text-sm text-muted-foreground text-center",
} as const;

interface HourlyBreakdownProps {
  hourly: WeatherCondition[];
}

function getDateFromTime(time: string): string {
  const date = new Date(time);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDateLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(days: string[], [start, end]: number[]): string {
  const startLabel = formatDateLabel(days[start] ?? "");
  const endLabel = formatDateLabel(days[end] ?? "");
  return start === end ? startLabel : `${startLabel} - ${endLabel}`;
}

function getHourFromTime(time: string): number {
  return new Date(time).getHours();
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function WeatherEntry({ entry }: { entry: WeatherCondition }) {
  const iconName = getWeatherIcon(entry.weatherCode, entry.isDay);
  const description = getWeatherDescription(entry.weatherCode);

  return (
    <div
      className={HOURLY_CLASSES.entry}
      data-testid={`hourly-entry-${entry.time}`}
    >
      <span
        className={HOURLY_CLASSES.time}
        data-testid={`text-hourly-time-${entry.time}`}
      >
        {formatTime(entry.time)}
      </span>
      <WeatherIcon iconName={iconName} className={HOURLY_CLASSES.entryIcon} />
      <span
        className={HOURLY_CLASSES.temp}
        data-testid={`text-hourly-temp-${entry.time}`}
      >
        {Math.round(entry.temperature)}°C
      </span>
      <span
        className={`${STAT_CLASSES.label} flex-1 min-w-[80px]`}
        data-testid={`text-hourly-desc-${entry.time}`}
      >
        {description}
      </span>
      <div className={HOURLY_CLASSES.statsRow}>
        <div className={HOURLY_CLASSES.statItem}>
          <Thermometer className={STAT_CLASSES.icon} />
          <span
            className={STAT_CLASSES.label}
            data-testid={`text-hourly-feels-${entry.time}`}
          >
            {Math.round(entry.feelsLike)}°
          </span>
        </div>
        <div className={HOURLY_CLASSES.statItem}>
          <Droplets className={STAT_CLASSES.icon} />
          <span
            className={STAT_CLASSES.label}
            data-testid={`text-hourly-humidity-${entry.time}`}
          >
            {entry.humidity}%
          </span>
        </div>
        <div className={HOURLY_CLASSES.statItem}>
          <Wind className={STAT_CLASSES.icon} />
          <span
            className={STAT_CLASSES.label}
            data-testid={`text-hourly-wind-${entry.time}`}
          >
            {Math.round(entry.windSpeed)}km/h
          </span>
        </div>
        <div className={HOURLY_CLASSES.statItem}>
          <Cloud className={STAT_CLASSES.icon} />
          <span
            className={STAT_CLASSES.label}
            data-testid={`text-hourly-cloud-${entry.time}`}
          >
            {entry.cloudCover}%
          </span>
        </div>
      </div>
    </div>
  );
}

interface WeatherEntriesProps {
  entries: WeatherCondition[];
  expandedDay: string | null;
  onExpandedDayChange: (date: string | null) => void;
}

function WeatherEntries({
  entries,
  expandedDay,
  onExpandedDayChange,
}: WeatherEntriesProps) {
  const entriesByDay = entries.reduce<Map<string, WeatherCondition[]>>(
    (groupedEntries, entry) => {
      const date = getDateFromTime(entry.time);
      const dayEntries = groupedEntries.get(date) ?? [];
      dayEntries.push(entry);
      groupedEntries.set(date, dayEntries);
      return groupedEntries;
    },
    new Map(),
  );

  return (
    <div className={HOURLY_CLASSES.grid}>
      {[...entriesByDay].map(([date, dayEntries]) => (
        <section key={date}>
          <button
            type="button"
            className={HOURLY_CLASSES.dayCard}
            onClick={() =>
              onExpandedDayChange(expandedDay === date ? null : date)
            }
            aria-expanded={expandedDay === date}
            aria-controls={`weather-day-hours-${date}`}
            data-testid={`button-expand-weather-day-${date}`}
          >
            <div className={HOURLY_CLASSES.dayCardHeader}>
              <WeatherIcon
                iconName={getWeatherIcon(
                  dayEntries[0].weatherCode,
                  dayEntries[0].isDay,
                )}
                className={HOURLY_CLASSES.dayCardIcon}
              />
              <div>
                <p className={HOURLY_CLASSES.dayCardDate}>
                  {formatDateLabel(date)}
                </p>
                <p className={HOURLY_CLASSES.dayCardSummary}>
                  {Math.round(
                    Math.min(...dayEntries.map((entry) => entry.temperature)),
                  )}
                  °C -{" "}
                  {Math.round(
                    Math.max(...dayEntries.map((entry) => entry.temperature)),
                  )}
                  °C
                </p>
              </div>
              {expandedDay === date ? (
                <ChevronUp className={HOURLY_CLASSES.dayCardChevron} />
              ) : (
                <ChevronDown className={HOURLY_CLASSES.dayCardChevron} />
              )}
            </div>
          </button>
          <div
            id={`weather-day-hours-${date}`}
            className={HOURLY_CLASSES.dayCardHours}
            hidden={expandedDay !== date}
          >
            {dayEntries.map((entry) => (
              <WeatherEntry key={entry.time} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function HourlyBreakdown({ hourly }: HourlyBreakdownProps) {
  const days = useMemo(
    () => [...new Set(hourly.map((entry) => getDateFromTime(entry.time)))],
    [hourly],
  );
  const [dayRange, setDayRange] = useState(() => [
    0,
    Math.max(0, days.length - 1),
  ]);
  const [hourRange, setHourRange] = useState<number[] | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    setDayRange(([start, end]) => [
      Math.min(start, Math.max(0, days.length - 1)),
      Math.min(Math.max(start, end), Math.max(0, days.length - 1)),
    ]);
    setHourRange(null);
    setExpandedDay(null);
  }, [days]);

  const selectedDates = new Set(days.slice(dayRange[0], dayRange[1] + 1));
  const selectedDateHours = hourly.filter((entry) =>
    selectedDates.has(getDateFromTime(entry.time)),
  );
  const effectiveHourRange = hourRange ?? [0, 23];
  const selectedHours = selectedDateHours.filter((entry) => {
    const hour = getHourFromTime(entry.time);
    return hour >= effectiveHourRange[0] && hour <= effectiveHourRange[1];
  });

  const handleDayRangeChange = (range: number[]) => {
    setDayRange(range);
    setHourRange(null);
    setExpandedDay(null);
  };

  const handleHourRangeChange = (range: number[]) => {
    setHourRange(range);
    setExpandedDay(null);
  };

  const handleViewChange = (view: string) => {
    if (view === "day") {
      setHourRange(null);
      setExpandedDay(null);
    }
  };

  if (hourly.length === 0) {
    return null;
  }

  return (
    <Card className={HOURLY_CLASSES.card} data-testid="card-hourly-breakdown">
      <div className={HOURLY_CLASSES.header}>
        <h3 className={HOURLY_CLASSES.heading}>Custom Weather Breakdown</h3>
        <div className={HOURLY_CLASSES.badgeRow}>
          <Clock className={HOURLY_CLASSES.clockIcon} />
          <span className={STAT_CLASSES.label}>
            Choose a date or hour range
          </span>
        </div>
      </div>

      <Tabs
        defaultValue="day"
        className={HOURLY_CLASSES.tabs}
        onValueChange={handleViewChange}
      >
        <TabsList className={HOURLY_CLASSES.tabsList}>
          <TabsTrigger value="day" data-testid="tab-day-breakdown">
            Date range
          </TabsTrigger>
          <TabsTrigger value="hour" data-testid="tab-hour-breakdown">
            Hour range
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="day"
          className={HOURLY_CLASSES.content}
          data-testid="panel-day-breakdown"
        >
          <div className={HOURLY_CLASSES.control}>
            <div className={HOURLY_CLASSES.controlHeader}>
              <span className={HOURLY_CLASSES.controlLabel}>Dates</span>
              <span
                className={HOURLY_CLASSES.controlValue}
                data-testid="text-selected-day-range"
              >
                {formatDateRange(days, dayRange)}
              </span>
            </div>
            <Slider
              min={0}
              max={Math.max(0, days.length - 1)}
              step={1}
              value={dayRange}
              onValueChange={handleDayRangeChange}
              data-testid="slider-day-range"
              aria-label="Select date range"
            />
            <div className={HOURLY_CLASSES.sliderEnds}>
              <span className={HOURLY_CLASSES.sliderText}>
                {formatDateLabel(days[0] ?? "")}
              </span>
              <span className={HOURLY_CLASSES.sliderText}>
                {formatDateLabel(days[days.length - 1] ?? "")}
              </span>
            </div>
          </div>

          <div className="mt-4">
            {selectedHours.length > 0 ? (
              <WeatherEntries
                entries={selectedHours}
                expandedDay={expandedDay}
                onExpandedDayChange={setExpandedDay}
              />
            ) : (
              <p className={HOURLY_CLASSES.empty}>
                No weather is available for this range.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="hour"
          className={HOURLY_CLASSES.content}
          data-testid="panel-hour-breakdown"
        >
          <div className={HOURLY_CLASSES.control}>
            <div className={HOURLY_CLASSES.controlHeader}>
              <span className={HOURLY_CLASSES.controlLabel}>Hours</span>
              <span
                className={HOURLY_CLASSES.controlValue}
                data-testid="text-selected-hour-range"
              >
                {formatHour(effectiveHourRange[0])} -{" "}
                {formatHour(effectiveHourRange[1])}
              </span>
            </div>
            <Slider
              min={0}
              max={23}
              step={1}
              value={effectiveHourRange}
              onValueChange={handleHourRangeChange}
              data-testid="slider-hour-range"
              aria-label="Select hour range"
            />
            <div className={HOURLY_CLASSES.sliderEnds}>
              <span className={HOURLY_CLASSES.sliderText}>00:00</span>
              <span className={HOURLY_CLASSES.sliderText}>23:00</span>
            </div>
          </div>

          <div className="mt-4">
            {selectedHours.length > 0 ? (
              <WeatherEntries
                entries={selectedHours}
                expandedDay={expandedDay}
                onExpandedDayChange={setExpandedDay}
              />
            ) : (
              <p className={HOURLY_CLASSES.empty}>
                No weather is available for this range.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
