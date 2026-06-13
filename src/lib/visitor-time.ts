const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

function formatUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getWibDayStartUtc(date = new Date()) {
  const wibDate = new Date(date.getTime() + WIB_OFFSET_MS);
  const utcMidnightForWibDate = Date.UTC(
    wibDate.getUTCFullYear(),
    wibDate.getUTCMonth(),
    wibDate.getUTCDate()
  );

  return new Date(utcMidnightForWibDate - WIB_OFFSET_MS);
}

export function getWibDateString(date = new Date()) {
  return formatUtcDate(new Date(date.getTime() + WIB_OFFSET_MS));
}

export function getPreviousWibDateString(daysBack = 1, date = new Date()) {
  const wibDate = new Date(date.getTime() + WIB_OFFSET_MS);
  wibDate.setUTCDate(wibDate.getUTCDate() - daysBack);
  return formatUtcDate(wibDate);
}
