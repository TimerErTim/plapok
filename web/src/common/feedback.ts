export function validateFeedback(feedback: string): string | null {
    const trimmedFeedback = feedback.trim()
    if (trimmedFeedback.length > 1000) {
        return "Feedback must be less than 1000 characters long"
    }
    return null
}