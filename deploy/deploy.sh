#!/bin/bash

# 스크립트의 현재 위치를 기준으로 상위 폴더의 .env 파일 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# .env 파일이 존재하는 경우 로드하여 환경변수로 적용
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment variables from $ENV_FILE..."
    set -a
    source "$ENV_FILE"
    set +a
else
    echo "Note: .env file not found at $ENV_FILE. Using existing shell variables."
fi

# Ensure GOOGLE_CLOUD_PROJECT is set
if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is not set."
    echo "Please set it: export PROJECT_ID=your-project-id"
    exit 1
fi

AGENT_SERVICE_NAME="cloud-agent"
FRONTEND_SERVICE_NAME="cloud-frontend"
MODEL_LOCATION="${MODEL_LOCATION:-global}"
LOCATION="${LOCATION:-us-central1}"
MODEL="${MODEL:-gemini-2.5-pro}"

SA_NAME="cloud-agent-sa"

SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo "PROJECT_ID: $PROJECT_ID"
echo "LOCATION: $LOCATION"  
echo "MODEL_LOCATION: $MODEL_LOCATION"

echo "Checking Service Account: $SA_EMAIL"
if ! gcloud iam service-accounts describe "$SA_EMAIL" --project "$PROJECT_ID" > /dev/null 2>&1; then
    echo "Creating Service Account: $SA_NAME"
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="Cloud Agent Service Account" \
        --project "$PROJECT_ID"
else
    echo "Service Account already exists."
fi

echo "Granting Vertex AI User role to $SA_EMAIL"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/aiplatform.user" \
    --condition=None \
    --quiet

echo "Granting Cloud Asset Viewer role to $SA_EMAIL"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudasset.viewer" \
    --condition=None \
    --quiet


echo "Deploying Agent (Backend) $AGENT_SERVICE_NAME to Google Cloud Run..."
gcloud run deploy $AGENT_SERVICE_NAME \
    --source "$SCRIPT_DIR/../agents" \
    --region $LOCATION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-env-vars="MODEL=$MODEL,GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$MODEL_LOCATION" \
    --service-account="$SA_EMAIL" \
    --timeout=600 \
    --quiet


# Retrieve the actual URL of the deployed Agent
AGENT_URL=$(gcloud run services describe $AGENT_SERVICE_NAME --platform managed --region $LOCATION --project $PROJECT_ID --format 'value(status.url)')
echo "Agent deployed at: $AGENT_URL"

echo "Deploying Frontend $FRONTEND_SERVICE_NAME to Google Cloud Run..."
gcloud run deploy $FRONTEND_SERVICE_NAME \
    --source "$SCRIPT_DIR/../frontend" \
    --region $LOCATION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --set-env-vars="AGENT_API_URL=$AGENT_URL" \
    --quiet

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_NAME --platform managed --region $LOCATION --project $PROJECT_ID --format 'value(status.url)')
echo "Frontend deployed at: $FRONTEND_URL"

echo "Deployment complete! Access the application here: $FRONTEND_URL"

