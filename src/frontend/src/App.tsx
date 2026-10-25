import { useEffect, useState } from "react";
import createClient from "openapi-fetch";
import type { paths } from "./api/schema";

const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000",
});

export default function App() {
  const [health, setHealth] = useState<{ status: string; service: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .GET("/health")
      .then(({ data, error: apiError }) => {
        if (data) {
          setHealth(data);
        } else if (apiError) {
          setError(String(apiError));
        }
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "API unavailable");
      });
  }, []);

  return (
    <main>
      <h1>BeautyAI Platform</h1>
      {health && <p>API status: {health.status} ({health.service})</p>}
      {error && <p role="alert">API error: {error}</p>}
      {!health && !error && <p>Checking API…</p>}
    </main>
  );
}
