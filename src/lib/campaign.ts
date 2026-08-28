/**
 * The Herd Card claim window.
 *
 * One flag, imported by both the page and the submit route, so the two can
 * never disagree. They did: the page led with "the campaign has ended" and
 * then, further down, told visitors they needed a wallet extension "to
 * participate in this campaign" and offered a submit button that posted to a
 * live endpoint.
 */
export const CAMPAIGN_CLOSED = true;

/** When submissions stopped, for the copy that says so. */
export const CAMPAIGN_CLOSED_ON = '17 August 2026';
