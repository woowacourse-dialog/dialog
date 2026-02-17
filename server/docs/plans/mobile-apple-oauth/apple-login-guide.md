# Apple 로그인 연동 가이드

## 개요

Dialog 서비스의 Apple Sign In 연동 가이드입니다.
iOS 앱에서 Apple 인증을 수행한 후, 서버 API를 통해 로그인/회원가입을 처리하는 전체 플로우를 설명합니다.

---

## 전체 플로우

```
┌─────────┐        ┌─────────┐        ┌─────────────┐
│  iOS App │        │  Server  │        │    Apple     │
└────┬────┘        └────┬────┘        └──────┬──────┘
     │                   │                     │
     │ 1. Apple Sign In                        │
     │─────────────────────────────────────────►│
     │              identityToken 발급           │
     │◄─────────────────────────────────────────│
     │                   │                     │
     │ 2. POST /api/auth/mobile/apple/login    │
     │ (identityToken 전송)                     │
     │──────────────────►│                     │
     │                   │ 3. JWKS로 토큰 검증   │
     │                   │────────────────────►│
     │                   │◄────────────────────│
     │                   │                     │
     │ 4-A. 기존 회원     │                     │
     │ isRegistered:true │                     │
     │◄──────────────────│                     │
     │ (세션 쿠키 발급)    │                     │
     │                   │                     │
     │ 4-B. 신규 사용자   │                     │
     │ isRegistered:false│                     │
     │◄──────────────────│                     │
     │ (세션에 OAuth 정보 임시 저장)             │
     │                   │                     │
     │ 5. POST /api/signup (신규만)             │
     │──────────────────►│                     │
     │ userId 반환       │                     │
     │◄──────────────────│                     │
```

---

## API 상세

### 1. Apple 로그인

Apple Identity Token을 서버에 전달하여 로그인을 시도합니다.

```
POST /api/auth/mobile/apple/login
Content-Type: application/json
```

#### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `identityToken` | String | O | Apple Sign In에서 발급받은 Identity Token (JWT) |
| `firstName` | String | X | 사용자 이름 (최초 로그인 시에만 Apple이 제공) |
| `lastName` | String | X | 사용자 성 (최초 로그인 시에만 Apple이 제공) |

```json
{
  "identityToken": "eyJraWQiOiJXNldjT09...",
  "firstName": "길동",
  "lastName": "홍"
}
```

> **참고**: `firstName`, `lastName`은 Apple이 **최초 1회만** 제공합니다.
> 이후 로그인에서는 전달되지 않으므로, 최초 로그인 시 반드시 서버로 전달해야 합니다.
> 값이 없으면 필드를 생략하거나 `null`로 보내면 됩니다.

#### Response - 기존 회원 (바로 로그인 완료)

```
HTTP/1.1 200 OK
Set-Cookie: JSESSIONID=abc123; Path=/; HttpOnly
```

```json
{
  "data": {
    "isRegistered": true,
    "userId": 123,
    "nickname": "홍길동"
  }
}
```

#### Response - 신규 사용자 (회원가입 필요)

```
HTTP/1.1 200 OK
Set-Cookie: JSESSIONID=xyz789; Path=/; HttpOnly
```

```json
{
  "data": {
    "isRegistered": false,
    "userId": null,
    "nickname": null
  }
}
```

#### 에러 응답

| 에러 코드 | HTTP Status | 메시지 | 설명 |
|-----------|-------------|--------|------|
| `1007` | 401 | 유효하지 않은 인증 토큰입니다. | Identity Token 검증 실패 (만료, 위조 등) |
| `1008` | 502 | 인증에 실패했습니다. 잠시 후 다시 시도해주세요. | Apple 인증 서버 통신 오류 |

```json
{
  "errorCode": "1007",
  "message": "유효하지 않은 인증 토큰입니다."
}
```

---

### 2. 회원가입 (신규 사용자만)

Apple 로그인 응답에서 `isRegistered: false`인 경우, 이 API를 호출하여 회원가입을 완료합니다.

> **중요**: 반드시 Apple 로그인 API 호출 시 발급받은 **동일한 세션 쿠키**(`JSESSIONID`)를 포함해야 합니다.
> 서버가 세션에 저장한 OAuth 정보를 사용하여 회원가입을 처리합니다.

```
POST /api/signup
Content-Type: application/json
Cookie: JSESSIONID=xyz789
```

#### Request Body

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `track` | String | O | 개발 트랙. `"BACKEND"`, `"FRONTEND"`, `"ANDROID"` 중 하나 |
| `webPushNotification` | boolean | O | 푸시 알림 수신 동의 여부 |

```json
{
  "track": "ANDROID",
  "webPushNotification": true
}
```

#### Response

```
HTTP/1.1 200 OK
```

```json
{
  "data": {
    "userId": 456
  }
}
```

#### 에러 응답

| 에러 코드 | HTTP Status | 메시지 | 설명 |
|-----------|-------------|--------|------|
| `1002` | 401 | 유효하지 않은 회원가입입니다. | 세션에 OAuth 정보가 없음 (세션 만료 또는 로그인 미수행) |
| `5033` | 400 | 이미 회원가입한 회원입니다. | 이미 가입 완료된 사용자 |

---

### 3. 로그인 상태 확인

세션 쿠키로 현재 로그인 상태를 확인합니다.

```
GET /api/login/check
Cookie: JSESSIONID=abc123
```

#### Response

```json
{
  "data": {
    "isLoggedIn": true
  }
}
```

---

### 4. 로그아웃

```
DELETE /api/logout
Cookie: JSESSIONID=abc123
```

세션을 무효화하고 쿠키를 삭제합니다.

---

## iOS 구현 가이드

### 1단계: Apple Sign In 수행

```swift
// Apple Sign In 요청
let request = ASAuthorizationAppleIDProvider().createRequest()
request.requestedScopes = [.fullName, .email]

let controller = ASAuthorizationController(authorizationRequests: [request])
controller.delegate = self
controller.performRequests()
```

### 2단계: 서버로 토큰 전송

```swift
func authorizationController(controller: ASAuthorizationController,
                              didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let identityTokenData = credential.identityToken,
          let identityToken = String(data: identityTokenData, encoding: .utf8) else {
        return
    }

    let body: [String: Any?] = [
        "identityToken": identityToken,
        "firstName": credential.fullName?.givenName,
        "lastName": credential.fullName?.familyName
    ]

    // POST /api/auth/mobile/apple/login 호출
}
```

### 3단계: 응답 처리

```swift
// 로그인 응답 처리
if response.data.isRegistered {
    // 기존 회원 → 메인 화면으로 이동
    // JSESSIONID 쿠키가 자동 저장됨 (URLSession 사용 시)
} else {
    // 신규 사용자 → 회원가입 화면으로 이동
    // track 선택 후 POST /api/signup 호출
}
```

---

## 세션 관리

- 서버는 **세션 기반 인증**을 사용합니다.
- 로그인 성공 시 `Set-Cookie: JSESSIONID=...` 헤더가 응답에 포함됩니다.
- 이후 모든 API 요청에 이 쿠키를 포함해야 합니다.
- `URLSession`을 사용하면 `HTTPCookieStorage`를 통해 쿠키가 자동으로 관리됩니다.
- 앱 재시작 시 쿠키 유지를 위해 `URLSessionConfiguration.default`를 사용하세요.

```swift
// URLSession 기본 설정 시 쿠키 자동 관리
let session = URLSession(configuration: .default)
```

---

## 주의 사항

1. **firstName/lastName은 최초 1회만 전달됨**
   - Apple은 사용자가 앱에 **처음 로그인할 때만** 이름 정보를 제공합니다.
   - 이후 로그인에서는 이 값이 `nil`이므로, 최초 로그인 시 반드시 서버로 전달해야 합니다.
   - 테스트 시 Apple ID 설정 > 로그인 및 보안 > Apple로 로그인에서 앱을 제거하면 다시 이름이 전달됩니다.

2. **세션 쿠키 유지 필수**
   - Apple 로그인 → 회원가입은 **동일한 세션** 내에서 이루어져야 합니다.
   - 로그인 API 호출과 회원가입 API 호출 사이에 세션이 끊기면 `1002` 에러가 발생합니다.

3. **Identity Token 만료**
   - Apple Identity Token은 발급 후 약 5분간 유효합니다.
   - 발급 후 즉시 서버로 전달해야 합니다.

4. **에러 코드 `1008` 대응**
   - Apple 인증 서버 장애 시 발생합니다.
   - 사용자에게 재시도를 안내하고, 일정 시간 후 다시 시도하도록 구현하세요.
