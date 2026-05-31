import { useEffect, useState } from "react";

export default function TestPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/notifications/track")
      .then(res => res.json())
      .then(setData)
      .catch(setError);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>API Test Page</h1>
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
