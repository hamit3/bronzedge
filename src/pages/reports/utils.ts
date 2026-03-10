import dayjs from "dayjs";
import { FlipReading, Session, DayGroup, ShiftType } from "./types";

/**
 * Format seconds to human readable string (e.g. 3723 → "1h 2m 3s")
 */
export const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let result = "";
    if (hrs > 0) result += `${hrs}h `;
    if (mins > 0) result += `${mins}m `;
    if (secs > 0 && hrs === 0) result += `${secs}s`;
    return result.trim();
};

/**
 * Derive activity sessions from flip_readings
 */
export const deriveSessions = (readings: FlipReading[]): Session[] => {
    if (readings.length === 0) return [];

    const sessions: Session[] = [];
    let currentSession: Partial<Session> = {
        start: readings[0].ts,
        orientation: readings[0].orientation,
    };

    for (let i = 1; i < readings.length; i++) {
        const reading = readings[i];
        const prevReading = readings[i - 1];

        if (reading.orientation !== prevReading.orientation) {
            // Orientation changed -> Session ends
            const end = reading.ts;
            const duration = dayjs(end).diff(dayjs(currentSession.start), "second");

            sessions.push({
                start: currentSession.start!,
                end: end,
                orientation: currentSession.orientation!,
                duration: duration,
                isMoving: sessions.length > 0 ? currentSession.orientation !== sessions[sessions.length - 1].orientation : false
            });

            // Start new session
            currentSession = {
                start: end,
                orientation: reading.orientation,
            };
        }
    }

    // Handle last session
    const lastReading = readings[readings.length - 1];
    const duration = dayjs(lastReading.ts).diff(dayjs(currentSession.start), "second");
    sessions.push({
        start: currentSession.start!,
        end: lastReading.ts,
        orientation: currentSession.orientation!,
        duration: duration,
        isMoving: sessions.length > 0 ? currentSession.orientation !== sessions[sessions.length - 1].orientation : false
    });

    // Re-calculate isMoving based on transitions
    // A session is considered "moving" if its orientation is different from the previous session's orientation
    // In the loop above, we set isMoving based on the transition that *started* the session.
    // Actually, the prompt says: "Mark session as isMoving: true if its orientation differs from the one before it"
    // Let's refine the logic to ensure first session's isMoving is handled or set to false.

    return sessions.map((s, idx) => {
        if (idx === 0) return { ...s, isMoving: false }; // First session is assumed idle unless we have data before
        return { ...s, isMoving: s.orientation !== sessions[idx - 1].orientation };
    });
};

/**
 * Group sessions by calendar day
 */
export const groupSessionsByDay = (sessions: Session[]): DayGroup[] => {
    const groups: Record<string, DayGroup> = {};

    sessions.forEach((session) => {
        const date = dayjs(session.start).format("YYYY-MM-DD");
        if (!groups[date]) {
            groups[date] = {
                date,
                activeDuration: 0,
                idleDuration: 0,
                totalDuration: 0,
                sessions: [],
            };
        }

        if (session.isMoving) {
            groups[date].activeDuration += session.duration;
        } else {
            groups[date].idleDuration += session.duration;
        }
        groups[date].totalDuration += session.duration;
        groups[date].sessions.push(session);
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Get shift for a given ts
 * Morning 06:00-14:00, Afternoon 14:00-22:00, Night 22:00-06:00
 */
export const getShift = (ts: string): ShiftType => {
    const hour = dayjs(ts).hour();
    if (hour >= 6 && hour < 14) return "morning";
    if (hour >= 14 && hour < 22) return "afternoon";
    return "night";
};

/**
 * Match location point to session (is it moving at this time?)
 */
export const isMovingAtTime = (timestamp: string, sessions: Session[]): boolean => {
    const time = dayjs(timestamp);
    const session = sessions.find(s => {
        const start = dayjs(s.start);
        const end = dayjs(s.end);
        return (time.isAfter(start) || time.isSame(start)) && (time.isBefore(end) || time.isSame(end));
    });
    return session?.isMoving ?? false;
};
