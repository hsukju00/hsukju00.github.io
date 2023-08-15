---
title: Docker를 이용한 Spring Application 실행
categories: ["Spring", "Docker"]
tags: ["Spring", "Docker", "Intellij"]
---

개발 환경은 Windows에서 WSL2를 이용하고 있습니다. Build Tool은 Gradle입니다.

보통의 어플리케이션은 데이터베이스를 사용하고, 어플리케이션을 시작하기 위해선 따로 로컬에서 데이터베이스를 실행해야 합니다.
일련의 과정들이 귀찮아서, 도커를 적용하기로 했습니다.

# Dockerfile 작성

우선 Dockerfile을 작성하여 build를 해보겠습니다.

Docker docs 내용과 Spring docs 내용을 참고 했습니다.

[Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

[Multi-Stage Build](https://spring.io/guides/topicals/spring-boot-docker/#_multi_stage_build)

```Dockerfile
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /workspace/app

COPY . /workspace/app
RUN --mount=type=cache,target=/root/.gradle ./gradlew clean build -x test
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*-SNAPSHOT.jar)

FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/build/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","YourApplicaiton"]
```

위처럼 작성하는 이유는
1. gradle을 통해 Build한 라이브러리들을 cache하여 매번 다운로드 받지 않기 위해
2. 3개의 layer로 나누어 application resources를 변경하더라도 application dependencies가 변경되지 않았다면 해당 layer는 다시 빌드하지 않아 빌드가 빨라지기 때문에

test를 진행하면 database connection 실패로 build가 안됩니다. 따라서 build -x test를 이용하여 test를 제외했습니다. 

이는 나중에 testcontainers를 이용하여 테스트를 진행하는 방법을 포스팅해보겠습니다.

> YourApplication이 들어가는 부분엔 src/main에 존재하는 @SpringApplicationApplication class의 패키지 이름과 class 이름을 적어넣으시면 됩니다. ex: com.example.api.YourApplication

> Spring docs에는 위 Dockerfile을 작성할때, --mount 부분이 experimental feature라면서 주석을 넣으라고 하는데, docs에 나와있는걸 보니 정식으로 추가된 내용같습니다. [참고](https://docs.docker.com/build/guide/mounts/)


```sh
docker build .
```

Docker image를 빌드해봅시다. 아무 이상없이 실행됬다면 넘어가면 되겠습니다.

# docker-compose를 이용한 Docker application 실행

## docker-compose.yml 작성

저는 프로젝트에 Mysql과 Redis를 이용했습니다.

```yml
version: "3"

services:

  mysql:
    container_name: mysql
    image: mysql:latest
    ports:
      - "3306:3306"
    networks:
      - my-network
    restart: unless-stopped
    environment:
      TZ: Asia/Seoul
      LC_ALL: C.UTF-8
      LANG: C.UTF-8
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: hsukju
    healthcheck:
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    container_name: redis
    image: redis:latest
    ports:
      - "6379:6379"
    networks:
      - my-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      interval: 5s
      timeout: 3s
      retries: 10


  server:
    container_name: server
    build:
      context: .
      dockerfile: ./Dockerfile
    ports:
      - "8080:8080"
    networks:
      - my-network
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy

networks:
  my-network:

```

restart 조건을 unless-stoped로 설정하여 중간에 재시작을 하더라도 database는 유지되도록 했습니다.
또한 healtycheck을 걸어줘야 server가 database가 완전히 켜진 뒤에 시작됩니다. (mysql이 container가 만들어지고 이후 켜지는게 느려서 꼭 걸어주셔야 합니다.)

## application.yml을 도커에 맞게 설정

```yml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://mysql:3306/hsukju
    username: root
    password: root

  data:
    redis:
      url: redis
      port: 6379
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        show_sql: true
        format_sql: true

```

여기서 중요한 점은 Docker 내의 database에 접근해야하기 때문에 url에 container 이름이 들어간다는 점입니다.

## application 실행

준비는 끝났습니다. build와 동시에 실행해보겠습니다.

```sh
docker-compose up --build -d
```

![Build success](/assets/img/1.png)

terminal을 통해 실행이 잘 된것을 확인할 수 있습니다.

![Docker desktop](/assets/img/2.png)

docker desktop을 이용하여 실행이 잘 되었는지도 확인이 가능합니다.

![Access with Chrome](/assets/img/3.png)

또한 localhost:8080에 접속이 잘 되는지도 확인했습니다! 

# Intellij에서의 실행

Intellij는 docker-compose.yml을 통한 실행을 지원해줍니다.

![Edit configuration](/assets/img/4.png)

대신 수정을 하고 재시작할때 재 build를 원한다면 Run > Edit Configuration...에서 build를 Always로 변경해주시면 됩니다.

# 결론

이 방법은 어느 시스템에서나 도커만 설치되어있다면 원클릭으로 어플리케이션을 실행할 수 있도록 해줍니다..
도커는 알수록 신기한 것 같습니다.