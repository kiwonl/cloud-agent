import os
from google.adk import Agent
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

# 1st Agent: Analyzer
analyzer = Agent(
    name="aws_analyzer",
    model=os.getenv("MODEL", "gemini-2.5-pro"),
    description="Analyzes AWS Infrastructure Architecture images or text, rigorously validates the extracted components, and outputs a detailed list of AWS resources.",
    instruction=load_prompt("analyzer.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
)
