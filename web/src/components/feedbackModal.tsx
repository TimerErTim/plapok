import { Button, Description, FieldError, Modal, Spinner, TextArea, TextField, Tooltip } from "@heroui/react";
import { useReducer } from "spacetimedb/react";
import { reducers } from "@/spacetimedb_bindings";
import { FaWrench } from "react-icons/fa";
import { useState } from "react";
import { validateFeedback } from "@/common/feedback";

export default function FeedbackModal() {
    const submitFeedback = useReducer(reducers.submitFeedback)
    const [feedback, setFeedback] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)


    function handleSubmitFeedback({ callback }: { callback?: () => void }) {
        if (validateFeedback(feedback) !== null) {
            setError(validateFeedback(feedback))
            return
        }

        setIsSubmitting(true)
        submitFeedback({ feedback })
            .then(() => {
                callback?.()
                setFeedback("")
                setError(null)
            })
            .catch((error) => {
                setError(String(error.message))
                console.error(error)
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }

    function handleFeedbackChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
        setFeedback(e.target.value)
        setError(validateFeedback(e.target.value))
    }

    return (
        <Modal>
            <Button variant="outline">
                Feedback
            </Button>
            <Modal.Backdrop variant="transparent">
                <Modal.Container>
                    <Modal.Dialog>
                        {(renderProps) => <>
                            <Modal.CloseTrigger /> {/* Optional: Close button */}
                            <Modal.Header>
                                <Modal.Heading>
                                    Feedback
                                </Modal.Heading>
                                <p>Share your feedback with me, so I can improve the app.</p>
                            </Modal.Header>
                            <Modal.Body>
                                <TextField isInvalid={error != null} type="text" validationBehavior="aria">
                                    <TextArea aria-describedby="textarea-controlled-description" id="feedback-textarea" variant="secondary" fullWidth className="text-sm" value={feedback} onChange={handleFeedbackChange} placeholder="Write your feedback..." />
                                    <Description id="textarea-controlled-description">
                                        Characters: {feedback.trim().length} / 1000
                                    </Description>
                                    <FieldError>{error}</FieldError>
                                </TextField>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="primary" onPress={() => handleSubmitFeedback({ callback: renderProps.close })} isPending={isSubmitting}>
                                    {({ isPending }) => (
                                        <>
                                            {isPending && <Spinner color="current" size="sm" />}
                                            Submit
                                        </>
                                    )}
                                </Button>
                            </Modal.Footer>
                        </>}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}