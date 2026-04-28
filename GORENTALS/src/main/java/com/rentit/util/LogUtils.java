package com.rentit.util;

public final class LogUtils {

    private LogUtils() {
        // Utility class
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        String[] parts = email.split("@");
        String local = parts[0];
        String domain = parts[1];
        String maskedLocal = local.length() <= 2 
            ? local.charAt(0) + "***" 
            : local.substring(0, 2) + "***";
        return maskedLocal + "@" + domain;
    }
}
