import { QRCodeSVG } from 'qrcode.react';

/**
 * QR kodujący sam token (`pqr_…` / `zqr_…`) jako czysty tekst — spec 11: bez URL-a
 * i bez danych osobowych. `data-qr-value` pozwala testom sprawdzić zakodowaną treść.
 */
export const TicketQr = ({ value, size = 120 }: { value: string; size?: number }) => (
  <QRCodeSVG value={value} size={size} level="M" includeMargin={false} data-qr-value={value} />
);
