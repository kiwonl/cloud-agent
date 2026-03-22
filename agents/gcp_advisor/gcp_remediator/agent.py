import os
import sys
from google.adk import Agent

# tools 모듈을 찾기 위한 경로 추가 (공용 로깅)
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from tools.callback_logging import log_query_to_model, log_model_response

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

root_agent = Agent(
    name="gcp_remediator",
    model=os.getenv("MODEL", "gemini-3.1-pro"),
    description="Acts as a Cloud Architect to provide best practices and generate Terraform/gcloud remediation code for failed infrastructure checklist items.",
    instruction=load_prompt("gcp_remediator.txt"),
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[] # Pure reasoning and code generation agent
)
