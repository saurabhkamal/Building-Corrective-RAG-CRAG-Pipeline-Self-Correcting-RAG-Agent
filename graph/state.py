from typing import TypedDict

class GraphState(TypedDict):
    # the question currently used for retrieval; gets overwritten on rewrite
    question: str
    # the user's original question, kept unchanged for the final answer so the intent is not lost
    original_question: str

    # retrieved chunks for the current question, each as {"text": ..., "source": ...}
    documents: list[dict]
    # per-document grade for the current retrieval: "relevant" or "irrelevant"
    document_grades: list[str]

    # generated answer for the current attempt
    answer: str
    # validation result for the current answer
    validation: dict # {"grounded": bool, "hallucination_risk": str, "complete": bool, "verdict": str}

    # bounded counters, checked in the conditional edges
    retrieval_retries: int
    validation_retries: int
    max_retrieval_retries: int
    max_validation_retries: int

    # final status set at the END edges: "resolved" or "unresolved"
    status: str
