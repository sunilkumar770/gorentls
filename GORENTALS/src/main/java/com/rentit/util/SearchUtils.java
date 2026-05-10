package com.rentit.util;

/**
 * Utility for hardening search queries against wildcard manipulation.
 */
public class SearchUtils {

    /**
     * Escapes special characters for SQL LIKE patterns.
     * Replaces % with \% and _ with \_
     */
    public static String escapeLikePattern(String term) {
        if (term == null) {
            return null;
        }
        return term.replace("\\", "\\\\")
                   .replace("%", "\\%")
                   .replace("_", "\\_");
    }

    /**
     * Wraps a term in % wildcards for a 'contains' search, after escaping.
     */
    public static String likeContents(String term) {
        if (term == null || term.isBlank()) {
            return null;
        }
        return "%" + escapeLikePattern(term) + "%";
    }
}
