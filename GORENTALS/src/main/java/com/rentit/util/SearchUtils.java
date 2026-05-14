package com.rentit.util;

/**
 * Utility for hardening search queries against wildcard injection.
 * Used by ListingService to sanitize user-supplied search terms
 * before they are passed as JPQL LIKE parameters.
 */
public class SearchUtils {

    /**
     * Escapes special SQL LIKE wildcard characters in a search term.
     * Replaces: \ → \\,  % → \%,  _ → \_
     */
    public static String escapeLikePattern(String term) {
        if (term == null) {
            return null;
        }
        return term.replace("\\", "\\\\")
                   .replace("%",  "\\%")
                   .replace("_",  "\\_");
    }

    /**
     * Wraps an escaped term in % wildcards for a 'contains' search.
     * Returns null (not "%null%") when the input is null or blank —
     * this ensures the JPQL `:city IS NULL` branch fires correctly.
     */
    public static String likeContents(String term) {
        if (term == null || term.isBlank()) {
            return null;
        }
        return "%" + escapeLikePattern(term) + "%";
    }
}
