# 🏗️ 아키텍처 및 모듈 설계 명세서 (ADS)
**프로젝트 명**: Vertex Cloud Architect Manager (AWS to GCP Migration Agent)  
**작성일**: 2026.03.17  
**문서 버전**: v1.0.0  

---

## 1. 하이레벨 시스템 아키텍처 (High-Level Architecture)

### 1.1 시스템 토폴로지
본 시스템은 **프론트엔드 가시화 웹 대시보드**와 **백엔드 멀티 에이전트 오케스트레이션 게이트웨이**가 비동기 REST API 인터페이스를 기점으로 상호 루프 구동하는 하이브리드 아키텍처로 구성된다.

```mermaid
graph LR
    subgraph Client [Frontend (React)]
        A[Dashboard UI] -->|fetch: /run| B[State Controller]
    end
    subgraph Server [Backend (ADK & FastAPI)]
        C[FastAPI Endpoint] -->|Orchestration| D[Orchestrator Agent]
        D[Orchestrator Agent] -->|Workflow Routing| E[Analyzer Agent]
        D[Orchestrator Agent] -->|Workflow Routing| F[Translator Agent]
        D[Orchestrator Agent] -->|Workflow Routing| G[Generator Agent]
    end
    B -->|HTTP /run| C
    E -->|Checklist Validation| D
    F -->|Resource Mappings| D
    G -->|Terraform HCL| D
    D -->|Buffer stream| B
```

---

## 2. 프론트엔드 설계 (Frontend Module Design)

### 2.1 주요 기술 스택
- **코어 프레임워크**: React v18 + Vite
- **디자인 가인드**: Tailwind CSS, Lucide icons (Glassmorphism UX 심사 적용)
- **트랜지션 모션**: Framer Motion (`AnimatePresence` 가설 적용)

### 2.2 상위 상태 거버넌스 (`App.tsx` State Lifting)
자식 뷰포트들의 고유 페이지 리액션 보존을 위해 `App.tsx` 최상위 레벨에서 비동기 fetch 파싱 및 하위 컴포넌트 프롭스(Props) 바인딩 루프를 총괄 거버넌스한다.
- **`activePage`**: 네비게이션 트리거 분기 가설 (`upload`, `mapping`, `checklist`, `terraform`)
- **`mappings`**: 번역 에이전트 수신 데이터 파싱 객체 투영 (`MappingItem[]`)
- **`checklist`**: 진단 적합성 검증 만족도 어레이 수용 (`VerificationItem[]`)
- **`terraformCode`**: 최종 사출 HCL 코드 스트링 패킹
- **`awaitingApproval`**: HITL(Human-In-The-Loop) 상태 스위칭 플래그

### 2.3 컴포넌트 구조도
| 페이지 컴포넌트 | 기능 및 비동기 하이드레이션 리셉터 |
| :--- | :--- |
| **`UploadPage`** | 사용자 AWS 아키텍처 입력 ➡️ `Analyze` 호출 ➡️ 로딩 스피너 및 Response 버퍼 트레이스 출력 |
| **`MappingPage`** | AWS ➡️ GCP 하부 서비스 분기 그래프 대조 출력 + `Awaiting Approval` 배너 활성 플로우 오버레이 |
| **`ChecklistPage`** | 보안/네트워크 운영 가이드 타겟 상태 마킹 리스트 투영 |
| **`TerraformPage`** | 추출된 HCL 마크다운 캔버스 단일 하이라이팅 컨테이너 가동 레이아웃 |

---

## 3. 백엔드 설계 (Backend Multi-Agent Design)

### 3.1 기술 스택
- **프레임워크**: Google ADK (Agent Development Kit), FastAPI
- **추론 백본**: Vertex AI (통합 LiteLlm 라우팅 가동 인터페이스)

### 3.2 ADK 멀티 에이전트 구성 명세
에이전트는 각 전문 도메인 영역으로 마이크로 분리되어 유기적으로 연수 피드백을 수용한다.

| 에이전트 모듈 객체 | 담당 역할 및 워크플로우 타임라인 |
| :--- | :--- |
| **`Orchestrator Agent`** | 전체 워크플로우 감독 및 가변 피드백 루브 제어. 사용자 되질문(Inquiry), 승인 트리거링 검출 배포 전담 피킹. |
| **`Analyzer Agent`** | 사용자의 AWS 인프라(도안/명세) 분석 ➡️ 탑재 인프라 체크리스트 부합 피드백 진단 후 결의 |
| **`Translator Agent`** | AWS 자원 식별 인덱스 ➡️ GCP 동급 최적 서비스 노드 사상(Mapping) JSON 정합성 하락 포매팅 산출 |
| **`Generator Agent`** | GCP 배포 대응 가능한 Terraform 소스코드 배출 및 유효성 self-healing 교정(Plan-Correction) |

---

## 4. 데이터 흐름 명세 (Sequence Data Flow)

### 4.1 전체 에이전트 추론 루프 (대화 및 승인 탑재)
1. **[사용자] 인프라 명세 전송**: `UploadPage` ➡️ `/run` POST JSON 송출
2. **[백엔드] Analyzer 인가**: AWS 청사진 분할 분석 ➡️ 추가 정보 필요 시 **Inquiry(되질문) 사출** ➡️ 프론트엔드 출력 ➡️ 사용자 입력 수용 반복
3. **[백엔드] Translator 사상**: `MappingItem[]` 대조 어레이 객체 정형화 리포팅
4. **[백엔드] HITL 정박 체인**: "최종 코드를 짤까요?" 관련 승인 배턴 메시지 스트림 전송
5. **[프론트] HITL 렌더링**: `MappingPage`에서 `awaitingApproval` 배너 스위치 켜짐 ➡️ 사용자 승인 확정 버튼 클릭 ➡️ 응답 `Yes, Approve.` 재송출
6. **[백엔드] Generator 사출**: 최종 만족 궤도 확산 및 Terraform HCL 단일 사출물 스트리밍

---

## 5. 통신 메시지 규격 (API Message Layout)

- **출력 정형 포맷 약정**:
  - 에이전트는 클라이언트 실시간 파싱 유도를 위해 각 동적 결과물을 마크다운 코드 가설(` ```json `, ` ```terraform `)로 안전 격리하여 응답 전송해야 하며, 프론트엔드 최상위 컨트롤러는 해당 스위칭 영역을 정규식으로 타격 가시 파싱한다.

---
*(문서 끝)*
