import os
from google.adk import Agent
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

# 2nd Agent: translator
translator = Agent(
    name="translator",
    model=os.getenv("MODEL", "gemini-2.5-pro"),
    description="Converts analyzed AWS Infrastructure into Google Cloud Platform (GCP) Infrastructure.",
    instruction=load_prompt("translator.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
)
