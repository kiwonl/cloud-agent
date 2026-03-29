# Validated Provisioning Script based on vertexai Client
import argparse
import os
import vertexai

def main():
    parser = argparse.ArgumentParser(description="Provision an Agent Engine on Vertex AI")
    parser.add_argument("--project_id", type=str, help="Google Cloud Project ID", required=True)
    parser.add_argument("--location", type=str, help="Google Cloud Location", required=True)
    parser.add_argument("--agent_name", type=str, help="Name of the Agent", required=True)
    parser.add_argument("--model", type=str, help="Model to use (e.g. gemini-3.1-pro-preview)", required=True)

    args = parser.parse_args()

    PROJECT_ID = args.project_id
    LOCATION = args.location
    AGENT_NAME = args.agent_name
    MODEL = args.model

    print(f"Creating Agent Engine in {LOCATION} for project {PROJECT_ID}...")

    # Using standard vertexai Client
    client = vertexai.Client(project=PROJECT_ID, location=LOCATION)
    
    agent_engine = client.agent_engines.create(
        config={
            "display_name": AGENT_NAME,
            "context_spec": {
                "memory_bank_config": {
                    "generation_config": {
                        "model": f"projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}"
                    }
                }
            }
        }
    )

    agent_engine_id = agent_engine.api_resource.name.split("/")[-1]
    print(f"✅ Success! Agent Engine ID: {agent_engine_id}")
    return agent_engine_id

if __name__ == "__main__":
    main()
