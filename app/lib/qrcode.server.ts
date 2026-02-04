import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL for an asset
 * The QR code contains a URL to the asset detail page
 */
export async function generateQRCode(assetId: string): Promise<string> {
  const baseUrl = process.env.APP_URL || "http://localhost:5173";
  const assetUrl = `${baseUrl}/dashboard/assets/${assetId}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(assetUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(assetId: string): Promise<string> {
  const baseUrl = process.env.APP_URL || "http://localhost:5173";
  const assetUrl = `${baseUrl}/dashboard/assets/${assetId}`;

  try {
    const svgString = await QRCode.toString(assetUrl, {
      type: "svg",
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    return svgString;
  } catch (error) {
    console.error("Failed to generate QR code SVG:", error);
    throw new Error("Failed to generate QR code");
  }
}
