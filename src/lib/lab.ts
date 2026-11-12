export type Reading = {
	/** Stable key, e.g. "office_temp". */
	id: string;
	/** Human label, e.g. "Office". */
	label: string;
	value: number | string;
	/** e.g. "°F", "%", "h". */
	unit?: string;
	/** Section heading, e.g. "Climate", "3D printer". */
	group?: string;
};

export type Snapshot = {
	readings: Reading[];
	/** ISO time the Worker accepted the snapshot (never trusted from the client). */
	receivedAt: string;
};

export const KV_KEY = 'snapshot';

const MAX_READINGS = 40;
const MAX_TEXT = 64;

const text = (v: unknown, max = MAX_TEXT): string | undefined =>
	typeof v === 'string' && v.trim() !== '' ? v.trim().slice(0, max) : undefined;

/** Drops anything unexpected, since this data is rendered on a public page. */
export function parseReadings(body: unknown): Reading[] | null {
	if (!body || typeof body !== 'object' || !Array.isArray((body as { readings?: unknown }).readings)) {
		return null;
	}
	const readings: Reading[] = [];
	for (const raw of (body as { readings: unknown[] }).readings.slice(0, MAX_READINGS)) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		const id = text(r.id);
		const label = text(r.label);
		// HA templates often produce numbers as strings ("21.4"), so accept both.
		const value =
			typeof r.value === 'number' && Number.isFinite(r.value) ? r.value : text(r.value);
		if (!id || !label || value === undefined) continue;
		readings.push({ id, label, value, unit: text(r.unit, 8), group: text(r.group) });
	}
	return readings.length ? readings : null;
}

export type Freshness = 'live' | 'stale' | 'offline';

/** Thresholds assume Home Assistant pushes every 5 minutes. */
export function freshness(receivedAt: string, now: number): Freshness {
	const then = Date.parse(receivedAt);
	if (Number.isNaN(then)) return 'offline';
	const age = now - then;
	if (age < 0) return 'offline';
	if (age < 10 * 60 * 1000) return 'live';
	if (age < 30 * 60 * 1000) return 'stale';
	return 'offline';
}

export type TempUnit = '°C' | '°F';

/** Converts a temperature reading to `to`; other readings pass through unchanged. */
export function convertTemp(r: Reading, to: TempUnit): Reading {
	const num = Number(r.value);
	// Number('') is 0, so rule out blank strings before trusting the parse.
	if ((r.unit !== '°C' && r.unit !== '°F') || r.unit === to || r.value === '' || !Number.isFinite(num)) {
		return r;
	}
	const value = to === '°F' ? (num * 9) / 5 + 32 : ((num - 32) * 5) / 9;
	return { ...r, value, unit: to };
}
