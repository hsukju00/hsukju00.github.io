---
title: WSL terminal에서 IntelliJ를 실행하는 방법
categories: ["Settings"]
tags: ["WSL", "Intellij"]
---

오늘은 WSL terminal로 Intellij 프로젝트를 실행하는 방법을 알아보자!

vscode는 설치 이후 terminal에서 `code .`만 입력해도 자동으로 home directory에 `.vscode-server`가 설치되며
해당 directory가 vscode로 열리게 되는데 아직 Intellij는 자동화가 안되있는듯 하다.

## 선행 작업

먼저 Intellij를 환경 변수에 등록해주어야 한다.

만약 powershell에서 `idea64.exe .`가 실행이 가능하다면 이미 등록이 되있는 것이다. 그렇다면 이 작업을 넘어가도 된다.

Intelli에서 위 메뉴에서 `Tools > Create Command-line Launchar`를 누르면 어떤 경로의 directory를 추가해야 하는지 알려준다. 각 사용자마다 Intellij 버전이 다르고 저장 위치가 다르니까 한번 확인해주고 이를 환경 변수에 등록해주자.

이후 wsl내에서 `idea64.exe .`를 실행해보자. Windows의 환경 변수 또한 wsl에 바로 추가되기 때문에 실행이 바로 가능하다.
만약 작동하지 않는다면 terminal을 한번 재시작하면 된다.

## Alias 등록

실행할 때마다 64니 확장자니 치기엔 우리의 손은 한가하지 않다.

```bash
alias idea="idea64.exe"
```

위 코드를 bash를 사용한다면 `.bashrc`, zsh를 사용한다면 `.zshrc`에 추가해주자.

간단한 명령어인 `idea .`만으로도 해당 directory의 프로젝트가 열리는 걸 볼 수 있다.

이제 열심히 코딩을 해보자!