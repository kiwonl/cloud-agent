# GCP Advisor Agent - 아키텍처 설계 명세서 (ADS)

## 1. 개요 (Introduction)
본 문서(ADS)는 `agents/gcp-advisor/SRS.md`에 정의된 요구사항을 달성하기 위한 Google ADK 기반의 멀티 에이전트(Multi-Agent) 시스템 아키텍처를 정의합니다. 기존에 구축된 `/migration-advisor` 프로젝트의 3단계 파이프라인(`analyzer` $\rightarrow$ `translator` $\rightarrow$ `generator`) 설계 패턴을 벤치마킹하여, 시스템을 역할별로 철저히 분리하고 모듈화하는 구조를 제안합니다.

## 2. 시스템 아키텍처 개요 (System Architecture)

### 2.1 에이전트 분리 전략 (Multi-Agent Division Strategy)
단일 에이전트가 데이터 수집, 평가, 솔루션 제시, 코드 작성까지 모두 수행하면 LLM의 컨텍스트 한계(Context Window Limit)에 부딪히거나, 역할의 혼선으로 인해 환각(Hallucination) 현상이 발생하기 쉽습니다. 이를 방지하기 위해 `gcp-advisor`는 다음의 **3단계 전담 에이전트 체제**로 분리하여 구성합니다.

#### Agent 1: `gcp_analyzer` (인프라 수집 및 아키텍처 리포팅 담당)
- **입력 (Input)**:
  1. **GCP 접근 권한 정보**: Agent가 사용자 Google Cloud Project에 접근하기 위한 자격 증명 (Project ID, Service Account Key 등)
  2. **사용자 사전 자가진단 (Self-Check) 데이터**: 사용자가 사전에 직접 각 체크리스트 항목별로 자신의 현재 상태(적용 여부/Pass/Fail 등)를 자가 점검하여 입력해 둔 응답 메타데이터
- **역할 (Role)**: 사용자의 GCP 계정 접근 정보를 기반으로 환경에 접속해 데이터를 추출하고, 구조화된 인프라 현황 리포트를 발행합니다.
- **주요 동작**:
  1. **GCP 접속 및 인프라 확보**: 사용자가 입력한 자격 증명 정보(GCP Project ID, 대상 Region, Service Account Key 등)를 이용하여 Google Cloud Project에 접근합니다.
  2. **CAI 및 App Hub 기반의 심층 데이터 수집**: Agent 2의 완벽한 체크리스트 검증을 돕기 위해, **Cloud Asset Inventory (CAI)** API를 주축으로 활용하여 프로젝트 내의 모든 리소스 스펙과 IAM 정책(권한) 정보를 단일 포인트에서 횡단 수집합니다. 추가로, 사용자 환경에 **App Hub**가 구성되어 있다면 이를 함께 조회하여 개별 리소스들이 어떤 비즈니스 애플리케이션 그룹에 속해 있는지 논리적 컨텍스트를 풍부하게 보강합니다.
  3. **구조화된 현황 리포트 발행**: CAI 등에서 수집된 거대한 원시(Raw) 메타데이터를 기반으로, 주관적 평가(Pass/Fail)는 철저히 배제한 채 객관성 있는 팩트 요소만 담긴 구조화된 마크다운 리포트를 생성합니다. (단, LLM 컨텍스트 한계를 방지하기 위해 필수 평가 지표 위주로 필터링되어 리포트에 기록됩니다.)
- **출력 (Output)**: 현재 구성된 인프라 전반에 대한 객관적이고 구조화된 상태 보고서 (Architecture Report).

#### Agent 2: `gcp_evaluator` (단일 항목 상태 평가 담당 - Evaluator)
- **역할 (Role)**: `gcp_analyzer`가 발행한 인프라 현황 리포트를 기본으로 바탕 삼아 **단 1개의 특정 체크리스트 항목**에 대해 철저히 검증(Audit)합니다. 만약 리포트 정보가 불충분할 경우 직접 GCP 환경에 접근 가능합니다.
- **주요 동작**:
  1. 단일 체클리스트 항목(예: "Cloud SQL Public IP 차단 여부")의 조건을 파악하고 1차적으로 인프라 리포트의 내용과 비교 대조합니다.
  2. **[능동 추가 수집]**: 리포트에 담긴 정보가 너무 축약되어 판단이 어렵거나 누락된 경우, Agent 2에 탑재된 GCP 조회 도구(API/CLI Tools)를 능동적으로 호출하여 Cloud 환경에서 구체적인 메타데이터를 추가로 긁어옵니다.
  3. 수집된 모든 최종 팩트 조합을 엄격히 하드코딩된 시스템 명세(Evaluation Rubric)에 대입하여 최종적으로 `Pass`, `Fail`, `Warn` 여부를 결정합니다.
  4. (예: 어떤 리소스 설정에 문제가 있었는지) 판정에 대한 논리적인 세부 결함을 객관적인 마크다운 형식으로 요약합니다.
- **출력 (Output)**: '하나의 체크리스트 항목'에 대한 심사 결과 상태와 최종 논리적 근거 (Audit Reason).

#### Agent 3: `gcp_remediator` (Best Practice 제안 및 IaC 코드 생성 담당 - Remediator)
- **역할 (Role)**: Agent 2가 발견한 `Fail` 또는 `Warn` 항목에 대해 Google Cloud 최고 권장 사항(Best Practice)을 제시하고 조치 코드를 반환합니다.
- **주요 동작**:
  1. Agent 2의 실패 근거를 토대로, 해당 상태를 패스(Pass)로 되돌리기 위한 최적의 아키텍처 방법론(Best Practice)을 조언(Consulting)합니다.
  2. 조언한 해결책을 즉시 현장에 반영할 수 있도록 견고한 `Terraform (.tf)` 표준 코드 스니펫이나 자동화된 `gcloud` 명령어 형태로 생성합니다.
  3. (옵션) 생성된 Terraform 코드의 Syntax를 내부적으로 검증하여 문법적 완결성을 확보합니다.
- **출력 (Output)**: 특정 항목 실패에 대한 맞춤형 컨설팅 요약 및 즉시 실행 가능한 조치 코드(`IaC`).

### 2.2 인프라 현황 리포트 상세 스펙 (Agent 1 Output)
Agent 1이 작성하여 Agent 2로 전달하는 `infrastructure_report.md`는 체크리스트 판단의 근거가 되는 **객관적인 팩트(Fact) 정보의 요약본**입니다. 리포트에는 다음의 핵심 스펙들이 반드시 구조화되어 추출되어야 합니다.

**1. 컴퓨팅 및 컨테이너 노드 (Compute & GKE/Cloud Run)**
- **가용성 및 스케일링**: Multi-Zone/Region 분산 배포 여부, Auto-scaling(HPA, MIG) 설정 활성화 여부
- **보안 및 접속 범위**: 자원별 Public IP 매핑 여부, 내부 접속 정책
- **런타임 및 환경**: 구동 계정(Service Account) 설정 범위

**2. 네트워킹 (VPC, FW, Load Balancing)**
- **접근 통제(Firewall)**: Inbound/Outbound Rules 현황 (예: "포트 22번이 0.0.0.0/0으로 전체 개방되어 있음" 등 특정 포트 노출 사실 식별)
- **트래픽 및 라우팅**: Cloud NAT 사용 여부, 로드밸런서(Global/Regional) 스펙, 프라이빗 서브넷 분리 상태
- **암호화 및 방어**: HTTPS/SSL 인증서 부착 상태 및 Cloud Armor 연동 상태

**3. 데이터베이스 및 스토리지 (Cloud SQL, GCS 등)**
- **데이터 보호 방침**: 자동 백업 구성 주기, 포인트 인 타임 복구(PITR) 설정 여부, 스토리지 버저닝(Versioning) 사용 여부
- **고가용성 (HA)**: 데이터베이스 인스턴스의 다중 영역 복제(HA) 세팅 유무
- **네트워크 노출**: DB 전용 Private IP 연결(VPC Peering) 여부 및 승인된 네트워크 범위, Public 연결 유무

**4. 식별 및 권한 관리 (IAM)**
- **서비스 어카운트 권한**: 인스턴스 단위로 할당된 권한 목록
- **최소 권한의 원칙 정보**: `roles/owner` 등 광범위한 권한(Over-permissive role) 부여 여부 확인 및 팩트 서술

위와 같이 분류된 팩트들이 구조화되면, **Agent 2는 "DB에 Public IP가 들어있으니 보안 체클리스트 12번 실패(Fail) -> Cloud SQL Auth Proxy 또는 Private IP 적용을 권장(Consulting)"** 이처럼 추론 단계 혼선 없이 정확하게 진단을 내릴 수 있습니다.

### 2.3 체크리스트 평가 기준 가이드라인 (Agent 2 Prompt Rule)
Agent 2가 실행 시마다 다른 기준이나 지침(Hallucination)으로 평가하는 것을 방지하기 위해, **Agent 2의 시스템 프롬프트에는 각 체크리스트 항목을 어떻게 평가해야 하는지에 대한 '명확한 채점 기준(Evaluation Rubric)'이 반드시 사전 정의**되어야 합니다.

*   **객관적 판정 기준 명시**: 프롬프트 내에 "VPC 내 포트 22번이 0.0.0.0/0으로 개방되어 있다면 무조건 Fail 처리", "DB 백업 구성이 없다면 Fail 처리"와 같이 세부적인 판단 룰을 하드코딩 수준으로 구체화하여 일관성을 확보합니다.
*   **정보 부재 시 능동적 동적 수집 (Active Verification)**: Agent 1의 리포트 정보가 충분하지 않다고 해서 LLM이 임의로 추측(Hallucination)하여 어림잡아 넘기지 않도록 엄격히 통제합니다. 대신, 즉시 **주어진 GCP 조회 Tool(검색 기능)을 가동하여 빈칸 데이터(보충 사실)를 직접 현장에서 가져온 뒤** 결론을 짓도록 룰을 세팅합니다.
*   **추론 불가 항목의 Skip 처리 (판단 근거 없음)**: 체크리스트 항목을 분석했을 때 해당 룰이 '물리적인 Google Cloud 인프라 정보'만으로는 절대 평가할 수 없는 성격(예: 오프라인 사내 보안 정책 준수 등)이라면 억지로 Tool을 호출하거나 정보를 찾으려 시도하지 않습니다. 즉각적으로 `"N.A (판단 근거 없음)"`으로 상태를 정의하고 루프를 안전하게 다음 항목으로 넘기도록 방어선(Guardrail)을 세웁니다.

---
## 3. 에이전트 간 데이터 흐름 (항목별 루프 기반 아키텍처 - Item-by-Item Loop)
LLM의 컨텍스트 한계를 방지하고 정확도를 극대화하기 위해, 전체 인프라 수집(Phase 1) 이후에 검증 및 조치는 **동적인 순환 루프(Phase 2)** 구조를 가집니다.

1. **사용자 요청**: 사용자가 Web UI 또는 CLI를 통해 대상 GCP Project ID를 입력하고 점검할 체크리스트 선택.
2. **Phase 1 (Infra Analytics)**:
   - **(통합) Agent 1 (`gcp_analyzer`)**
   - Input: 
     1. GCP 자격 증명(사전 연동)
     2. 사용자가 각 체클리스트 항목에 대해 사전에 입력한 자가진단 (Self-Check) 응답 내역
   - Action: CAI 및 스캔 자동화 도구를 구동하여 객관적 팩트 위주의 `인프라 아키텍처 현황 리포트`를 단일 마크다운(Markdown) 문서로 생성 완료. (사용자의 자가진단 내용과 비교 대조할 수 있도록 구조화됨)
3. **Phase 2 (Parallel Evaluation & Streaming Remediation Loop)**:
   *전체 처리 속도 한계를 극복하기 위해 오케스트레이터가 N개의 체크리스트 항목을 비동기 병렬 처리(Async Parallel) 기반으로 동시에 스캔을 가동합니다.*
   - **For each Checklist Item:**
       1. **Step 2A (Audit by Agent 2 / `gcp_evaluator`)**: 체크리스트 [단일 항목 1] 룰 + [통합 인프라 리포트] + [GCP 자격 증명 / Tool]
          - Action: 
            - 1차: 인프라 리포트 내용만으로 [항목 1]의 `Pass`/`Fail`을 확정할 수 있는지 확인.
            - 2차: 정보 부족 시(Deep Dive 필요 시), `GCP API Tool`을 호출해 실시간으로 대상 Google Cloud 프로젝트로부터 리소스 상태 추가 질의 후 반영.
          - Output: 최종 평가(`Pass`/`Fail`/`Warn`) 여부와 실패 원인이 명시된 근거 텍스트 발행.
       2. **결과 분기기 (Branch)**:
          - If `Pass` or `N.A`: 컨설팅 불필요, 루프 종료하고 다음 항목 스캔.
          - If `Fail` or `Warn`: 조치 코드와 대안 설계가 필요하므로 **Agent 3로 진입**.
       3. **Step 2B (Remediate by Agent 3 / `gcp_remediator`)**: Agent 2의 체점 결과표 및 실패 근거 텍스트
          - Action: 실패한 요소의 보안/가용성을 강화할 수 있는 Cloud Best Practice 조언을 작성하고, 해당 사항을 복구할 `Terraform` 또는 `gcloud CLI` 코드를 즉시 생성하여 함께 리턴.
4. **루프 종료 (Reporting Consolidation)**:
   - 모든 N개 항목에 대한 병렬 Loop가 성공적으로 종료되면, `심사 결과(Agent 2)`와 `보완 컨설팅 코드(Agent 3)`를 데이터베이스에 취합하여 최종 종합 감사 리포트를 발행합니다.

### 🌟 3.1 성능 및 UX 최적화 가이드라인 (Performance & Experience)
방대한 항목 검사 시 발생하는 API 지연 및 사용자 불만을 완벽하게 해결하기 위해 다음의 2가지 아키텍처 코어 원칙을 함께 적용합니다.
*   **제한된 비동기 다중 처리 (Async Parallel Workers)**: 한 번에 하나씩(Sequential) 평가하며 사용자를 기다리게 하지 않습니다. 최대 동시 실행 수(예: 5개~10개) 제한이 걸린 병렬 워커(Worker) 구조를 통해 API 트래픽 병목을 방지하면서도 **전체 연산 소요 시간을 획기적으로 압축**(1/N 수준)합니다.
*   **실시간 스트리밍 대시보드 (Server-Sent Events / Streaming)**: Agent 2의 치열한 심사 과정과 Agent 3의 복잡한 조치 코드 생성 과정을 사용자가 실시간으로 지켜볼 수 있도록, 단어(Token) 단위로 쪼개어 프론트엔드로 즉각 타이핑(스트리밍) 합니다. 다수의 항목들이 동시에 타이핑되는 **Live Dashboard UX**를 통해 사용자 체감 대기 시간(Perceived Latency)을 제로(0)에 가깝게 만듭니다.

## 4. 디렉토리 구조안 (Directory Structure)
위의 설계에 따라 `agents/gcp-advisor` 산하의 구조는 아래와 같이 구성될 것입니다.

```text
agents/gcp-advisor/
├── SRS.md                      # 요구사항 명세서
├── ADS.md                      # 아키텍처 설계 명세서 (현재 문서)
├── main.py                     # [NEW] 단일 오케스트레이터 관문 (FastAPI SSE 통신, 비동기 루프 제어)
├── gcp_analyzer/
│   ├── agent.py                # 1단계 에이전트 (인프라 스펙 판독 담당)
├── gcp_evaluator/
│   └── agent.py                # 2단계 에이전트 (비동기 병렬 채점 루프 담당)
├── gcp_remediator/
│   └── agent.py                # 3단계 에이전트 (에러 발견 시 컨설팅 및 코드 생성 담당)
├── prompts/
│   ├── gcp_analyzer.txt        # Agent 1 시스템 프롬프트
│   ├── gcp_evaluator.txt       # Agent 2 시스템 프롬프트
│   └── gcp_remediator.txt      # Agent 3 시스템 프롬프트
└── tools/
    └── gcp_discovery.py        # 시스템 공용으로 쓰일 GCP CAI 인프라 조회 모듈
```

## 5. 결론 및 향후 과제
위와 같은 3단계 파이프라인 구조는 책임을 명확하게 분리하여 각 에이전트가 부여된 프롬프트에 극도로 집중하게 만듭니다. 이는 `migration-advisor`에서 입증된 안정성 높은 패턴이며, 사용자는 각 단계별로 중간 결과물(진단 내용 $\rightarrow$ 컨설팅 방향 $\rightarrow$ 실제 코드)을 확인하며 HITL(Human-In-The-Loop) 형태로 개입할 수 있습니다.
