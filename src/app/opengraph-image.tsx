import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0F0F11",
          color: "#EEEEEF",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.2em", color: "#6C6C74" }}>VERSEBILL</div>
        <div style={{ fontSize: 72, lineHeight: 1.05, fontWeight: 800, maxWidth: 900 }}>
          Invoices that prove payment on-chain
        </div>
        <div style={{ fontSize: 28, color: "#A0A0AB" }}>VERSE on Polygon PoS</div>
      </div>
    ),
    { ...size },
  );
}
