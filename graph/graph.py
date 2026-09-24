# graph.py
# Wires the five nodes from node.py into an actual LangGraph graph:
# the order they run in, and the decisions that route between them.

from langgraph.graph import StateGraph, END   # StateGraph builds the graph; END is the special "stop here" node
from graph.state import GraphState         # the shared state shape the whole graph runs on

from graph.node import (retrieve,
    grade_documents,
    rewrite_query,
    generate,
    validate_answer,
    mark_resolved,
    mark_unresolved,
)
from rag.chat_model import reset_token_count
# every node the graph will use

def decide_after_grading(state: GraphState) -> str:
    # runs right after grade_documents: was retrieval good enough to answer from?
    grades = state["document_grades"]
    relevant_count = sum(1 for g in grades if g == "relevant")
    # counts how many of the retrieved chunks were marked relevant

    enough_relevant = relevant_count >= max(1, len(grades) // 2)
    # simple bar: at least half the retrieved chunks must be relevant

    if enough_relevant:
        return "generate"
        # retrieval is good enough, move on to writing the answer

    if state["retrieval_retries"] < state["max_retrieval_retries"]:
        return "rewrite_query"
        # retrieval was weak and we still have retries left, try a better query
    
    return "generate"
    # retries are used up; proceed anyway with whatever was retrieved, imperfect as it is


def decide_after_validation(state: GraphState) -> str:
    # runs right after validate_answer: does the answer pass, or does it need another cycle?
    if state["validation"]["verdict"] == "pass":
        return "end_resolved"
        # answer is grounded, complete, and low hallucination risk — done

    if state["validation_retries"] >= state["max_validation_retries"]:
        return "end_unresolved"
        # answer still failing, but retries are used up — stop and report as unresolved

    wants_rewrite = state["validation"]["retrieval_insufficient"]
    retries_available = state["retrieval_retries"] < state["max_retrieval_retries"]
    # both must hold: the judge blames retrieval, AND the retrieval cap isn't already used up

    if wants_rewrite and retries_available:
        return "rewrite_query"
        # the judge thinks the context itself was the problem, and there's still room to retry it

    return "generate"
    # context looked fine to the judge; the generation itself was the problem, so try writing again


# This is where nodes and edges from above actually gets assembled into a runnable graph StateGraph
def build_graph():
    # assembles all the nodes and edges into one runnable LangGraph graph
    builder = StateGraph(GraphState)

    builder.add_node("retrieve", retrieve)
    builder.add_node("grade_documents", grade_documents)
    builder.add_node("rewrite_query", rewrite_query)
    builder.add_node("generate", generate)
    builder.add_node("validate_answer", validate_answer)
    builder.add_node("mark_resolved", mark_resolved)
    builder.add_node("mark_unresolved", mark_unresolved)
    # registers every node by name, so edges below can refer to them by string

    builder.set_entry_point("retrieve")  # every run starts here
       
    builder.add_edge("retrieve", "grade_documents")   # always grade whatever was just retrieved

    builder.add_conditional_edges(
        "grade_documents",
        decide_after_grading,
        {"generate": "generate", "rewrite_query": "rewrite_query"},
    )
    # after grading, decide_after_grading's return value picks which of these two to go to

    builder.add_edge("rewrite_query", "retrieve")  # after a rewrite, always retrieve again with the new wording
    builder.add_edge("generate", "validate_answer")   # always validate whatever answer was just generated

    builder.add_conditional_edges(
        "validate_answer",
        decide_after_validation,
        {
            "end_resolved": "mark_resolved",
            "end_unresolved": "mark_unresolved",
            "rewrite_query": "rewrite_query",
            "generate": "generate",
        },
    )
    # After validation, decide_after_validation's return value picks which of these four to go to

    builder.add_edge("mark_resolved", END)
    builder.add_edge("mark_unresolved", END)
    # both terminal nodes end the run once they've recorded the final status

    return builder.compile()
    # compile() turns the builder into an actual runnable graph object

graph = build_graph()  # built once when this module is imported, reused for every question

# This function actually start the graph run. It builds the initial state (every field GraphState needs) 
# and hands it to the compiled graph.

def build_initial_state(question: str, max_retrieval_retries: int = 2, max_validation_retries: int = 2) -> GraphState:
    # shared by run() and any caller that streams the graph instead of invoking it directly
    return {
        "question": question,
        "original_question": question,
        # both start identical; question may get overwritten later by rewrite_query

        "documents": [],
        "document_grades": [],
        "answer": "",
        "validation": {},
        # empty placeholders, filled in as the graph runs

        "retrieval_retries": 0,
        "validation_retries": 0,
        # both counters must start at 0, or the retry limits in decide_after_* would be wrong

        "max_retrieval_retries": max_retrieval_retries,
        "max_validation_retries": max_validation_retries,
        # caller can tune these per call; default to 2 retries each if not specified

        "status": "",
        # set later by mark_resolved or mark_unresolved
    }


def run(question: str, max_retrieval_retries: int = 2, max_validation_retries: int = 2) -> GraphState:
    # entry point: builds the starting state and runs the whole graph on one question
    reset_token_count()
    # zeroes the running token counter, so it only reflects this question's calls

    initial_state = build_initial_state(question, max_retrieval_retries, max_validation_retries)

    return graph.invoke(initial_state)
    # runs the graph start to finish and returns the final state


    