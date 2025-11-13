# 🔄 세션 상태 자동 저장 시스템

Claude Code 세션이 끊겨도 작업 내역을 기억할 수 있도록 상태를 자동으로 저장합니다.

## 📁 파일 설명

1. **`.catus_session.json`** - 현재 작업 상태를 JSON 형태로 저장
2. **`update_session.py`** - 세션 상태를 업데이트하는 스크립트
3. **`.git/hooks/post-commit`** - Git 커밋 시 자동으로 상태 업데이트

## 🚀 사용 방법

### 1. 현재 상태 확인

```bash
python update_session.py --show
```

### 2. 작업 완료 표시

```bash
# 작업 완료 시
python update_session.py --task "Gemini API 연동 완료"

# 여러 항목 동시 업데이트
python update_session.py --task "Chat API 구현" --phase "Phase 3" --status "진행 중"
```

### 3. 다음 할 일 추가

```bash
python update_session.py --next "감정 분석 기능 구현"
```

### 4. 문제 상황 기록

```bash
python update_session.py --issue "Docker 컨테이너가 자꾸 중단됨"
```

### 5. 메모 추가

```bash
python update_session.py --note "Gemini API 키 발급 필요"
```

### 6. 환경 상태 업데이트

```bash
# Docker 상태
python update_session.py --docker running
python update_session.py --docker stopped

# 빌드 상태
python update_session.py --build success
python update_session.py --build failed
```

## 🤖 Claude Code와 함께 사용하기

Claude Code가 새로운 세션으로 시작할 때:

```
"C:\Users\hoonl\dev\Catus_Backend\.catus_session.json 파일을 읽고 이전 작업 내역을 확인해줘"
```

이렇게 요청하면 Claude가 자동으로:
- 이전까지 완료된 작업 확인
- 현재 진행 중인 Phase 확인
- 다음에 해야 할 작업 확인
- 막혔던 문제점 확인

## 📊 세션 파일 구조

```json
{
  "last_updated": "2025-11-11T00:30:00",
  "session_number": 5,
  "current_phase": "Phase 3 - Chat & AI Integration",
  "current_status": "In Progress",
  "completed_tasks": [
    "Phase 1 완료",
    "Phase 2 완료",
    "Gemini API 연동 완료"
  ],
  "current_task": "감정 분석 구현 중",
  "next_steps": [
    "Chat API 테스트",
    "Rate limiting 구현"
  ],
  "blocking_issues": [
    {
      "issue": "API 키 발급 대기 중",
      "reported_at": "2025-11-11T00:15:00"
    }
  ],
  "notes": "Gemini API는 무료 tier 사용 (60 req/min)"
}
```

## 🔄 자동 업데이트 (Git Hook)

Git 커밋 시 자동으로 세션 상태가 업데이트됩니다:

```bash
git add .
git commit -m "feat: Gemini API 연동 구현"
# → 자동으로 update_session.py 실행됨
```

Windows에서 git hook이 작동하지 않으면:

```bash
# 수동으로 업데이트
python update_session.py --task "Committed: feat: Gemini API 연동 구현"
```

## 💡 팁

### Claude가 끊긴 후 재시작할 때

```
.catus_session.json 파일 읽고 요약해줘.
어디까지 했고, 다음에 뭐 해야 하는지 알려줘.
```

### 작업 전에 상태 저장

```bash
python update_session.py --current "Gemini API 연동 시작" --note "공식 문서: https://ai.google.dev/tutorials/python_quickstart"
```

### 작업 후에 상태 저장

```bash
python update_session.py --task "Gemini API 연동 완료" --next "감정 분석 구현" --build success
```

## 🎯 Phase별 체크리스트와 함께 사용

1. Phase 시작 시:
   ```bash
   python update_session.py --phase "Phase 3" --status "시작" --current "Gemini API 연동"
   ```

2. 작업 진행 중:
   ```bash
   python update_session.py --task "GeminiService 클래스 생성" --build success
   ```

3. Phase 완료 시:
   ```bash
   python update_session.py --phase "Phase 3" --status "완료 ✅" --note "Gemini, Chat API, 감정 분석 모두 완료"
   ```

## 🔍 문제 해결

### 스크립트 실행 안됨

```bash
# Python 설치 확인
python --version

# 파일 존재 확인
ls .catus_session.json
ls update_session.py
```

### JSON 파일이 손상됨

```bash
# 백업에서 복구 (Git에 커밋되어 있음)
git checkout .catus_session.json
```

## 📚 관련 파일

- `Catus_Backend_PRD.md` - 전체 프로젝트 요구사항
- `CATUS_작업현황.md` - 전체 로드맵
- `.catus_session.json` - 실시간 세션 상태 (자동 생성)
- `PHASE2_IMPLEMENTATION_SUMMARY.md` - Phase 2 구현 상세 내역

---

**다음 세션에서 Claude에게 보여줄 내용:**

```
C:\Users\hoonl\dev\Catus_Backend\.catus_session.json 파일을 읽고:
1. 지금까지 완료된 작업
2. 현재 진행 중인 Phase와 작업
3. 다음에 할 일
4. 막혔던 문제점
을 요약해서 알려줘. 그리고 다음 작업을 계속 진행하자.
```
