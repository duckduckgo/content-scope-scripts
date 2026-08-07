/**
 * Matches everything, so on a page with no payload it reports a false positive the
 * baseline does not.
 *
 * That is a divergence introduced by the variant, which must fail the run - the guarantee
 * the introduced-versus-pre-existing change had to preserve while it stopped blaming
 * experiments for the baseline's own gaps.
 */
export function evaluateMatch() {
    return true;
}
