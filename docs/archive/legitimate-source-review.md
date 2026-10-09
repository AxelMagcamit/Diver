# Follow-up legitimate URL source review

Reviewed 8 October 2026. Documentation review only; no new dataset downloaded.
The existing rules, popup and PhiUSIIL holdout are unchanged.

## Decision

Recommend a small, pinned-revision, URL-only sample from PhreshPhish's training
partition as the next exploratory development audit. Its documented collection
is closer to browsing activity than the exclusively www HTTPS homepages in our
current legitimate set. This is a candidate, not a validated representative
benchmark. Keep its measurements separate from PhiUSIIL.

## PhreshPhish: preferred next candidate, with a query limitation

The authors describe benign sources as anonymized Webroot browsing telemetry
and Google results. Their cleaning includes automated grouping and manual
inspection. They also describe removing query parameters in benign PII handling.
That limits tests of long legitimate queries and may introduce class-specific
URL differences. The original paper's collection period and counts must not be
silently applied to a newer release. [Authors' paper, sections 3 and C.2](https://arxiv.org/html/2507.10854v1)

The official repository lists raw URL, label, date and HTML fields, train/test
partitions, CC BY 4.0 and an anti-phishing-research use statement. It records a
2026 update. Its displayed test total and class subtotals do not reconcile:
91,260 + 76,876 = 168,136 rather than 168,060. Verify actual files instead of
copying those counts. [Official dataset card](https://huggingface.co/datasets/phreshphish/phreshphish)

For Diver, inspect only train metadata/URL columns first. Avoid downloading HTML
when URL-column extraction is possible. Preserve collection date semantics and
source labels; never assert each URL has been independently verified by us.

## ISCX-URL2016: useful historical fallback

UNB describes over 35,300 benign URLs gathered by crawling Alexa domains,
removing duplicates and domain-only entries, then filtering through VirusTotal.
That addresses the homepage-only issue but is old and still selected by domain
popularity. VirusTotal filtering does not prove every URL harmless.
Keep phishing, malware, spam and defacement categories distinct rather than
mapping all malicious categories to phishing. [Official description](https://www.unb.ca/cic/datasets/url-2016.html)

The linked download page currently displays a personal-information form and a
server-error message. No information was submitted. Download access and applicable
reuse terms still need resolution before importing this source.
[Official download page](https://cicresearch.ca/CICDataset/ISCX-URL-2016/)

## LegitPhish: lower priority pending label clarification

The paper describes full URLs from sources including Google, Wikipedia and
Stack Overflow, with manual review or feed matching. Its labeling pseudocode
also uses source membership, and its stated class counts total 101,218 while
the stated total is 101,219. These are reasons to inspect the release and label
methodology, not proof the dataset is unusable. Search visibility or a reputable
hosting domain alone cannot establish a page's legitimacy.
[Authors' paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC12538017/)

## Concrete next import plan

1. Pin the official PhreshPhish revision and inspect train-file schema, sizes,
   date definitions and practical URL-only extraction before downloading.
2. Select a reproducible training-partition subset independently of Diver scores;
   save selection settings, source hashes, labels and attribution. Keep all test
   partitions reserved. Do not infer missing query strings or restore them.
3. Audit protocols, paths, queries, fragments, lengths, labels and domain
   concentration before evaluating. Report source-specific exclusions and
   duplicate/domain overlap; do not mix records with existing holdout data.
4. Run the unchanged shared engine and report false-alert counts/rates on benign
   records. A benign-only sample cannot estimate recall or precision.
5. Keep synthetic long-query challenges as behavior checks. They do not repair
   the missing real-world query coverage or establish accuracy.

No automatic rule or threshold change follows from this review.
