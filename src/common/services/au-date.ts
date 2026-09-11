/**
 * Australian business-date helpers.
 *
 * The app is for Australian sole traders, so "today" for validation purposes
 * is the calendar day in Australia/Sydney — not the host's or UTC's day. A
 * receipt date entered at 07:00 on July 1 in Sydney (June 30 in UTC) must be
 * accepted and attributed to the July quarter.
 */

/**
 * Business timezone for date validation and attribution semantics.
 */
export const AU_BUSINESS_TIMEZONE = 'Australia/Sydney';

/**
 * Today's calendar date in the Australian business timezone (YYYY-MM-DD).
 *
 * `Intl` is used with `en-CA` because it formats as YYYY-MM-DD directly,
 * without any time-of-day arithmetic that could drift across midnight.
 */
export function australianTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: AU_BUSINESS_TIMEZONE,
  }).format(new Date());
}

/**
 * Parses a strict date-only string (YYYY-MM-DD or D/M/YYYY) into a
 * UTC-midnight Date representing exactly that calendar day.
 *
 * Returns null for anything that is not one of the two supported formats, a
 * non-existent calendar date (e.g. 2026-06-31), or a value carrying a time or
 * offset component (the advertised contract is date-only; silent rollover or
 * timestamp truncation would change the reporting quarter). Callers decide
 * how to surface the failure (HTTP 400 vs CSV row error).
 */
export function parseStrictDateOnly(value: string): Date | null {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const auMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  let year: number;
  let month: number;
  let day: number;

  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else if (auMatch) {
    year = parseInt(auMatch[3], 10);
    month = parseInt(auMatch[2], 10);
    day = parseInt(auMatch[1], 10);
  } else {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  // Component round-trip rejects impossible dates that Date.UTC would
  // otherwise silently normalize (e.g. June 31 -> July 1).
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}
