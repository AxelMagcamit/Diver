# Diver documentation

The current extension version is 0.6.1. Code and controlled browser checks have passed. VM testing and Chrome Web Store publication remain pending.

## Current work

1. Follow the [VM test plan](testing/vm-test-plan.md).
2. Record verified observations in the [VM results report](testing/vm-test-results.md).
3. Fix issues found during testing and record the affected version and retest.
4. Review the [publication checklist](release/public-release.md) before submission.

Do not fill in results until a test has actually run. A functioning popup, a source-list match, and broad real-world phishing coverage are different claims.

## Completed feature evidence

| Checkpoint | Version | Purpose |
| --- | --- | --- |
| [General phishing list](checkpoints/two-source-checkpoint.md) | 0.5.0 | Added a second publisher and checked source failures |
| [Individual page reports](checkpoints/page-reputation-checkpoint.md) | 0.6.0 | Added supported page patterns without widening them into whole-host reports |
| [Warnings after address changes](checkpoints/navigation-warning-checkpoint.md) | 0.6.1 | Fixed warning suppression when the URL changes without reloading |

These checkpoints preserve the versions, source files, and tests used at the time. Their historical results should not be presented as measurements of a newer version.

## Adding future documentation

- Put VM test observations and conclusions in `testing/`. Use dated reports for additional batches, and link them from the results report.
- Put a verified feature or fix checkpoint in `checkpoints/`. Include the version, problem, change, checks performed, and remaining limits.
- Keep Store preparation and release decisions in `release/`.
- Use `archive/` for superseded plans and older research. Preserve recorded counts and source hashes.
- Update this index and the main README when the current status changes.

Run `npm run check:docs` after editing links or moving documents. Keep raw evidence and sensitive addresses under the ignored `docs/testing/local/` directory. Public reports should use test IDs and redacted evidence.

## Reference

- [Privacy policy](../PRIVACY.md)
- [Dataset guidance](../datasets/README.md)
- [Earlier research index](archive/README.md)

The public repository documents the product and its evidence. Personal preparation notes remain local and are excluded from version control.
