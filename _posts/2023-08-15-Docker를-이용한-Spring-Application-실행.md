---
title: Docker를 이용한 Spring Application 실행
categories: ["Spring"]
tags: ["Spring", "Docker", "Intellij"]
---

> 개발 환경은 Windows에서 WSL2를 이용하고 있습니다. Build Tool은 Gradle입니다.

저는 데스크탑과 랩탑을 번갈아가면서 사용하는데, 매번 개발 환경을 갖추기 귀찮아서 그냥 도커만 있으면 짠 하고 어플리케이션이 실행됬으면 했습니다.

## Dockerfile 작성

우선 Dockerfile을 작성하여 build를 해보겠습니다.

Docker docs 내용과 Spring docs 내용을 참고 했습니다.

[Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

[Multi-Stage Build](https://spring.io/guides/topicals/spring-boot-docker/#_multi_stage_build)

```Dockerfile
FROM eclipse-temurin:17 AS build
WORKDIR /app

COPY . /app
RUN chmod +x ./gradlew
RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon bootJar
RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*.jar)

FROM eclipse-temurin:17
ARG DEPENDENCY=/app/build/dependency
VOLUME /tmp

COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","com.example.something.HelloApplication"]
```

제가 작성한 내용에선 Docker 내에서 빌드 또한 같이 실행되도록 했습니다. 이 부분을 터미널에서 `./gradlew bootJar`를 실행한 뒤 도커 파일 내에는 실행하는 부분만 작성하셔도 됩니다. 저는 따로 터미널에서 실행하는게 귀찮아서 한번에 진행되도록 했습니다.

`RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon bootJar`이 부분에서 다운로드됬던 라이브러리들은 캐싱되어 저장됩니다. 변경 없이 여러번 실행할 때도 오랜 시간이 걸리지 않도록 했습니다.

`jar -xf ../libs/*.jar`로 jar 파일을 분할하는 이유은 이미지를 만들때 3개의 레이어로 나누어져, dependencies가 변경되지 않으면 첫번째 레이어 (from `Boot-INF/lib`)는 변하지 않아서 더 빠른 빌드가 가능합니다!

> Spring docs에는 위 Dockerfile을 작성할때, --mount 부분이 experimental feature라면서 주석을 넣으라고 하는데, docs에 나와있는걸 보니 정식으로 추가된 내용같습니다. [참고](https://docs.docker.com/build/guide/mounts/)


```sh
docker build --tag <name:tag> .
```

```log
$ docker build -t name:tag .
[+] Building 20.4s (15/15) FINISHED                                                  docker:default
 => [internal] load .dockerignore                                                              0.0s
 => => transferring context: 104B                                                              0.0s
 => [internal] load build definition from Dockerfile                                           0.1s
 => => transferring dockerfile: 616B                                                           0.0s
 => [internal] load metadata for docker.io/library/eclipse-temurin:17                          4.4s
 => [auth] library/eclipse-temurin:pull token for registry-1.docker.io                         0.0s
 => [internal] load build context                                                              0.2s
 => => transferring context: 72.90kB                                                           0.1s
 => [build 1/6] FROM docker.io/library/eclipse-temurin:17@sha256:24fc97f54edaa3f02ef5d97b23d6  0.0s
 => CACHED [build 2/6] WORKDIR /app                                                            0.0s
 => [build 3/6] COPY . /app                                                                    0.6s
 => [build 4/6] RUN chmod +x ./gradlew                                                         0.5s
 => [build 5/6] RUN --mount=type=cache,target=/root/.gradle ./gradlew --no-daemon bootJar     12.8s
 => [build 6/6] RUN mkdir -p build/dependency && (cd build/dependency; jar -xf ../libs/*.jar)  1.5s
 => CACHED [stage-1 2/4] COPY --from=build /app/build/dependency/BOOT-INF/lib /app/lib         0.0s
 => CACHED [stage-1 3/4] COPY --from=build /app/build/dependency/META-INF /app/META-INF        0.0s
 => CACHED [stage-1 4/4] COPY --from=build /app/build/dependency/BOOT-INF/classes /app         0.0s
 => exporting to image                                                                         0.0s
 => => exporting layers                                                                        0.0s
 => => writing image sha256:842038f0af834a77a23a34feafef560d6cee313a450c617411261d421606a608   0.0s
 => => naming to docker.io/name                                                                0.0s
```

Docker image를 빌드해봅시다. 아무 이상이 없었다면 넘어가도 좋습니다.

## docker-compose.yml 작성

저는 프로젝트에 Mysql과 Redis를 이용했습니다.

사실 Docker에서 데이터베이스를 이용하는 것은 적절하지 않지만, 저는 개발 환경에서 사용할 것이기 때문에 편하려고 넣었습니다. 

```yml
version: "3"

services:

  mysql:
    container_name: mysql
    image: mysql:8.1.0
    restart: unless-stopped
    ports:
      - "3306:3306"
    env_file:
      - .env
    volumes:
      - ./.volumes/mysql-data:/var/lib/mysql
    environment:
      TZ: Asia/Seoul"
      LC_ALL: C.UTF-8
      LANG: C.UTF-8
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_RANDOM_ROOT_PASSWORD: yes
    healthcheck:
      test: ["CMD", "mysqladmin" ,"ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10

  redis:
    container_name: redis
    image: redis:7.2.0-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - ./.volumes/redis-data:/data:rw
    healthcheck:
      test: ["CMD-SHELL", "redis-cli ping | grep PONG"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    container_name: app
    image: name:tag
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      SPRING_PROFILES_ACTIVE: dev
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
```

위에서 build할때 사용한 `name:tag`를 app의 `image:` 부분에 넣으시면 됩니다. 

database에 volumes을 설정하여 컨테이너가 재시작되더라도 계속 유지되도록 했습니다.

database의 restart 조건을 `unless-stopped`로 설정하여 개발 도중 앱을 다시 시작하더라도 데이터베이스는 다시 켜지지 않도록 했습니다.

database에 healthcheck을 걸어 app이 service가 healty한 이후에 실행되도록 했습니다. 이렇게 condition을 안걸면 컨테이너가 시작되고 db가 완전히 켜지는 사이에 앱이 켜저서 뻑날 가능성이 있습니다.. 

app에 environment로 `SPRING_PROFILES_ACTIVE`가 dev로 들어가 있는데, 이러면 dev profile이 활성되어 application-dev.yml을 활성화하게 됩니다. 저는 local에서 데이터베이스를 켰을 경우와 구분 짓기 위해 이렇게 했습니다.

Mysql의 user나 password, database name 같은 경우는 .env를 사용하여 관리했습니다.

## application-dev.yml을 도커에 맞게 설정

```yml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://mysql:3306/${MYSQL_DATABASE}
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}

  data:
    redis:
      url: redis
      port: 6379

# 이하 생략
```

Docker를 사용하기 때문에 url이 localhost가 아닌 container의 이름이 들어갑니다.

위에서 app의 environment로 `${}`의 값들을 넣어 주었기 때문에 따로 설정 안하셔도 잘 들어갑니다.

## application 실행

준비는 끝났습니다. 실행시켜보죠!

```sh
docker compose up -d
```