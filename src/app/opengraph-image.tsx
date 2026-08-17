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
          background: "linear-gradient(180deg, #F4F0FF 0%, #FAF9FF 55%, #FFFFFF 100%)",
          color: "#17151F",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, color: "#6D35F2" }}>VerseBill</div>
        <div style={{ fontSize: 64, lineHeight: 1.08, fontWeight: 700, maxWidth: 920 }}>
          Get paid in VERSE. Verify it on-chain.
        </div>
        <div style={{ fontSize: 26, color: "#747180" }}>VERSE on Polygon</div>
      </div>
    ),
    { ...size },
  );
}
