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
          background: "#F6F5F2",
          color: "#161616",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, color: "#0C7A4D" }}>VERSEBILL</div>
        <div style={{ fontSize: 68, lineHeight: 1.05, fontWeight: 500, maxWidth: 900 }}>
          Invoices that prove payment on-chain
        </div>
        <div style={{ fontSize: 28, color: "#6B6B6B" }}>VERSE on Polygon</div>
      </div>
    ),
    { ...size },
  );
}
