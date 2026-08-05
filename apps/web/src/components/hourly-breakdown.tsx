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
  controls: "space-y-4",
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

function getInitialHourIndex(hours: WeatherCondition[]): number {
  const currentHourIndex = hours.findIndex(
    (entry) => new Date(entry.time) >= new Date(),
  );
  return Math.max(0, currentHourIndex);
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

export function HourlyBreakdown({ hourly }: HourlyBreakdownProps) {
  const days = useMemo(
    () => [...new Set(hourly.map((entry) => getDateFromTime(entry.time)))],
    [hourly],
  );
  const [selectedDay, setSelectedDay] = useState(() => days[0] ?? "");
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (!days.includes(selectedDay)) {
      setSelectedDay(days[0] ?? "");
      setSelectedHourIndex(null);
    }
  }, [days, selectedDay]);

  const selectedDayIndex = Math.max(0, days.indexOf(selectedDay));
  const selectedDayHours = hourly.filter(
    (entry) => getDateFromTime(entry.time) === selectedDay,
  );
  const selectedHour =
    selectedHourIndex === null
      ? null
      : (selectedDayHours[selectedHourIndex] ?? null);

  const handleDayChange = ([dayIndex]: number[]) => {
    setSelectedDay(days[dayIndex] ?? "");
    setSelectedHourIndex(null);
  };

  const handleHourChange = ([hourIndex]: number[]) => {
    setSelectedHourIndex(hourIndex);
  };

  const handleViewChange = (view: string) => {
    if (view === "day") {
      setSelectedHourIndex(null);
    } else if (selectedHourIndex === null && selectedDayHours.length > 0) {
      setSelectedHourIndex(getInitialHourIndex(selectedDayHours));
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
          <span className={STAT_CLASSES.label}>Choose a day and hour</span>
        </div>
      </div>

      <div className={HOURLY_CLASSES.controls}>
        <div className={HOURLY_CLASSES.control}>
          <div className={HOURLY_CLASSES.controlHeader}>
            <span className={HOURLY_CLASSES.controlLabel}>Day</span>
            <span
              className={HOURLY_CLASSES.controlValue}
              data-testid="text-selected-day"
            >
              {formatDateLabel(selectedDay)}
            </span>
          </div>
          <Slider
            min={0}
            max={Math.max(0, days.length - 1)}
            step={1}
            value={[selectedDayIndex]}
            onValueChange={handleDayChange}
            data-testid="slider-day"
            aria-label="Select day"
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
      </div>

      <Tabs
        defaultValue="day"
        className={HOURLY_CLASSES.tabs}
        onValueChange={handleViewChange}
      >
        <TabsList className={HOURLY_CLASSES.tabsList}>
          <TabsTrigger value="day" data-testid="tab-day-breakdown">
            Day
          </TabsTrigger>
          <TabsTrigger value="hour" data-testid="tab-hour-breakdown">
            Hour
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="day"
          className={HOURLY_CLASSES.content}
          data-testid="panel-day-breakdown"
        >
          <div className={HOURLY_CLASSES.grid}>
            {selectedDayHours.map((entry) => (
              <WeatherEntry key={entry.time} entry={entry} />
            ))}
          </div>
        </TabsContent>

        <TabsContent
          value="hour"
          className={HOURLY_CLASSES.content}
          data-testid="panel-hour-breakdown"
        >
          <div className={HOURLY_CLASSES.control}>
            <div className={HOURLY_CLASSES.controlHeader}>
              <span className={HOURLY_CLASSES.controlLabel}>Hour</span>
              <span
                className={HOURLY_CLASSES.controlValue}
                data-testid="text-selected-hour"
              >
                {selectedHour
                  ? formatTime(selectedHour.time)
                  : "Choose an hour"}
              </span>
            </div>
            <Slider
              min={0}
              max={Math.max(0, selectedDayHours.length - 1)}
              step={1}
              value={[selectedHourIndex ?? 0]}
              onValueChange={handleHourChange}
              data-testid="slider-hour"
              aria-label="Select hour"
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

          <div className={`${HOURLY_CLASSES.grid} mt-4`}>
            {selectedHour ? (
              <WeatherEntry entry={selectedHour} />
            ) : (
              <p className={HOURLY_CLASSES.empty}>
                Choose an hour to view its weather.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
