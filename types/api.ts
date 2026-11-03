/**
 * API Type Definitions for CodexPetra GATE Portal
 */

export interface DatabaseHealth {
  connected: boolean;
  engine: string;
}

export interface HealthCheckResponse {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  database: DatabaseHealth;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

