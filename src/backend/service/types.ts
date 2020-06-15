export interface TimeRange {
    startTime: Date;
    endTime: Date;
}

export interface GeographicCoordinate {
    latitude: number;
    longitude: number;
}

export interface SpacetimeRange {
    location: GeographicCoordinate;
    timeRange: TimeRange;
}

export interface Observation {
    temperature: number;
    observation_time: Date;
}
