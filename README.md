# Google Cloud AI Agent (Cloud Architecture Migration Hub)

An intelligent, multi-agent automated system designed to streamline and accelerate the migration of complex infrastructure (e.g., AWS) to Google Cloud Platform (GCP). This application uses Advanced AI Agents to analyze architecture diagrams, perform quality audits, translate services, and generate production-ready Terraform (IaC) code.

## 🌟 Key Features

1. **Architecture Analysis & QA Audit**
   - **Multimodal Upload:** Drag and drop AWS architecture diagrams (PNG/JPG).
   - **Operational Goals:** Inject business requirements like RTO, SLA, and expected traffic scale.
   - **Automated Audit:** Evaluates the architecture against 34 strict Infrastructure Quality criteria (e.g., Multi-AZ, SPOF, Immutable Infrastructure).

2. **GCP Native Service Mapping**
   - **1:1 Translation:** Maps source AWS components (e.g., EC2, RDS, ALB) to GCP equivalents (e.g., GCE, Cloud SQL, Global LB).
   - **Architecture Optimization:** Provides expert-level insights and redesign suggestions (e.g., adopting GKE Autopilot or Global VPC).

3. **Terraform Generation (IaC)**
   - **Multi-file Structure:** Automatically logically splits generated code into `provider.tf`, `variables.tf`, `network.tf`, and `compute.tf`.
   - **Security & Best Practices:** Enforces Google Cloud Foundation Toolkit (CFT) principles, Least Privilege IAM, and Private-by-Default networks.
   - **Architecture Analysis:** Generates a Korean-language detailed report explaining the security posture and scaling choices of the generated code.

## 🏗️ System Architecture

This project strictly utilizes a **Direct Agent Call (Multi-agent) Workflow** instead of a single conversational orchestrator. The frontend dynamically delegates tasks to specialized ADK agents based on the pipeline stage.

### Agent Microservices
*   `aws_analyzer`: Ingests the raw image and metadata. Outputs an exhaustive markdown analysis, an array of matched resources, and a 34-item QA checklist JSON.
*   `translator`: Takes the analyzer's output and maps each service to GCP. Outputs a structural mapping JSON and markdown optimization advice.
*   `generator`: Ingests the mapping rules and structural data to generate valid, secure Terraform code (`.tf` files) using self-healing validation loops.

### Tech Stack
*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide-React, Framer Motion, ReactMarkdown.
*   **Backend:** Python, Google ADK (Agent Development Kit), Gemini 2.5 Pro.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.11+)
*   Google Cloud Credentials (`gcloud auth application-default login`)

### 1. Start the Backend Server (Agents)
The backend uses Google ADK to expose the specialized agents via a REST API.

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the ADK agent server
adk api_server agents
```
*The server will start on port 8080 and automatically load `aws_analyzer`, `translator`, and `generator` endpoints.*

### 2. Start the Frontend (UI)
The frontend uses Vite and proxies requests to the backend.

```bash
cd frontend
npm install

# Start the development server
npm run dev
```
*The UI will be accessible at `http://localhost:5173`. CORS proxying to `localhost:8080` is handled automatically via `vite.config.ts`.*

## 📜 Logging & Debugging

The backend utilizes a robust custom logger (`tools/callback_logging.py`) attached as pre/post-execution hooks to all agents.
*   **Console:** Clean, formatted tracing of prompts and markdown responses.
*   **File:** Rotating file logs are saved to `logs/cloud_agent.log` for extensive debugging.

## 📄 License
SPDX-License-Identifier: Apache-2.0
