import os
import logging
import sys
from dotenv import load_dotenv

from .analyzer import analyzer as aws_analyzer
from .translator import translator as gcp_converter
from .generator import generator as tf_generator

from google.adk.agents import Agent
from google.adk.tools import AgentTool, FunctionTool
from tools.callback_logging import log_query_to_model, log_model_response
from tools.tf_runner import run_terraform_with_self_healing

load_dotenv()

# --- 로깅 설정 ---
logger = logging.getLogger(__name__)
logging.basicConfig(
    format="[%(levelname)s]: %(message)s",
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

# --- 워크플로우 신호 및 도구 매핑 (3단계) ---
SIGNALS = {
    "APPROVE_ANALYSIS": "gcp_converter",
    "APPROVE_MAPPING": "run_terraform_with_self_healing"
}

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

def sync_workflow_tools(llm_request, user_msg):
    """사용자 메시지에 따라 이번 턴에서 사용 가능한 도구를 결정합니다."""
    if not hasattr(llm_request, 'tools_dict'):
        return

    # 전체 도구 라이브러리 (체크리스트 완전 제거)
    tool_library = {
        "aws_analyzer": AgentTool(aws_analyzer),
        "gcp_converter": AgentTool(gcp_converter),
        "run_terraform_with_self_healing": FunctionTool(run_terraform_with_self_healing)
    }

    # 현재 단계 판별
    target_tool = "aws_analyzer" # 기본값 (Step 1)
    for signal, tool_name in SIGNALS.items():
        if signal in user_msg:
            target_tool = tool_name
            break

    # 도구 목록 갱신
    llm_request.tools_dict.clear()
    if target_tool in tool_library:
        tool_obj = tool_library[target_tool]
        llm_request.tools_dict[target_tool] = tool_obj
        # 별칭(alias) 대응
        if target_tool == "gcp_converter":
            llm_request.tools_dict["translator"] = tool_obj
        
        logger.info(f"🛡️ [워크플로우 제어] 현재 허용된 도구: '{target_tool}' (신호 기반)")
    else:
        logger.error(f"❌ 워크플로우 오류: 지원하지 않는 도구 '{target_tool}'")

def before_model_handler(callback_context, llm_request):
    log_query_to_model(callback_context, llm_request)
    
    user_msg = ""
    if llm_request.contents:
        for content in reversed(llm_request.contents):
            if str(content.role).lower() == "user" and content.parts and content.parts[0].text:
                user_msg = content.parts[0].text
                break
    
    if user_msg:
        sync_workflow_tools(llm_request, user_msg)

def after_model_handler(callback_context, llm_response):
    log_model_response(callback_context, llm_response)

# --- 오케스트레이터 에이전트 ---
workflow_agent = Agent(
    name="mx_arb_workflow_agent",
    model=os.getenv("MODEL", "gemini-2.5-pro"),
    description="AWS to GCP Migration Orchestrator with strictly sequential workflow.",
    instruction=load_prompt("orchestrator.txt"),
    tools=[
        AgentTool(aws_analyzer), 
        AgentTool(gcp_converter), 
        FunctionTool(run_terraform_with_self_healing)
    ],
    before_model_callback=before_model_handler,
    after_model_callback=after_model_handler,
)

root_agent = workflow_agent