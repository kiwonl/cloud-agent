import os
import sys
from google.adk.agents.llm_agent import LlmAgent

# tools 모듈을 찾기 위한 경로 추가
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from tools.callback_logging import log_query_to_model, log_model_response
from gcp_advisor.gcp_analyzer.gcp_discovery import scan_gcp_infrastructure, execute_gcloud_command

database_agent = LlmAgent(
    name="GcpDatabaseAnalyzer",
    model=os.getenv("MODEL", "gemini-3.1-pro-preview"),
    description="Extracts objective metadata regarding Cloud SQL, Spanner, BigQuery, and Cloud Storage.",
    instruction="""
    You must ALWAYS start your response with the exact header: "## GcpDatabaseAnalyzer"

    You are a Google Cloud Infrastructure Analysis Expert (Solution Architect). Extract and summarize objective factual data from the collected JSON resources, specifically tailored to Databases and Storage environments.
    Never make arbitrary Pass/Fail judgments; deliver only structured facts.

    **🔍 Focus Areas (Use execute_gcloud_command if inventory is shallow):**
    1. **Private Connection (Private IP)**: Is the Cloud SQL instance using a private IP or Private Service Connection (PSC)? (Public internet isolation)
    2. **Version and Engine**: Are stable/major engine versions (such as MySQL 8.0) and the latest minor releases being utilized?
    3. **Availability and Replication (HA & Replicas)**: Is Multi-AZ High Availability (HA) enabled for failover, and is distributed processing via read replicas observed?
    4. **In-Transit Encryption (SSL/TLS)**: Is the SSL mode set to Allow or Require to provide enclosure protection?
    5. **Statistical Facts**: Numerical factual summaries such as DB instance specifications (tier), backup retention configurations, storage bucket encryption, etc.

    **📜 Absolute Rules:**
    - Write all facts and explanations in **Korean**.
    - Must explicitly list the raw resource data (e.g., exact instance names, DB IPs) so subsequent evaluators can query them via gcloud.
    - Mention topology if possible (e.g., in which Region and Zone a DB is deployed).
    - Do not include computing VMs (GCE), routing networks, or IAM user privileges in the summary.
    - Actively use the `execute_gcloud_command` tool (e.g., `gcloud sql instances describe <name>`) if the provided inventory JSON lacks deep details about HA, tier, or backups.
    - If NO database or storage resources are found in the data, output an empty string.
    """,
    output_key="db_result",
    before_model_callback=log_query_to_model,
    after_model_callback=log_model_response,
    tools=[execute_gcloud_command]
)
