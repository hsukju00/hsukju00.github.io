---
title: next.js 14 server actions, 어떻게 돌아가는걸까?
categories: ["next.js"]
tags: ["next.js", "server actions"]
---

이번에 next.js 14버전이 출시하면서 experimental features 중 하나였던 server actions가 정식으로 편입됬다.
이제 API Route를 구현하는 것을 넘어서 components 내에 선언한 함수를 호출하여 backend 작업을 하겠다는 얘기다.
심지어 이렇게 구현된 server actions는 브라우저에서 javascript를 비활성화 하더라도 작동이 가능하다. ~~뭐?!~~

어떻게 가능한지 빨리 알아보도록 하자!

## RPC Endpoint

먼저 RPC에 대해 알아보자. RPC는 `Remote Procedure Call`의 약자로 원격 프로시저 호출을 의미하는데
간단하게 설명하자면 "다른 주소 공간에서 함수나 프로시저를 실행할 수 있게 해주는 프로세스간 통신 기술"을 말한다.

이러한 RPC 패턴과 server action은 매우 유사하다.

먼저 `"use server"`가 포함된 함수들은 next.js가 자동으로 유니크한 40자리의 문자열을 만들어낸다.
이후 서버에선 해당 문자열과 함수들을 매칭시킨 map을 가지고 있고, 현재 주소로 `POST`요청이 들어오면 action의 유니크한 문자열을
읽어 해당 코드를 실행해주는 endpoint를 만들어낸다. (이것이 RPC Endpoint!)

이후 해당 action이 실행되면 현 주소에 `POST`요청을 보내며 Request Header에 `Next-Action`이라는 header에 유니크한 문자열을
담아 요청하는 것이다. HTTP request이기 때문에 코드가 실행될 필요가 전혀 없는 것이다.

<img src="/assets/img/server_action.png" alt="server action example" />
> 아무것도 하지 않는 server action을 하나 만들어 테스트 해보았다. <br />
> Submit 버튼을 누르자 /test에 `POST`요청이 날아가고 Header에 Next-ACtions가 포함된 것이 보인다.

## PHP의 복귀?

사실 이러한 방식은 예전에 웹 시장을 지배했던 PHP의 코드와 상당히 유사하다고 한다.

<img src="https://media.licdn.com/dms/image/D5622AQEQGp59S2jaMA/feedshare-shrink_800/0/1698555687988?e=1703116800&v=beta&t=eWzpiJlR0yVKzNd-BXcySClZ3O7RzRt6VGk3qF8bSro" alt="nextjs 14 발표 현장" />

위는 next.js의 14버전이 발표될 때 나온 코드이다. html 내에서 sql 구문을 실행하는 server action을 보여줬는데 이에 대해 사람들은
next.js가 새로운 버전의 PHP가 아니냐는 말이 많다.

개인적인 생각으로는 개발 트렌드가 애자일해지고, 적은 수의 개발자로 큰 효율을 내기 위해 SSR로 시장이 점점 옮겨가면서
다시금 이러한 방식이 나오지 않았나 생각이 든다.

## 보안적인 문제는 없을까..

{% include embed/youtube.html id="8wfeIXahttg" %}
{% include embed/youtube.html id="fdKcbyEK66M" %}

사실 여려 영상에서 보안적인 문제를 걱정하고 있다. 사실 보안에 대해 구체적으로 알지 못해서 어떠한 문제점이 있는지, 정말 그러한 문제점이 유효한지
판단하지 못했지만 많은 개발자들이 걱정하고 있고, 이를 인지하고 사용해야 함은 분명해보인다.

> 추가적으로 model 1 방식으로 회귀하면서 발생할 유지보수에 대한 걱정을 하는 댓글도 많이 보인다.. <br />
> 너무나도 핫한 next.js.. 과연 어떻게 될까?.

## 참조

[Server Actions docs](https://nextjs.org/docs/app/api-reference/functions/server-actions) <br />
[The simplest example to understand Server Actions in Next.js](https://scastiel.dev/simplest-example-server-actions-nextjs)
