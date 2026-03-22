# GCP Advisor Agent - 시스템 요구사항 명세서 (SRS)

## 1. 개요 (Introduction)
본 문서는 Google ADK(Agent Development Kit)를 기반으로 동작하는 `gcp-advisor` 시스템의 목적과 주요 기능, 그리고 동작 단계별 기능적 요구사항을 정의합니다. 
기존의 단일 에이전트 구조에서 벗어나, 환각 문제(Hallucination)를 제거하고 일관된 고품질의 추론 결과를 얻기 위해 **3단계 역할 분담(Analyzer, Evaluator, Remediator)** 체제와 **항목별 비동기 순환(Item-by-Item Async Parallel Loop)** 아키텍처를 완벽하게 준수하여 구축됩니다.

## 2. Agent의 주요 역할 및 단계별 동작 시나리오

### 2.1 Agent 1: gcp_analyzer (인프라 수집 및 리포팅)
**목적:** GCP 프로젝트 전반의 객관적인 인프라 구성 스펙을 오직 팩트 위주로 수집하여 단일 마크다운 리포트로 구조화합니다.
- **요구사항 1 (자격 증명 연동)**: 사용자가 입력한 Google Cloud 자격 증명(Service Account Key 또는 ADC)과 1차 Self-Check 데이터를 입력값으로 받습니다.
- **요구사항 2 (최선진 수집 기술 도입)**: 개별 API 스캔의 한계를 넘기 위해 **Cloud Asset Inventory (CAI)**를 주축으로 사용해 전사(Project/Organization) 레벨 리소스 상태와 IAM 정책을 통합 수집합니다. 필요 시 App Hub 연동으로 애플리케이션(Application) 논리적 그룹 구성을 매핑합니다.
- **요구사항 3 (중립적 리포트 발행 방침)**: 체크리스트를 기반으로 수집하되, 어떠한 경우에도 Agent 1 자체적으로 인프라에 대한 설정 정상 여부(Pass/Fail)를 판단 및 평가하지 않습니다. 수집된 Raw Data를 Compute, Network, DB/Storage, IAM 등 도메인별로 분류만 하여 `인프라 아키텍처 현황 리포트`를 발행합니다.

### 2.2 Agent 2: gcp_evaluator (단일 항목 상태 평가 담당)
**목적:** Agent 1이 만든 인프라 리포트를 읽고 `checklist.csv`의 특정 검증 항목 1개의 합격(Pass/Fail) 여부를 논리적으로 채점합니다.
- **요구사항 1 (아이템별 독립 검증 - Loop)**: 전체 리스트가 아닌 **'단 1개의 체크리스트 항목'**과 **'인프라 현황 리포트 부분'**에만 컨텍스트를 집중하여 Pass/Fail/Warn/N.A 를 결정합니다. 이를 통해 문맥 유실(Lost in the middle)을 방지합니다.
- **요구사항 2 (판단 기준 하드코딩)**: 시스템 프롬프트(명령어) 상에 어떻게 점수를 매겨야 하는지 명확한 가이드라인(Evaluation Rubric)이 강제되어, 매번 다른 잣대로 인프라를 판정하는 일이 발생하지 않도록 제어합니다.
- **요구사항 3 (능동적 추가 수집 및 예외 처리)**:
  - Agent 1의 리포트에 항목을 판단할 핵심 메타데이터가 모자랄 경우, 즉시 GCP 검색 Tool(API/CLI)을 자율적으로 호출해 증거를 더 찾아 결정(Active Verification)합니다.
  - 단, 해당 체크리스트가 구글 클라우드 인프라 특성이 아닌 사내 지침 등 추론 불가능한(Non-measurable) 영역인 경우에는 Tool 호출 없이 즉시 "판단 근거 없음 (N.A)"으로 플래그 처리한 후 종료(Skip)합니다.

### 2.3 Agent 3: gcp_remediator (대안 제시 및 자동화 조치)
**목적:** Agent 2가 식별한 취약점(Fail/Warn) 요소에 대하여 구글 클라우드 보안/아키텍처 베스트 프랙티스 수준의 개선 컨설팅 및 실적용 코드를 제시합니다.
- **요구사항 1 (정성적 클라우드 컨설팅)**: Fail 사유를 전달받아, Google Cloud 아키텍처 프레임워크(Architecture Framework) 설계 스펙에 부합하는 해결책과 권장 사항을 요약 제안합니다.
- **요구사항 2 (즉각적 IaC 코드 생성)**: 단순 조언으로 그치지 않고, 1:1로 즉시 환경에 복사+붙여넣기로 배포할 수 있는 **Terraform 스니펫**이나 **gcloud CLI 복구 명령어**를 작성하여 함께 반환합니다.

## 3. 핵심 시스템 성능 및 UX 요구사항 (Performance & UX)
점검해야 할 체크리스트 항목 수 증가 시 기하급수적으로 대기 시간이 늘어나는 기존 방식의 병목 현상을 타파해야 합니다.
- **비동기 제한적 병렬 처리 (Async Parallel Workers)**: 오케스트레이터(Orchestrator/Frontend) 단에서 체크리스트의 각 항목 평가 루프(Agent 2 $\rightarrow$ Agent 3)를 하나씩 대기하지 않고, 5~10개 단위로 비동기로 동시에 평가가 진행되어야 합니다.
- **실시간 스트리밍 대시보드 연동 (Streaming)**: 다수의 에이전트들이 평가 및 코드 생성 과정을 고민하는 타이핑 과정(토큰 생성) 전체를 즉시 프론트엔드로 스트리밍(Server-Sent Events)해야 합니다. 이를 통해 사용자가 라이브로 보안 점검이 진행되는 생동감 넘치는 UX 환경을 체감하도록 디자인합니다.

## 4. 모듈 시스템 디렉토리 계획안 (Directory Architecture)
에이전트 별 역할이 철저히 격리(Isolation) 됨에 따라 향후 파일 구조는 다음과 같이 재배치됩니다.
```text
agents/gcp-advisor/
├── SRS.md                      # 기능 요구사항 명세서 (현재 파일)
├── ADS.md                      # 멀티 에이전트 설계 명세서
├── prompts/                    # 공용 프롬프트 보관소
│   ├── gcp_analyzer.txt            # 시스템 프롬프트 (중립적 리소스 팩트 수집기)
│   ├── gcp_gcp_evaluator.txt             # 시스템 프롬프트 (채점 기준 명세 포함)
│   └── gcp_gcp_remediator.txt           # 시스템 프롬프트 (Best Practice 및 Terraform 도출)
├── gcp_analyzer/               # Agent 1 (인프라 데이터 추출)
│   └── agent.py
├── gcp_evaluator/                # Agent 2 (단일 항목 통과 여부 심사기)
│   └── agent.py
└── gcp_remediator/              # Agent 3 (해결 컨설팅 및 IaC 파서)
    └── agent.py
```