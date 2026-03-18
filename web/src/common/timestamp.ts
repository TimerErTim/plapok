import { Timestamp } from "spacetimedb";

export function formatDateTime(timestamp: Timestamp): string {
    const date = new Date(timestamp.toDate());
    const formatter = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    return formatter.format(date);
}