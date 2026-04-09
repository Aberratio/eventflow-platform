/**
 * Branded ID types for compile-time safety.
 *
 * Usage:
 *   const eventId: EventId = 'e1' as EventId;
 *   // Prevents accidentally passing a UserId where EventId is expected.
 *
 * When connecting a real backend, IDs will come pre-typed from API responses.
 * Cast raw strings with `as EventId` only at system boundaries (URL params, mock data).
 */

declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type EventId = Brand<string, 'EventId'>;
export type UserId = Brand<string, 'UserId'>;
export type DistanceId = Brand<string, 'DistanceId'>;
export type RegistrationId = Brand<string, 'RegistrationId'>;
export type ResultId = Brand<string, 'ResultId'>;
export type SeriesId = Brand<string, 'SeriesId'>;
export type ChallengeId = Brand<string, 'ChallengeId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type OrderId = Brand<string, 'OrderId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type TicketId = Brand<string, 'TicketId'>;
export type PartnerId = Brand<string, 'PartnerId'>;
export type TemplateId = Brand<string, 'TemplateId'>;
export type InfoPageId = Brand<string, 'InfoPageId'>;
export type DocumentId = Brand<string, 'DocumentId'>;

/**
 * ISO 8601 date-time string (e.g. "2026-03-15T09:00:00Z").
 * Use for all timestamp fields.
 */
export type ISODateString = Brand<string, 'ISODateString'>;
