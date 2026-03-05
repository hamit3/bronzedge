/**
 * Formats a given number as a temperature string with Celsius unit.
 */
export const formatTemperature = (value: number): string => {
    return `${value.toFixed(1)}°C`;
};

/**
 * Formats a given number as a percentage string.
 */
export const formatPercentage = (value: number): string => {
    return `${value.toFixed(0)}%`;
};

/**
 * Generates a random sensor value within a range (useful for demos).
 */
export const getRandomSensorValue = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};
