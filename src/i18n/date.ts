type DateOptions = Pick<Intl.DateTimeFormatOptions, "timeZone" | "timeZoneName" | "hour" | "minute" | "second">;

export function formatNumericDate(date: Date, options: DateOptions = {}): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
    ...options
  }).formatToParts(date);

  const { year, month, day, hour, minute, second, timeZoneName } = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  const calendar = [year, month, day].join(".");
  const clock = [hour, minute, second].filter(Boolean).join(":");
  return [calendar, clock, timeZoneName].filter(Boolean).join(" ");
}
