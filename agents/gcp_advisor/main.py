import asyncio
import json
import logging
import os
import sys
from typing import List, Dict, Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure local imports work regardless of how it's executed
sys.path.append(os.path.dirname(__file__))

try:
    from gcp_analyzer.agent import root_agent as analyzer_agent
    from gcp_evaluator.agent import root_agent as evaluator_agent
    from gcp_remediator.agent import root_agent as remediator_agent
except ImportError as e:
    logger.error(f"Failed to import agents: {e}")
    analyzer_agent = evaluator_agent = remediator_agent = None

from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner, InMemorySessionService
from google.genai.types import Content, Part

async def run_agent_stateless(agent, prompt: str, session_id: str) -> str:
    runner = Runner(
        app_name="gcp_advisor", 
        agent=agent, 
        session_service=InMemorySessionService(), 
        auto_create_session=True
    )
    events = runner.run_async(
        user_id="default_user",
        session_id=session_id,
        new_message=Content(role="user", parts=[Part.from_text(text=prompt)])
    )
    res = ""
    async for event in events:
        if getattr(event, "content", None) and getattr(event.content, "parts", None):
            for part in event.content.parts:
                if getattr(part, "text", None):
                    res += part.text
    return res
router = APIRouter()

import tempfile

# Request schemas
class AnalyzeRequest(BaseModel):
    project_id: str
    sa_key: str = ""
    session_id: str
    self_check_data: Dict[str, Any] = {}

class EvaluateRequest(BaseModel):
    project_id: str
    session_id: str
    infrastructure_report: str
    checklist_items: List[Dict[str, str]]

async def stream_analyze(req: AnalyzeRequest):
    temp_key_path = None
    original_creds = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    try:
        if req.sa_key and req.sa_key.strip():
            fd, temp_key_path = tempfile.mkstemp(suffix=".json")
            with os.fdopen(fd, 'w') as f:
                f.write(req.sa_key)
            os.environ["TARGET_SA_CREDENTIALS_PATH"] = temp_key_path

        yield f"data: {json.dumps({'type': 'status', 'agent': 'analyzer', 'message': 'Booting Agent 1: Scanning GCP CAI...'})}\n\n"
        
        analyzer_prompt = (
            f"Project ID: {req.project_id}\n"
            f"User Self-Check Data: {json.dumps(req.self_check_data)}\n"
        )
        
        report = await run_agent_stateless(analyzer_agent, analyzer_prompt, req.session_id)
        
        yield f"data: {json.dumps({'type': 'status', 'agent': 'analyzer', 'message': 'CAI Scan Complete. Returning Infrastructure Report.'})}\n\n"
        yield f"data: {json.dumps({'type': 'analyzer_done', 'agent': 'analyzer', 'report': report})}\n\n"
        yield f"data: {json.dumps({'type': 'complete', 'agent': 'system'})}\n\n"

    except Exception as e:
        logger.error(f"Analyzer critical error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'agent': 'analyzer', 'message': f'Critical Error: {str(e)}'})}\n\n"
    finally:
        if temp_key_path and os.path.exists(temp_key_path):
            os.remove(temp_key_path)
            if original_creds is not None:
                pass  # We did not override original_creds
            if "TARGET_SA_CREDENTIALS_PATH" in os.environ:
                del os.environ["TARGET_SA_CREDENTIALS_PATH"]

async def stream_evaluate(req: EvaluateRequest):
    try:
        yield f"data: {json.dumps({'type': 'status', 'agent': 'evaluator', 'message': f'Starting Agent 2 parallel loop for {len(req.checklist_items)} items.'})}\n\n"
        
        semaphore = asyncio.Semaphore(5)
        queue = asyncio.Queue()
        
        async def evaluate_item(item: Dict[str, str]):
            async with semaphore:
                item_id = item.get("id", "unknown")
                rule_text = json.dumps(item, ensure_ascii=False)
                
                eval_prompt = (
                    f"Target Project: {req.project_id}\n"
                    f"Checklist Item Rule:\n{rule_text}\n"
                    f"---\n"
                    f"Infrastructure Report:\n{req.infrastructure_report}\n"
                )
                
                try:
                    eval_text = await run_agent_stateless(evaluator_agent, eval_prompt, f"{req.session_id}_{item_id}_eval")
                    
                    status = "PASS"
                    # Simple heuristic parsing since agent returns unstructured text
                    upper_text = eval_text.upper()
                    if "FAIL" in upper_text: status = "FAIL"
                    elif "WARN" in upper_text: status = "WARN"
                    elif "N.A" in upper_text or "N/A" in upper_text: status = "N/A"
                    
                    await queue.put(f"data: {json.dumps({'type': 'result', 'agent': 'evaluator', 'rule_id': item_id, 'status': status, 'reason': eval_text, 'resource': 'Target Project'})}\n\n")
                    
                    if status in ["FAIL", "WARN"]:
                        await queue.put(f"data: {json.dumps({'type': 'status', 'agent': 'remediator', 'rule_id': item_id, 'message': f'Invoking Agent 3 for Remediation on {item_id}...'})}\n\n")
                        
                        rem_prompt = (
                            f"Failed Item: {rule_text}\n"
                            f"Evaluator Reasoning: {eval_text}\n"
                        )
                        rem_text = await run_agent_stateless(remediator_agent, rem_prompt, f"{req.session_id}_{item_id}_rem")
                        
                        await queue.put(f"data: {json.dumps({'type': 'remediation_plan', 'agent': 'remediator', 'rule_id': item_id, 'data': rem_text})}\n\n")
                        
                except Exception as e:
                    logger.error(f"Error evaluating item {item_id}: {e}")
                    await queue.put(f"data: {json.dumps({'type': 'error', 'agent': 'evaluator', 'rule_id': item_id, 'message': str(e)})}\n\n")
        
        async def run_workers():
            tasks = [asyncio.create_task(evaluate_item(item)) for item in req.checklist_items]
            await asyncio.gather(*tasks)
            await queue.put(None) 
            
        asyncio.create_task(run_workers())
        
        while True:
            msg = await queue.get()
            if msg is None:
                break
            yield msg
            
        yield f"data: {json.dumps({'type': 'complete', 'agent': 'system', 'message': 'All tasks completed successfully!'})}\n\n"
        
    except Exception as e:
        logger.error(f"Evaluation critical error: {e}")
        yield f"data: {json.dumps({'type': 'error', 'agent': 'system', 'message': f'Critical Error: {str(e)}'})}\n\n"

@router.post("/api/v1/audit/analyze")
async def audit_analyze(req: AnalyzeRequest):
    return StreamingResponse(stream_analyze(req), media_type="text/event-stream")

@router.post("/api/v1/audit/evaluate")
async def audit_evaluate(req: EvaluateRequest):
    return StreamingResponse(stream_evaluate(req), media_type="text/event-stream")

@router.get("/health")
def health_check():
    return {"status": "ok", "agents_loaded": (analyzer_agent is not None)}
