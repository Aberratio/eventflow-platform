import { QRCodeSVG } from 'qrcode.react';

/**
 * QR encoding only the token (`pqr_…` / `zqr_…`) as plain text — no URL
 * and no personal data. `data-qr-value` lets tests check the encoded content.
 */
export const TicketQr = ({ value, size = 120 }: { value: string; size?: number }) => (
  <QRCodeSVG value={value} size={size} level="M" includeMargin={false} data-qr-value={value} />
);
