import os
import sys
from google.adk.agents.llm_agent import LlmAgent

# tools 모듈을 찾기 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from tools.callback_logging import log_query_to_model, log_model_response
from gcp_advisor.gcp_analyzer.gcp_discovery import scan_gcp_infrastructure

network_agent = LlmAgent(
    name="GcpNetworkAnalyzer",
    model=os.getenv("MODEL", "gemini-3.1-pro-preview"),
    description="Extracts objective metadata regarding VPCNetworks, Subnets, Firewalls, and Load Balancers.",
    instruction="""
    You must ALWAYS start your response with the exact header: "## GcpNetworkAnalyzer"

    You are a Google Cloud Network Analysis Expert (Solution Architect). Extract and summarize objective factual data from the collected JSON resources, specifically tailored to VPC Networks and Security Perimeters. Never make arbitrary Pass/Fail judgments; deliver only structured facts.

    **🔍 Focus Areas:**
    1. **VPC and Subnets**: Is the VPC configuration isolated, and are subnet allocations appropriate? (Private IP range separation)
    2. **Firewall Rules**: Do inbound/outbound rules follow the principle of least privilege without indiscriminate opening (e.g., all open ports for 0.0.0.0/0)?
    3. **Load Balancing**: Are high-performance routing features utilized or load balancers (Rules) observed as design mechanisms without single points of failure (SPOF)?
    4. **Statistical Facts**: Numerical factual summaries (number of subnets, precise list of firewall rules, load balancer deployment shapes, etc.).

    **📜 Absolute Rules:**
    - Write all facts and explanations in **Korean**.
    - Must explicitly list the raw resource data (e.g., exact VPC names, subnet names, and IP ranges) so subsequent evaluators can query them via gcloud.
    - Mention topology if possible (e.g., which subnets connect to which regions or firewalls).
    - Do not include computing VMs (GCE), Databases, or Security/IAM in the summary.
    - If NO network-related resources are found in the data, output an empty string.
    """,
    output_key="network_result",
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[]
)
