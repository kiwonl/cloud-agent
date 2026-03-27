import os
import sys

# ✅ 물리 런타임 현 제자리(부모 경로)를 sys.path 에 자동 가동하여 임포트 낙하를 영구 봉인합니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.parallel_agent import ParallelAgent
from google.adk.agents.sequential_agent import SequentialAgent

# 로컬 상위 패키지 기준 임포트 (웹 서버 기동 시 안전)
from gcp_analyzer.compute_agent import compute_agent
from gcp_analyzer.network_agent import network_agent
from gcp_analyzer.security_agent import security_agent
from gcp_analyzer.database_agent import database_agent

GEMINI_MODEL = os.getenv("MODEL", "gemini-3.1-pro-preview")

from gcp_advisor.gcp_analyzer.gcp_discovery import scan_gcp_infrastructure
from tools.callback_logging import log_query_to_model, log_model_response

# --- 1. Create Infra Global Scanner (Phase 1) ---
scanner_agent = LlmAgent(
    name="GcpInfraScanner",
    model=GEMINI_MODEL,
    description="Scans the entire GCP system topology and passes the metadata to subsequent analyzers.",
    instruction="""
    You are the Global Infrastructure Data Collector. Call the `scan_gcp_infrastructure` tool to read all inventory data.
    Output only the raw structural/factual JSON data without any interpretation.
    """,
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[scan_gcp_infrastructure]
)

# --- 2. Create Domain Analyzers (Phase 2, Concurrency) ---
parallel_scan_agent = ParallelAgent(
    name="ParallelGcpAnalyzer",
    sub_agents=[compute_agent, network_agent, security_agent, database_agent],
    description="Runs 4 specialized GCP domain scanners concurrently based on scanned data."
)

# --- 3. Composite Root Agent (Sequential Agent) ---
root_agent = SequentialAgent(
    name="GcpAdvisorOrchestrator",
    sub_agents=[scanner_agent, parallel_scan_agent],
    description="Full Sequential lifecycle: 1) Scan all infra to memory -> 2) Run 4 scoped analyzers concurrently."
)
