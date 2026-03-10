export type FlipReading = {
    id: string;
    device_id: string;
    ts: string;
    orientation: string;
};

export type DeviceMessage = {
    id: string;
    device_id: string;
    latitude: number | null;
    longitude: number | null;
    received_at: string;
    payload?: any;
};

export type Session = {
    start: string;       // timestamp
    end: string;         // timestamp
    orientation: string;
    duration: number;    // seconds
    isMoving: boolean;   // true if orientation changed from previous session
};

export type DayGroup = {
    date: string;
    activeDuration: number;
    idleDuration: number;
    totalDuration: number;
    sessions: Session[];
};

export type ShiftType = 'morning' | 'afternoon' | 'night';

export type ShiftData = {
    shift: ShiftType;
    utilization: number;
    activeDuration: number;
    totalDuration: number;
};
