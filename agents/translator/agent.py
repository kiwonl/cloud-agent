import os
import sys
from google.adk import Agent

# tools 모듈을 찾기 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

root_agent = Agent(
    name="translator",
    model=os.getenv("MODEL", "gemini-2.5-pro"),
    description="Translates an AWS infrastructure analysis report into an optimized GCP architecture mapping.",
    instruction=load_prompt("translator.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response
)
