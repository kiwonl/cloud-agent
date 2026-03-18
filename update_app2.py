import re

with open('frontend/src/App.tsx', 'r') as f:
    content = f.read()

# Fix App.tsx to correctly handle 4 steps but show in tabs
old_logic = r'// 🛡️ \[수정\] 분석 보고서 형식을 갖춘 경우\(헤더 포함\) 무조건 분석 페이지로 이동합니다\..*?// 2\. Terraform HCL Extraction'

new_logic = """// 🛡️ [수정] 4단계 워크플로우에 맞춘 네비게이션
          if (cleanText.includes("### 📊") || cleanText.includes("### 🌐")) {
            // Step 1: 분석 결과 도착
            setAnalysisReport(cleanText);
            setActivePage('analysis');
            navigated = true;
          } else if (hasChecklistData) {
            // Step 2: 체크리스트 데이터 도착
            // AnalysisPage 내부의 Checklist 탭에서 볼 수 있도록 설정
            setActivePage('analysis'); 
            navigated = true;
          }

          // 2. Terraform HCL Extraction"""

content = re.sub(old_logic, new_logic, content, flags=re.DOTALL)

with open('frontend/src/App.tsx', 'w') as f:
    f.write(content)
