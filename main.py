# main.py
# Command-line entry point for the finished pipeline.
# Asks a question, runs the full CRAG + self-correction graph, and prints the result
# Requires ingest.py to have already been run, so Qdrant has chunks to search.

from graph.graph import run   # the function that builds the initial state and runs the whole graph
from rag.chat_model import get_token_count
import time

def main():
    question = input("Question: ")
    # takes the question directly from the terminal

    print()
    # blank line before the per-call [model] tokens/duration lines start printing

    start = time.perf_counter()
    result = run(question)
    # runs the full graph: retrieve, grade, rewrite/retry, generate, validate/retry
    total_elapsed = time.perf_counter() - start

    print(f"\nAnswer:\n{result['answer']}")
    # the final answer the graph settled on

    print(f"\nRetrieved chunks and grades:")
    for doc, grade in zip(result["documents"], result["document_grades"]):
        print(f"  [{grade}] {doc['source']} p.{doc['page']}")
    # shows exactly which sources were considered and whether grading kept or dropped each one

    print(f"\nStatus: {result['status']}")
    # "resolved" if validation passed, "unresolved" if retries ran out first

    print(f"Retrieval retries used: {result['retrieval_retries']}")
    print(f"Validation retries used: {result['validation_retries']}")
    # useful for the video: shows the correction loops actually firing, not just the final answer

    print(f"Total tokens: {get_token_count()}")
    # sum of every chat model call's tokens for this question, including retries

    print(f"Total time: {total_elapsed:.1f}s")
    # wall-clock time for the whole question, including every retry and every model call


if __name__ == "__main__":
    main()
    # this file can be run directly: python main.py



