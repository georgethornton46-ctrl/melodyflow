"use client";
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#060606", color: "#F4F5EF", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 22, fontWeight: 600 }}>Something went off-key.</p>
          <button onClick={reset} style={{ marginTop: 16, height: 44, padding: "0 20px", borderRadius: 999, background: "#C8FF3D", border: 0, fontWeight: 600 }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
