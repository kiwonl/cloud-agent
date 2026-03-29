import os
import sys

# Ensure modules in agents/ can be imported
sys.path.append(os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


from google.adk.cli.fast_api import get_fast_api_app
import uvicorn

# Create the root ADK application.
# Passing the current directory means ADK will recursively scan for ALL agents
# (both migration_advisor and gcp_advisor agent folders) and mount them automatically
# under their respective names like /migration_advisor/run or /gcp_evaluator/run.
adk_app = get_fast_api_app(
    agents_dir=os.path.join(os.path.dirname(__file__), "migration_advisor"),
    web=False,
    auto_create_session=True,
    allow_origins=["*"]
)

try:
    # Import our custom router for the GCP Orchestration (Streaming)
    from gcp_advisor.main import router as gcp_router
    # Attach the custom streaming endpoint to the ADK FastAPI server
    adk_app.include_router(gcp_router)
    print("Mounted custom GCP Advisor Orchestrator Router successfully!")
except Exception as e:
    print(f"Warning: Could not mount custom GCP Orchestrator router: {e}")

from fastapi.middleware.cors import CORSMiddleware
try:
    adk_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
except Exception:
    pass

if __name__ == "__main__":
    # We run the unified server on port 8000
    uvicorn.run(adk_app, host="0.0.0.0", port=8000)
