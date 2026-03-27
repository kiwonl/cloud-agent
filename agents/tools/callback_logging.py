
import logging
import google.cloud.logging

from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse, LlmRequest


# Callback to log the user query sent to the model.
def log_query_to_model(callback_context: CallbackContext, llm_request: LlmRequest):
    """
    Logs the user query sent to the model.

    Args:
        callback_context (CallbackContext): The callback context information.
        llm_request (LlmRequest): The request object sent to the model.
    """
    if llm_request.contents and llm_request.contents[-1].role == "user":
        if llm_request.contents[-1].parts[-1].text:
            last_user_message = llm_request.contents[-1].parts[0].text
            # [BEFORE] 한 줄 요약: 모델에게 질문을 던지는 시점
            logging.info(f"▶▶▶ [BEFORE] Agent: {callback_context.agent_name} | Query: {last_user_message}...")


# Callback to log the model's response.
def log_model_response(callback_context: CallbackContext, llm_response: LlmResponse):
    """
    Logs the response from the model.

    Args:
        callback_context (CallbackContext): The callback context information.
        llm_response (LlmResponse): The response object from the model.
    """
    if llm_response.content and llm_response.content.parts:
        for part in llm_response.content.parts:
            if part.text:
                # [AFTER] 한 줄 요약: 모델이 인간 말을 생성한 시점
                logging.info(f"◀◀◀ [AFTER] Agent: {callback_context.agent_name} | Response: {part.text}...")
            elif part.function_call:
                # [TOOL] 한 줄 요약: 모델이 툴 실행을 지시한 시점
                logging.info(f"🔧 [TOOL_CALL] Agent: {callback_context.agent_name} | Tool: {part.function_call.name} | Args: {part.function_call.args}")
