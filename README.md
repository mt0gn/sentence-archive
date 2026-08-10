# 문장보관소

문장을 편집하고 다양한 레이아웃의 이미지·텍스트로 내보내는 브라우저 기반 발췌 편집기입니다.

- 서버와 외부 AI 없이 브라우저에서 동작합니다.
- 프로젝트와 디자인은 사용자의 브라우저에 저장됩니다.
- GitHub Pages에 무료로 배포할 수 있습니다.
- `main` 브랜치에 변경 사항을 올리면 GitHub Actions가 사이트를 자동 갱신합니다.

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run dev
```

개발 화면은 터미널에 표시되는 주소에서 확인할 수 있습니다.

## GitHub Pages 배포

1. 이 프로젝트를 GitHub 저장소에 올립니다.
2. 저장소의 **Settings → Pages**로 이동합니다.
3. **Build and deployment → Source**를 **GitHub Actions**로 선택합니다.
4. `main` 브랜치에 코드를 올립니다.
5. 저장소의 **Actions** 탭에서 `Deploy 문장보관소 to GitHub Pages` 작업이 끝나면 배포 주소가 생성됩니다.

일반 저장소라면 주소는 다음 형태입니다.

```text
https://사용자명.github.io/저장소명/
```

저장소 이름이 `사용자명.github.io`라면 주소는 다음 형태입니다.

```text
https://사용자명.github.io/
```

저장소 이름에 맞는 경로는 빌드할 때 자동으로 설정됩니다.

## 배포 후 수정

배포 이후에도 기능을 계속 추가하거나 수정할 수 있습니다.

1. 소스 코드를 수정합니다.
2. 변경 사항을 `main` 브랜치에 올립니다.
3. GitHub Actions가 새 버전을 자동으로 빌드하고 같은 주소에 배포합니다.

사이트 주소는 저장소 이름을 바꾸거나 Pages 설정을 해제하지 않는 한 유지됩니다.

## 명령어

| 명령어 | 용도 |
|---|---|
| `npm run dev` | 개발 화면 실행 |
| `npm run build:github` | GitHub Pages용 정적 사이트 생성 |
| `npm run build` | 기존 Sites 배포용 빌드 |
| `npm run lint` | 코드 검사 |

GitHub Pages용 결과물은 `out/` 폴더에 생성되며 저장소에는 포함하지 않습니다.
