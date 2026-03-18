import os
from google.adk import Agent
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

generator = Agent(
    name='generator',
    model=os.getenv('MODEL', 'gemini-2.5-pro'),
    description='Generates Terraform code for a proposed Google Cloud Platform (GCP) Architecture and validates it.',
    instruction=load_prompt("generator.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response
)
