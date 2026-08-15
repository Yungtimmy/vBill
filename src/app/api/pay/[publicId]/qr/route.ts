import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { errorResponse, getRequestId } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { publicIdSchema } from "@/lib/validation";
import { getPublicInvoice } from "@/server/invoices";
import { trackEvent } from "@/server/analytics";

type Ctx = { params: Promise<{ publicId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const requestId = getRequestId(req.headers);
  try {
    await rateLimit({
      key: `qr:${clientIp(req.headers)}`,
      limit: 30,
      windowMs: 60_000,
    });
    const { publicId } = await ctx.params;
    publicIdSchema.parse(publicId);
    await getPublicInvoice(publicId);
    const appUrl = (process.env.APP_URL ?? req.nextUrl.origin).replace(/\/$/, "");
    const url = `${appUrl}/pay/${publicId}`;
    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F0F11", light: "#EEEEEF" },
    });
    await trackEvent("qr_generated", { invoicePublicId: publicId });
    return new Response(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=300",
        "x-request-id": requestId,
      },
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
