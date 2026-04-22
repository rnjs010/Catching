package com.dongledungle.catching.analysis.exception;

public class RateLimitExceededException extends RuntimeException {
    private final Long remainingTime;

    public RateLimitExceededException(String message, Long remainingTime) {
        super(message);
        this.remainingTime = remainingTime;
    }

    public Long getRemainingTime() {
        return remainingTime;
    }
}
