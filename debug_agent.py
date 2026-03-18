import os
import sys

# 워크스페이스 패스 주입
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'agents')))

from google.adk import Agent
# orchestrator 파일에서 객체 가져오기
from agents.agent.orchestrator import workflow_agent

print("🚀 [디버그] Orchestrator 동적 구동 테스트를 시작합니다.")

test_prompt = """
[📋 인프라 운영 보증 목표]
- 장애복구목표 (RTO): 4시간 이내
- 가용성 (SLA) 목표: 99.9% 이상
- 예상 트래픽 규모: 대규모 (Spike traffic 존재)
- 배포 및 오케스트레이션: 쿠버네티스 (Kubernetes) 플랫폼 기반 아키텍처 사용
- 모니터링/로깅: 인프라 로그 수집 및 대시보드 모니터링 활성화 상태
- 아키텍처 스타일: 마이크로서비스(MSA) 방식 채택

[상세 인프라 묘사]
AWS 상에서 ALB가 있고 ECS Fargate를 통해 컨테이너들을 띄우며 Aurora RDS를 백엔드로 사용 중입니다.
동작 검증을 수행해 주세요.
"""

try:
    print("🤖 [상태] ADK 에이전트 모델 호출 중... (타임아웃 여부 확인용)")
    response = workflow_agent.run(test_prompt)
    print("\n✅ [결과 수신 완료] ====")
    print(response.text)
except Exception as e:
    print(f"\n❌ [에러 발생] {str(e)}")
