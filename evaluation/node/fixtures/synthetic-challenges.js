// Invented scenarios on reserved example domains. These are not ground-truth labels.
const longQuery = `https://example.com/search?q=${'a'.repeat(160)}`;
export const challenges = [
  {
    id: 'ordinary-path', scenario: 'Invented ordinary account page',
    url: 'https://example.com/account?view=profile', score: 0, findings: [],
    lesson: 'Paths and query strings alone do not trigger the existing rules.'
  },
  {
    id: 'same-url-harmful-content', scenario: 'Same URL, imagined credential-stealing page content',
    url: 'https://example.com/account?view=profile', score: 0, findings: [],
    lesson: 'The engine sees only the URL; changing imagined page content cannot change its score.'
  },
  {
    id: 'ordinary-http', scenario: 'Invented harmless page served over HTTP',
    url: 'http://example.com/news', score: 10, findings: ['URL-001'],
    lesson: 'HTTP adds points even in a harmless scenario; it is not proof of phishing.'
  },
  {
    id: 'ordinary-long-query', scenario: 'Invented ordinary search with a long query',
    url: longQuery, score: 10, findings: ['URL-005'],
    lesson: 'A long query can be ordinary application data and still trigger the length rule.'
  },
  {
    id: 'ordinary-internationalized', scenario: 'Invented ordinary internationalized hostname',
    url: 'https://bücher.example/', score: 20, findings: ['URL-003'],
    lesson: 'Internationalized names are converted to Punycode; that alone does not establish deception.'
  },
  {
    id: 'ordinary-combined-signals', scenario: 'Invented harmless HTTP page with an internationalized hostname',
    url: 'http://bücher.example/', score: 30, findings: ['URL-001', 'URL-003'],
    lesson: 'Two non-conclusive signals can reach the baseline alert threshold of 30.'
  },
  {
    id: 'short-hosted-page', scenario: 'Imagined phishing page on a short HTTPS hosting URL',
    url: 'https://tenant.example.com/login', score: 0, findings: [],
    lesson: 'The current rules cannot identify the imagined harmful page from this URL.'
  },
  {
    id: 'short-redirect', scenario: 'Imagined redirect hiding a harmful destination',
    url: 'https://example.org/r/abc', score: 0, findings: [],
    lesson: 'The engine does not follow redirects and cannot inspect the imagined destination.'
  },
  {
    id: 'short-fragment', scenario: 'Invented ordinary document section link',
    url: 'https://example.com/guide#intro', score: 0, findings: [],
    lesson: 'A short fragment does not trigger the current rules.'
  },
  {
    id: 'long-fragment', scenario: 'Same document with a long client-side fragment',
    url: `https://example.com/guide#${'a'.repeat(160)}`, score: 10, findings: ['URL-005'],
    lesson: 'The length rule includes the fragment; adding client-side state can change the score.'
  }
];
