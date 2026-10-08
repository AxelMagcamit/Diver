import { getSiteIdentity } from "../../extension/engine/site-identity.js";

// Deliberately limited reference domains.
// These are not a complete list of legitimate brand-related websites.
const references = [
  {
    brand: "GitHub",
    titlePattern: /\bgithub\b/i,
    siteDomains: ["github.com"]
  },
  {
    brand: "GitLab",
    titlePattern: /\bgitlab\b/i,
    siteDomains: ["gitlab.com"]
  }
];

export function analyzeBrandTitle({
  pageUrl,
  pageTitle,
  passwordFormCount
}) {
  if (typeof pageTitle !== "string") {
    throw new TypeError("pageTitle must be a string.");
  }

  if (
    !Number.isInteger(passwordFormCount) ||
    passwordFormCount < 0
  ) {
    throw new TypeError(
      "passwordFormCount must be a non-negative integer."
    );
  }

  const identity = getSiteIdentity(pageUrl);

  if (!identity) {
    return {
      status: "not-inspected",
      reason: "Unsupported or invalid page URL.",
      site: null,
      mentions: [],
      candidates: []
    };
  }

  if (passwordFormCount === 0) {
    return {
      status: "not-inspected",
      reason: "No associated password forms supplied.",
      site: identity.value,
      mentions: [],
      candidates: []
    };
  }

  const mentions = references.filter(reference =>
    reference.titlePattern.test(pageTitle)
  );

  const candidates = mentions
    .filter(reference =>
      !reference.siteDomains.includes(identity.value)
    )
    .map(reference => ({
      id: "CANDIDATE-BRAND-TITLE",
      brand: reference.brand,
      site: identity.value,
      explanation:
        `The title mentions ${reference.brand}, but the site domain ` +
        `is ${identity.value}. This differs from the experiment's ` +
        "limited reference domains. Integrations and self-hosted " +
        "services can also produce this result."
    }));

  return {
    status: "inspected",
    reason: null,
    site: identity.value,
    mentions: mentions.map(reference => reference.brand),
    candidates
  };
}