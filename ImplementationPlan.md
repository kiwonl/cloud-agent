# 📅 향후 추가 개발 로드맵 및 구현 플랜 (Backlog Plan)

본 문서는 `SRS.md` 및 `ADS.md` 스펙 대비 현재 가동 중인 시스템 아키텍처에서 고도화 및 보완이 필요한 **추가 개발 과제들을 체크리스트 형태로 가시화**한 개발 로드맵입니다.

---

## 1. 프론트엔드 고도화 과제 (Frontend Layouts)

### 1.1 🖼️ 이미지(아키텍처 도안) 주입 및 멀티모달 연전
- [ ] **[Backlog: FE-01] 업로드 파일의 Base64 인코딩 파이프라인**: 
  - `UploadPage`에서 드래그 앤 드롭한 이미지(PNG/JPG) 파일을 바이너리 버퍼로 캡처 후 백엔드 `/run` API 전송 페이로드로 정형화 이관.
- [ ] **[Backlog: FE-02] 가시 프리뷰 노드 모듈**:
  - 주입된 이미지 프리뷰를 화면 한쪽에 고정하여 분석 트래킹 시 시각 대조 환경 유지.

### 1.2 💬 되질문(Inquiry) 전용 대화형 UI/UX 전개
- [ ] **[Backlog: FE-03] 중첩 대화 이력 오버헤드 패키지**:
  - 현재 단일 Analytic 인덱스로 구성된 피드를 단일 채팅 컴포넌트(`Floating Chat Bubble` 혹은 대화 카드 레이어)로 분기하여 에이전트의 "추가 질의" 발생 시 답변을 가동 응답하는 대화 플로우 활성화.

---

## 2. 백엔드 ADK 에이전트 고도화 과제 (Backend Multi-Agent)

### 2.1 🧠 멀티모달 추론 피드백 인프라 구성
- [ ] **[Backlog: BE-01] 이미지 파싱 프롬프트 최적화**:
  - 에이전트 주입망에서 Computer Vision 추론망을 활성화하여 AWS EC2, S3 아이콘 인식 및 VPC 바운더리 마커 추출 정합성 향상.

### 2.2 🛡️ 테라폼 자가 치유(Self-Healing) 파이프라인 탑재
- [ ] **[Backlog: BE-03] `terraform validate` 자동 루프 가동**:
  - Generator 에이전트가 코드를 사출한 후, 셸 실행 도구를 호출하여 `terraform init/validate`를 고속 가동하고 오류 발생 시 에이전트에게 자동 피드백하여 self-correction을 3회 반복 실행하는 인공지능 자가복구형 모듈 탑재.

### 2.3 📋 구조 정형화 결산 가이드 강화
- [ ] **[Backlog: BE-04] JSON Output 파이프라인 강제화(Structured Output)**:
  - 에이전트 프롬프트에 `Pydantic BaseModel` 기반 구조화 출력을 수용하여 프론트엔드 파서 체인의 `.replace()` 리스크 절대 방지.

---

## 3. 데브옵스 및 인프라 과제 (DevOps & Environment)

- [ ] **[Backlog: DO-01] Vite 프록시(`vite.config.ts`) 탑재**:
  - `http://localhost:8000/run` 직접 하결로 연동된 코드를 `/api/run` 포워딩 프록시로 이전하여 CORS 부작용 원천 차단.
- [ ] **[Backlog: DO-02] 아키텍처 명세 `.env` 롤라웃 고속화**:
  - 백엔드 LLM 모델 엔드포인트 세팅을 다변화하여 GCP뿐 아니라 Azure 타겟 룰 엔진 확장 준비.

---
*(문서 끝)*
