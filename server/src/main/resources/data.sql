INSERT INTO users (user_id, nickname, track, web_push_notification, created_at, modified_at, is_deleted)
VALUES (1, '김개발','BACKEND', true, NOW(), NOW(), false),
       (2, '홍길동','BACKEND', false, NOW(), NOW(), false),
       (3, '박코딩','FRONTEND', true, NOW(), NOW(), false),
       (4, '한스','FRONTEND', true, NOW(), NOW(), false),
       (5, '다로','FRONTEND', false, NOW(), NOW(), false),
       (6, '밍곰','BACKEND', true, NOW(), NOW(), false),
       (7, '히포','ANDROID', true, NOW(), NOW(), false),
       (8, '서프귀여워','ANDROID', false, NOW(), NOW(), false),
       (9, '차니','BACKEND', true, NOW(), NOW(), false)
;

-- 오프라인 토론 완료 상태 (과거)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (100, '모바일 UX 설계 전략', '이 주제에 대한 경험과 전략을 토론합니다.',
        'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (100, DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
        '구글 미트', 3, 10);

INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (101, '대규모 트래픽 처리 전략', '각자의 관점을 공유해 주세요.',
        'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (101, DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 3 HOUR,
        '온라인 줌 미팅', 5, 5);

-- 오프라인 토론 중 상태 (현재 진행중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (102, '모바일 UX 설계 전략', '각자의 관점을 공유해 주세요.',
        'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (102, DATE_SUB(NOW(), INTERVAL 1 HOUR),
        DATE_ADD(NOW(), INTERVAL 1 HOUR),
        '온라인 게더타운', 2, 8);

INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (103, '실시간 채팅 구현 전략', '각자의 관점을 공유해 주세요.',
        'ANDROID', '실시간 채팅 구현 전략에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (103, DATE_SUB(NOW(), INTERVAL 30 MINUTE),
        DATE_ADD(NOW(), INTERVAL 90 MINUTE),
        '디스코드 채널', 2, 8);

-- 오프라인 모집 완료 상태 (시작 전이지만 정원 마감)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (104, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (104, DATE_ADD(NOW(), INTERVAL 2 HOUR),
        DATE_ADD(NOW(), INTERVAL 4 HOUR),
        '카페 모임', 9, 9);

INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (105, 'CI/CD 구축 사례', '이 주제에 대한 경험과 전략을 토론합니다.',
        'ANDROID', 'CI/CD 구축 사례에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (105, DATE_ADD(NOW(), INTERVAL 6 HOUR),
        DATE_ADD(NOW(), INTERVAL 8 HOUR),
        '회사 회의실', 5, 5);

-- 오프라인 모집 중 상태 (미래 시작, 정원 미달)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (106, 'AI 도구를 활용한 생산성 향상', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'FRONTEND', 'AI 도구를 활용한 생산성 향상에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (106, DATE_ADD(NOW(), INTERVAL 1 DAY),
        DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR,
        '구글 미트', 2, 10);

INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (107, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (107, DATE_ADD(NOW(), INTERVAL 2 DAY),
        DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 2, 10);

-- 온라인 토론 (토론 중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (108, '협업 툴의 선택 기준', '각자의 관점을 공유해 주세요.',
        'BACKEND', '협업 툴의 선택 기준에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 5 MINUTE), NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (108, DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY));

-- 오프라인 토론들 (과거)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (109, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'BACKEND', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 12 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (109, DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 2 HOUR,
        '온라인 줌 미팅', 6, 6);

INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (110, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 18 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (110, DATE_SUB(NOW(), INTERVAL 15 DAY),
        DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 3 HOUR,
        '디스코드 채널', 7, 7);

-- 오프라인 미래 모집 중 토론들
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (111, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (111, DATE_ADD(NOW(), INTERVAL 5 DAY),
        DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
        '온라인 게더타운', 2, 9);

-- 온라인 토론 (토론 중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (112, 'GraphQL 활용기', '개선 경험과 효과를 나눠주세요.',
        'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (112, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY));

-- 오프라인 미래 모집 완료 상태
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (113, '대규모 트래픽 처리 전략', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (113, DATE_ADD(NOW(), INTERVAL 4 DAY),
        DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 7, 7);

-- 오프라인 최신 게시글들 (방금 등록)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (114, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        NOW() - INTERVAL 5 MINUTE, NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (114, DATE_ADD(NOW(), INTERVAL 8 DAY),
        DATE_ADD(NOW(), INTERVAL 8 DAY) + INTERVAL 2 HOUR,
        '카페 모임', 3, 7);

-- 온라인 토론 (완료)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (115, '클린 아키텍처 적용기', '각자의 관점을 공유해 주세요.',
        'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        NOW() - INTERVAL 2 MINUTE, NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (115, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));

-- 온라인 토론 (토론 중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (116, 'iOS와 Android 비교', '각자의 관점을 공유해 주세요.',
        'COMMON', 'iOS와 Android 비교에 대한 경험과 의견 공유', 3,
        NOW() - INTERVAL 1 MINUTE, NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (116, DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY));

-- 오프라인 가장 최신 게시글
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (117, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'FRONTEND', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        NOW(), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (117, DATE_ADD(NOW(), INTERVAL 10 DAY),
        DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 3, 10);

-- 온라인 토론 (토론 중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (118, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        'COMMON', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 1,
        NOW() + INTERVAL 30 SECOND, NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (118, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY));

-- 온라인 토론 (토론 중)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (119, '대규모 트래픽 처리 전략', '개선 경험과 효과를 나눠주세요.',
        'FRONTEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        NOW() + INTERVAL 1 MINUTE, NOW(), NULL);

INSERT INTO online_discussions (discussion_id, end_date)
VALUES (119, DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY));

-- 오프라인 토론 중 상태
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (120, '마이크로서비스 아키텍처 설계', '실제 도입 경험과 장단점을 공유해봅시다.',
        'BACKEND', '마이크로서비스 아키텍처 설계에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NULL);

INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (120, DATE_SUB(NOW(), INTERVAL 45 MINUTE),
        DATE_ADD(NOW(), INTERVAL 75 MINUTE),
        '온라인 줌 미팅', 4, 8);

-- 참가자 데이터 (오프라인 토론만)
INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (100, 1, NOW(), NOW()),
       (100, 2, NOW(), NOW()),
       (100, 3, NOW(), NOW()),
       (101, 1, NOW(), NOW()),
       (101, 2, NOW(), NOW()),
       (101, 3, NOW(), NOW()),
       (102, 1, NOW(), NOW()),
       (102, 2, NOW(), NOW()),
       (103, 1, NOW(), NOW()),
       (103, 2, NOW(), NOW()),
       (104, 1, NOW(), NOW()),
       (104, 2, NOW(), NOW()),
       (104, 3, NOW(), NOW()),
       (105, 1, NOW(), NOW()),
       (105, 3, NOW(), NOW()),
       (106, 2, NOW(), NOW()),
       (106, 3, NOW(), NOW()),
       (107, 1, NOW(), NOW()),
       (107, 3, NOW(), NOW()),
       (109, 2, NOW(), NOW()),
       (109, 3, NOW(), NOW()),
       (110, 2, NOW(), NOW()),
       (111, 1, NOW(), NOW()),
       (111, 3, NOW(), NOW()),
       (113, 2, NOW(), NOW()),
       (113, 3, NOW(), NOW()),
       (114, 1, NOW(), NOW()),
       (114, 2, NOW(), NOW()),
       (114, 3, NOW(), NOW()),
       (117, 1, NOW(), NOW()),
       (117, 2, NOW(), NOW()),
       (117, 3, NOW(), NOW()),
       (120, 1, NOW(), NOW()),
       (120, 3, NOW(), NOW()),
       (120, 4, NOW(), NOW())
       ;

-- participant_count 업데이트 (오프라인 토론만)
UPDATE offline_discussions SET participant_count = 3 WHERE discussion_id = 100;
UPDATE offline_discussions SET participant_count = 3 WHERE discussion_id = 101;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 102;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 103;
UPDATE offline_discussions SET participant_count = 3 WHERE discussion_id = 104;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 105;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 106;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 107;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 109;
UPDATE offline_discussions SET participant_count = 1 WHERE discussion_id = 110;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 111;
UPDATE offline_discussions SET participant_count = 2 WHERE discussion_id = 113;
UPDATE offline_discussions SET participant_count = 3 WHERE discussion_id = 114;
UPDATE offline_discussions SET participant_count = 3 WHERE discussion_id = 117;
UPDATE offline_discussions SET participant_count = 4 WHERE discussion_id = 120;

-- 토론 댓글 데이터
INSERT INTO discussion_comments (discussion_comment_id, content, discussion_id, author_id, parent_discussion_comment_id, created_at, modified_at, deleted_at)
VALUES
-- 토론 100번 댓글 (모바일 UX 설계 전략)
(1, '모바일 UX에서 가장 중요한 것은 직관적인 인터페이스라고 생각합니다. 특히 터치 영역의 크기와 배치가 핵심이죠.', 100, 1, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NULL),
(2, '저도 동감입니다. 또한 로딩 시간 최적화도 UX에 큰 영향을 미치는 것 같아요.', 100, 2, 1, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 30 MINUTE, NOW(), NULL),
(3, '반응형 디자인과 네이티브 앱의 차이점도 고려해야 할 요소인 것 같습니다.', 100, 6, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 1 HOUR, NOW(), NULL),

-- 토론 101번 댓글 (대규모 트래픽 처리 전략)
(4, '대규모 트래픽 처리에는 캐싱 전략이 정말 중요하다고 생각합니다. Redis를 활용한 경험이 있으신가요?', 101, 6, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NULL),
(5, '네, Redis 외에도 CDN 활용도 고려해볼 만하죠. 특히 정적 리소스들은 CDN으로 분산시키면 효과적입니다.', 101, 2, 4, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 45 MINUTE, NOW(), NULL),
(6, '로드 밸런싱과 오토 스케일링도 빼놓을 수 없는 요소네요.', 101, 9, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 HOUR, NOW(), NULL),
(7, '데이터베이스 샤딩도 고려해보셨나요? 트래픽이 많아지면 필수적인 것 같아요.', 101, 1, 6, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR, NOW(), NULL),

-- 토론 102번 댓글 (모바일 UX 설계 전략 - 현재 진행중)
(8, '진행 중인 토론이네요! 실시간으로 의견 나누기 좋겠어요.', 102, 7, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NULL),
(9, '모바일에서 제스처 인터페이스의 중요성도 논의해보면 좋을 것 같습니다.', 102, 8, NULL, DATE_SUB(NOW(), INTERVAL 15 MINUTE), NOW(), NULL),

-- 토론 103번 댓글 (실시간 채팅 구현 전략)
(10, 'WebSocket vs Server-Sent Events 중 어떤 것을 선호하시나요?', 103, 3, NULL, DATE_SUB(NOW(), INTERVAL 20 MINUTE), NOW(), NULL),
(11, 'WebSocket이 양방향 통신에는 더 적합한 것 같아요. 하지만 구현 복잡도를 고려하면 SSE도 좋은 선택이죠.', 103, 5, 10, DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW(), NULL),
(12, 'Socket.io 같은 라이브러리 사용 경험은 어떠셨나요?', 103, 4, NULL, DATE_SUB(NOW(), INTERVAL 5 MINUTE), NOW(), NULL),

-- 토론 104번 댓글 (iOS와 Android 비교)
(13, 'iOS와 Android의 개발 생산성 측면에서 어떤 차이가 있을까요?', 104, 8, NULL, DATE_ADD(NOW(), INTERVAL 1 HOUR), NOW(), NULL),

-- 토론 105번 댓글 (CI/CD 구축 사례)
(14, 'Jenkins vs GitHub Actions 중 어떤 것을 추천하시나요?', 105, 7, NULL, DATE_ADD(NOW(), INTERVAL 5 HOUR), NOW(), NULL),
(15, 'GitHub Actions가 설정이 더 간단한 것 같아요. 특히 GitHub와의 통합성이 뛰어나죠.', 105, 2, 14, DATE_ADD(NOW(), INTERVAL 5 HOUR) + INTERVAL 30 MINUTE, NOW(), NULL),

-- 토론 106번 댓글 (AI 도구를 활용한 생산성 향상)
(16, 'GitHub Copilot 사용해보셨나요? 생산성 향상에 정말 도움이 되더라고요.', 106, 4, NULL, DATE_ADD(NOW(), INTERVAL 12 HOUR), NOW(), NULL),
(17, 'ChatGPT도 코드 리뷰나 디버깅에 활용하면 유용한 것 같아요.', 106, 5, 16, DATE_ADD(NOW(), INTERVAL 12 HOUR) + INTERVAL 1 HOUR, NOW(), NULL),

-- 토론 107번 댓글 (GraphQL 활용기)
(18, 'GraphQL의 N+1 문제는 어떻게 해결하셨나요?', 107, 6, NULL, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, NOW(), NULL),

-- 토론 108번 댓글 (협업 툴의 선택 기준 - 온라인)
(19, '협업 툴 선택 시 가장 중요한 기준이 무엇인가요?', 108, 2, NULL, NOW() - INTERVAL 4 MINUTE, NOW(), NULL),
(20, '팀 규모와 워크플로우에 맞는 툴을 선택하는 것이 중요한 것 같아요.', 108, 3, 19, NOW() - INTERVAL 2 MINUTE, NOW(), NULL),

-- 토론 109번 댓글 (클린 아키텍처 적용기)
(21, '클린 아키텍처 도입 시 초기 비용이 높지 않았나요?', 109, 1, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY), NOW(), NULL),
(22, '초기에는 그렇죠. 하지만 장기적으로 보면 유지보수성이 크게 개선됩니다.', 109, 3, 21, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 2 HOUR, NOW(), NULL),
(23, 'DDD와 함께 적용하면 더 효과적인 것 같아요.', 109, 6, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY) + INTERVAL 4 HOUR, NOW(), NULL),

-- 토론 110번 댓글 (클린 아키텍처 적용기)
(24, '헥사고날 아키텍처와 비교했을 때 어떤 차이가 있을까요?', 110, 4, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY), NOW(), NULL),
(25, '둘 다 의존성 역전을 중시하지만, 헥사고날이 포트와 어댑터 개념이 더 명확한 것 같아요.', 110, 8, 24, DATE_SUB(NOW(), INTERVAL 14 DAY) + INTERVAL 1 HOUR, NOW(), NULL),
(26, '실제 프로젝트에서는 어떤 기준으로 선택하시나요?', 110, 5, NULL, DATE_SUB(NOW(), INTERVAL 14 DAY) + INTERVAL 3 HOUR, NOW(), NULL),

-- 토론 111번 댓글 (iOS와 Android 비교)
(27, '플랫폼별 사용자 경험의 차이점이 궁금합니다.', 111, 7, NULL, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 12 HOUR, NOW(), NULL),

-- 토론 112번 댓글 (GraphQL 활용기 - 온라인)
(28, 'GraphQL 캐싱 전략은 어떻게 구현하셨나요?', 112, 5, NULL, NOW() - INTERVAL 30 MINUTE, NOW(), NULL),

-- 토론 113번 댓글 (대규모 트래픽 처리 전략)
(29, '마이크로서비스 환경에서의 트래픽 처리 전략은 어떻게 다른가요?', 113, 9, NULL, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 12 HOUR, NOW(), NULL),
(30, '서비스 메시와 API 게이트웨이의 역할이 중요해지죠.', 113, 1, 29, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 13 HOUR, NOW(), NULL),

-- 토론 114번 댓글 (GraphQL 활용기)
(31, 'Apollo Client vs Relay 중 어떤 것을 선호하시나요?', 114, 2, NULL, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 6 HOUR, NOW(), NULL),
(32, 'Apollo Client가 러닝 커브가 낮아서 시작하기 좋은 것 같아요.', 114, 6, 31, DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 7 HOUR, NOW(), NULL),

-- 토론 115번 댓글 (클린 아키텍처 적용기 - 온라인)
(33, '테스트 코드 작성 시 클린 아키텍처의 장점이 확실히 드러나는 것 같아요.', 115, 4, NULL, NOW() - INTERVAL 1 MINUTE, NOW(), NULL),

-- 토론 116번 댓글 (iOS와 Android 비교 - 온라인)
(34, '크로스 플랫폼 개발 도구들(React Native, Flutter)에 대한 의견도 궁금합니다.', 116, 8, NULL, NOW() - INTERVAL 30 SECOND, NOW(), NULL),
(35, 'Flutter의 성능이 생각보다 좋더라고요. 개발 속도도 빠르고요.', 116, 3, 34, NOW() - INTERVAL 10 SECOND, NOW(), NULL),

-- 토론 117번 댓글 (GraphQL 활용기)
(36, 'GraphQL 스키마 버전 관리는 어떻게 하고 계신가요?', 117, 5, NULL, DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 6 HOUR, NOW(), NULL),
(37, '스키마 설계 시 확장성을 미리 고려하는 것이 중요한 것 같아요.', 117, 7, 36, DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 8 HOUR, NOW(), NULL),
(38, 'GraphQL Federation 사용 경험이 있으신가요?', 117, 1, NULL, DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 10 HOUR, NOW(), NULL),

-- 토론 118번 댓글 (클린 아키텍처 적용기 - 온라인)
(39, '레거시 코드를 클린 아키텍처로 리팩토링하는 전략이 있나요?', 118, 9, NULL, NOW() + INTERVAL 1 HOUR, NOW(), NULL),
(40, '점진적으로 경계를 만들어가면서 리팩토링하는 것이 안전한 것 같아요.', 118, 2, 39, NOW() + INTERVAL 2 HOUR, NOW(), NULL),

-- 토론 119번 댓글 (대규모 트래픽 처리 전략 - 온라인)
(41, '실시간 모니터링 도구는 어떤 것을 사용하시나요?', 119, 6, NULL, NOW() + INTERVAL 2 MINUTE, NOW(), NULL),
(42, 'Prometheus + Grafana 조합을 많이 사용하는 것 같아요.', 119, 4, 41, NOW() + INTERVAL 3 MINUTE, NOW(), NULL),
(43, 'ELK 스택도 로그 분석에 유용하죠.', 119, 8, NULL, NOW() + INTERVAL 4 MINUTE, NOW(), NULL),

-- 토론 120번 댓글 (마이크로서비스 아키텍처 설계)
(44, '서비스 간 통신에서 동기 vs 비동기 중 어떤 것을 선호하시나요?', 120, 5, NULL, DATE_SUB(NOW(), INTERVAL 30 MINUTE), NOW(), NULL),
(45, '비즈니스 로직에 따라 다르지만, 가능하면 비동기 통신을 선호합니다. 시스템의 복원력이 높아져요.', 120, 3, 44, DATE_SUB(NOW(), INTERVAL 20 MINUTE), NOW(), NULL),
(46, '이벤트 소싱 패턴도 고려해볼 만하네요.', 120, 7, NULL, DATE_SUB(NOW(), INTERVAL 10 MINUTE), NOW(), NULL);
