import { useEffect, useMemo, useState } from "react";
import { Platform, SafeAreaView, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Configuration, HealthApi, type HealthResponse } from "@syntheprise/api-client";

function defaultApiUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080";
  }
  return "http://localhost:8080";
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const api = useMemo(
    () => new HealthApi(new Configuration({
      basePath: process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiUrl(),
    })),
    [],
  );

  useEffect(() => {
    api.getHealth().then(setHealth).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "API unavailable");
    });
  }, [api]);

  return (
    <SafeAreaView>
      <Text>Syntheprise Stack Pilot</Text>
      {health && <Text>API status: {health.status} ({health.service})</Text>}
      {error && <Text>API error: {error}</Text>}
      {!health && !error && <Text>Checking API…</Text>}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}
