import os
from google.adk import Agent
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

checklist = Agent(
    name='checklist',
    model=os.getenv('MODEL', 'gemini-2.5-pro'),
    description='Analyzes extracted architecture design and rigorously validates it against the fixed Infrastructure Quality checklist items.',
    instruction=load_prompt("checklist.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response
)
