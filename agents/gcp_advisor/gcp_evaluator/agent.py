import os
import sys
from google.adk import Agent

# tools 모듈을 찾기 위한 경로 추가 (공용 로깅)
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from tools.callback_logging import log_query_to_model, log_model_response
from gcp_advisor.gcp_analyzer.gcp_discovery import get_specific_gcp_resource

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

root_agent = Agent(
    name="gcp_evaluator",
    model=os.getenv("MODEL", "gemini-3.1-pro-preview"),
    description="Evaluates single checklist items against the infrastructure report. It uses strict rubrics and can invoke discovery tools if data is missing.",
    instruction=load_prompt("gcp_evaluator.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[get_specific_gcp_resource]
)
