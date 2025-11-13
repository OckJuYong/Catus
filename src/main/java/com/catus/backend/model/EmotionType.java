package com.catus.backend.model;

/**
 * Emotion types detected from user messages.
 * Used to categorize user's emotional state in chat interactions.
 */
public enum EmotionType {
    /**
     * Positive, joyful emotions
     */
    HAPPY,

    /**
     * Sadness, disappointment, grief
     */
    SAD,

    /**
     * Anger, frustration, irritation
     */
    ANGRY,

    /**
     * Anxiety, worry, stress
     */
    ANXIOUS,

    /**
     * Neutral or undetected emotion
     */
    NORMAL
}
