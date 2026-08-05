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
import { Droplets, Wind, Thermometer, Cloud, Clock } from "lucide-react";
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
  dayGroup: "space-y-2",
  dayHeading: "text-xs font-medium text-muted-foreground pt-2 first:pt-0",
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
  return time.slice(0, 10);
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

function getDefaultHourRange(hours: WeatherCondition[]): number[] {
  const now = new Date();
  const currentHourIndex = hours.findIndex(
    (entry) => new Date(entry.time) >= now,
  );
  return [Math.max(0, currentHourIndex), Math.max(0, hours.length - 1)];
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

function WeatherEntries({ entries }: { entries: WeatherCondition[] }) {
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
        <section key={date} className={HOURLY_CLASSES.dayGroup}>
          <h4 className={HOURLY_CLASSES.dayHeading}>{formatDateLabel(date)}</h4>
          {dayEntries.map((entry) => (
            <WeatherEntry key={entry.time} entry={entry} />
          ))}
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

  useEffect(() => {
    setDayRange(([start, end]) => [
      Math.min(start, Math.max(0, days.length - 1)),
      Math.min(Math.max(start, end), Math.max(0, days.length - 1)),
    ]);
    setHourRange(null);
  }, [days]);

  const selectedDayHours = hourly.filter((entry) => {
    const dayIndex = days.indexOf(getDateFromTime(entry.time));
    return dayIndex >= dayRange[0] && dayIndex <= dayRange[1];
  });
  const effectiveHourRange = hourRange ?? getDefaultHourRange(selectedDayHours);
  const selectedHours = selectedDayHours.slice(
    effectiveHourRange[0],
    effectiveHourRange[1] + 1,
  );

  const handleDayRangeChange = (range: number[]) => {
    setDayRange(range);
    setHourRange(null);
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

      <Tabs defaultValue="day" className={HOURLY_CLASSES.tabs}>
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
            <WeatherEntries entries={selectedHours} />
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
                {selectedDayHours.length > 0
                  ? `${formatTime(selectedDayHours[effectiveHourRange[0]].time)} - ${formatTime(selectedDayHours[effectiveHourRange[1]].time)}`
                  : "No hours available"}
              </span>
            </div>
            <Slider
              min={0}
              max={Math.max(0, selectedDayHours.length - 1)}
              step={1}
              value={effectiveHourRange}
              onValueChange={setHourRange}
              data-testid="slider-hour-range"
              aria-label="Select hour range"
              disabled={selectedDayHours.length === 0}
            />
            <div className={HOURLY_CLASSES.sliderEnds}>
              <span className={HOURLY_CLASSES.sliderText}>
                {selectedDayHours[0]
                  ? formatTime(selectedDayHours[0].time)
                  : ""}
              </span>
              <span className={HOURLY_CLASSES.sliderText}>
                {selectedDayHours.length > 0
                  ? formatTime(
                      selectedDayHours[selectedDayHours.length - 1].time,
                    )
                  : ""}
              </span>
            </div>
          </div>

          <div className="mt-4">
            {selectedHours.length > 0 ? (
              <WeatherEntries entries={selectedHours} />
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
