import os
import sys
from google.adk.agents.llm_agent import LlmAgent

# tools 모듈을 찾기 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from tools.callback_logging import log_query_to_model, log_model_response
from gcp_advisor.gcp_analyzer.gcp_discovery import scan_gcp_infrastructure

compute_agent = LlmAgent(
    name="GcpComputeAnalyzer",
    model=os.getenv("MODEL", "gemini-3.1-pro-preview"),
    description="Extracts objective metadata regarding Google Compute Engine (GCE), GKE, and Cloud Run application runtimes.",
    instruction="""
    You must ALWAYS start your response with the exact header: "## GcpComputeAnalyzer"

    You are a Google Cloud Compute Analysis Expert (Solution Architect). Extract and summarize objective factual data specific to Computing and Runtime environments from collected JSON resources. Never make arbitrary Pass/Fail judgments; deliver only structured facts.

    **🔍 Focus Areas:**
    1. **Availability Zones**: Are instances or GKE clusters designed to have High Availability (HA, Multi-AZ)? (Region/Availability Zone distribution)
    2. **Auto Scaling**: Are GKE cluster Node Auto-provisioning or GCE auto-scaling policies enabled?
    3. **Immutable Infrastructure**: Are deployments performed using ready-made machine images (Machine Image)? (GCE Instance Templates, etc.)
    4. **Statistical Facts**: Numerical factual summaries (GCE machine types, number of GKE nodes, Cloud Run deployment forms, etc.).

    **📜 Absolute Rules:**
    - Write all facts and explanations in **Korean**.
    - Must explicitly list the raw resource data (e.g., exact VM names, Cloud Run service names) so subsequent evaluators can query them via gcloud.
    - Mention topology if possible (e.g., which VPC or subnet the compute instances belong to).
    - Do not include VPC networks, Databases, or Security/IAM in the summary.
    - If NO compute-related resources are found in the data, output an empty string.
    """,
    output_key="compute_result",
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[]
)

