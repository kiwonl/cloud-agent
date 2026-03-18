import os
import logging
import sys
from dotenv import load_dotenv

# Load env vars BEFORE importing sub-agents so they get the correct MODEL and API Keys
load_dotenv()

from .analyzer import analyzer as aws_analyzer
from .translator import translator as gcp_converter
from .generator import generator as tf_generator
from .checklist import checklist as checklist_agent

import google.cloud.logging
from google.adk.agents import Agent
from google.adk.models.google_llm import Gemini
from google.adk.tools import ToolContext, AgentTool, FunctionTool
from tools.callback_logging import log_query_to_model, log_model_response
from tools.tf_runner import run_terraform_with_self_healing

# 글로벌 과속 방지 턱 (Halt Trigger) 플래그
_translator_just_ran = False

def load_prompt(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_cloud = os.getenv("TARGET_CLOUD", "gcp").lower()
    
    # Target Cloud용 오버라이드 탐색 (예: azure_analyzer.txt)
    cloud_filename = f"{target_cloud}_{filename}" if target_cloud != "gcp" else filename
    prompt_path = os.path.join(current_dir, '..', 'prompts', cloud_filename)
    
    if not os.path.exists(prompt_path):
        # Fallback to default
        prompt_path = os.path.join(current_dir, '..', 'prompts', filename)
        
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()

# Setup Logging
try:
    if os.getenv("K_SERVICE"):
        google.cloud.logging.Client().setup_logging()
except Exception:
    pass

logger = logging.getLogger(__name__)
logging.basicConfig(
    format="[%(levelname)s]: %(message)s", 
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True
)

# ------------------------------------------------------------------------------
# 커스텀 콜백 도입: 번역가(gcp_converter) 폭주 여부 감시
# ------------------------------------------------------------------------------
def custom_log_model_response(callback_context, llm_response):
    global _translator_just_ran
    # 기존 로깅 가동
    log_model_response(callback_context, llm_response)
    
    if llm_response.content and llm_response.content.parts:
        for part in llm_response.content.parts:
            if part.function_call:
                tool_name = part.function_call.name
                # translator 도구가 연속 AFC로 구동되었을 때 플래그 작동
                if tool_name == "gcp_converter" or "translator" in tool_name:
                    _translator_just_ran = True

# ------------------------------------------------------------------------------
def custom_log_query_to_model(callback_context, llm_request):
    # 기존 로깅 가동
    log_query_to_model(callback_context, llm_request)
    
    # 🛡️ 백엔드 인입 메시지 실시간 디버그 로깅 (무조건 가동)
    import os
    try:
        user_msg_tmp = ""
        if llm_request.contents:
            last_msg = llm_request.contents[-1]
            if last_msg.parts and last_msg.parts[0].text:
                user_msg_tmp = last_msg.parts[0].text
                
        with open("orchestrator_debug_msg_exact.txt", "w", encoding="utf-8") as f_dbg:
            f_dbg.write(f"RECEIVED_ROLE: [{llm_request.contents[-1].role if llm_request.contents else 'N/A'}]\n")
            f_dbg.write(f"USER_MSG: [{user_msg_tmp}]\n")
            f_dbg.write(f"TOOLS_DICT: {hasattr(llm_request, 'tools_dict')}\n")
            if hasattr(llm_request, 'tools_dict'):
                f_dbg.write(f"TOOLS_DICT_VAL: {str(llm_request.tools_dict)}\n")
            f_dbg.write(f"FULL_CONTENTS: {str(llm_request.contents)}\n")
            f_dbg.flush()
            os.fsync(f_dbg.fileno())
    except Exception as e_dbg:
        logger.error(f"❌ 디버그 로깅 실패: {str(e_dbg)}")

    if llm_request.contents and str(llm_request.contents[-1].role).lower() == "user":
        user_msg = llm_request.contents[-1].parts[0].text or ""
        
        # 🛡️ [방탄 가드] 내부 백그라운드 스트림 마감 등의 빈 문자열 수신 시에는 무기고 변경을 건너뛰니다.
        if not user_msg.strip():
            return
            
        logger.info(f"🔍 [도구 무기고 제어] 유저 메시지 수신: '{user_msg}'")
        
        # 🛡️ [1턴 1도구 격리 룰] 폭주 방지를 위해 도구 무기고 사전을 강제 가상 동기화합니다.
        def sync_tools(tool):
            workflow_agent.tools = [tool]
            if hasattr(llm_request, 'tools_dict'):
                llm_request.tools_dict.clear()
                llm_request.tools_dict[tool.name] = tool

        # 1. 아키텍처 분석 승인 시 ➡ 2단계 '체크리스트' 도구 전용 주입
        if "APPROVE_ANALYSIS" in user_msg:
            logger.info("🛡️ [상태: 스텝 2 진입] 분석 승인 감지 ➡ 2단계 검증 도구(checklist_agent) 모드로 전환합니다.")
            sync_tools(AgentTool(checklist_agent))
            
        # 2. 체크리스트 승인 시 ➡ 3단계 '번역' 도구 전용 주입
        elif "APPROVE_CHECKLIST" in user_msg:
            logger.info("🛡️ [상태: 스텝 3 진입] 검증 승인 감지 ➡ 3단계 번역 도구(gcp_converter) 모드로 전환합니다.")
            sync_tools(AgentTool(gcp_converter))
            
        # 3. 매핑 승인 시 ➡ 4단계 '테라폼' 도구 주입
        elif "APPROVE_MAPPING" in user_msg:
            logger.info("🛡️ [상태: 스텝 4 진입] 매핑 승인 감지 ➡ 4단계 테라폼 도구(run_terraform_with_self_healing) 전용 모드로 전환합니다.")
            sync_tools(FunctionTool(run_terraform_with_self_healing))
            
        # 4. 초기 입력 및 기타 피드백 상황 ➡ 1단계 '분석' 도구만 주입 (폭주 원천 차단)
        else:
            logger.info("🛡️ [상태: 스텝 1 대기] 초기 진입/피드백 감지 ➡ 1단계 분석 도구(aws_analyzer) 전용 모드로 가동합니다.")
            sync_tools(AgentTool(aws_analyzer))

workflow_agent = Agent(
    name="mx_arb_workflow_agent",
    model=os.getenv("MODEL", "gemini-2.5-pro"),
    description="AWS to GCP Migration Orchestrator. Uses tools to step through the migration process with Human-in-the-Loop approvals.",
    instruction=load_prompt("orchestrator.txt"),
    tools=[AgentTool(aws_analyzer), AgentTool(checklist_agent), AgentTool(gcp_converter), FunctionTool(run_terraform_with_self_healing)],
    before_model_callback=custom_log_query_to_model,
    after_model_callback=custom_log_model_response,
)

root_agent = workflow_agent