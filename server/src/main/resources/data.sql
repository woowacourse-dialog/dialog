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

-- 토론 완료 상태 (과거)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (100, '모바일 UX 설계 전략', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
        '구글 미트', 15, 3, 10, 'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 7 DAY),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (101, '대규모 트래픽 처리 전략', '각자의 관점을 공유해 주세요.',
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 3 HOUR,
        '온라인 줌 미팅', 22, 5, 5, 'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 5 DAY),
        NOW(), NULL);

-- 토론 중 상태 (현재 진행중)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (102, '모바일 UX 설계 전략', '각자의 관점을 공유해 주세요.',
        DATE_SUB(NOW(), INTERVAL 1 HOUR),
        DATE_ADD(NOW(), INTERVAL 1 HOUR),
        '온라인 게더타운', 8, 2, 8, 'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (103, '실시간 채팅 구현 전략', '각자의 관점을 공유해 주세요.',
        DATE_SUB(NOW(), INTERVAL 30 MINUTE),
        DATE_ADD(NOW(), INTERVAL 90 MINUTE),
        '디스코드 채널', 12, 2, 8, 'ANDROID', '실시간 채팅 구현 전략에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 1 DAY),
        NOW(), NULL);

-- 모집 완료 상태 (시작 전이지만 정원 마감)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (104, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL 2 HOUR),
        DATE_ADD(NOW(), INTERVAL 4 HOUR),
        '카페 모임', 5, 9, 9, 'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 3 DAY),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (105, 'CI/CD 구축 사례', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL 6 HOUR),
        DATE_ADD(NOW(), INTERVAL 8 HOUR),
        '회사 회의실', 3, 5, 5, 'ANDROID', 'CI/CD 구축 사례에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 4 DAY),
        NOW(), NULL);

-- 모집 중 상태 (미래 시작, 정원 미달)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (106, 'AI 도구를 활용한 생산성 향상', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 1 DAY),
        DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR,
        '구글 미트', 2, 2, 10, 'FRONTEND', 'AI 도구를 활용한 생산성 향상에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 10 MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (107, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 2 DAY),
        DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 1, 2, 10, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 30 MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (108, '협업 툴의 선택 기준', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL 3 DAY),
        DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR,
        '온라인 줌 미팅', 0, 1, 7, 'BACKEND', '협업 툴의 선택 기준에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 5 MINUTE),
        NOW(), NULL);

-- 추가 과거 토론들 (다양한 시점)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (109, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_SUB(NOW(), INTERVAL 10 DAY),
        DATE_SUB(NOW(), INTERVAL 10 DAY) + INTERVAL 2 HOUR,
        '온라인 줌 미팅', 45, 6, 6, 'BACKEND', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 12 DAY),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (110, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_SUB(NOW(), INTERVAL 15 DAY),
        DATE_SUB(NOW(), INTERVAL 15 DAY) + INTERVAL 3 HOUR,
        '디스코드 채널', 67, 7, 7, 'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 18 DAY),
        NOW(), NULL);

-- 미래 모집 중 토론들
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (111, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL 5 DAY),
        DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 2 HOUR,
        '온라인 게더타운', 0, 2, 9, 'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_SUB(NOW(), INTERVAL 2 HOUR),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (112, 'GraphQL 활용기', '개선 경험과 효과를 나눠주세요.',
        DATE_ADD(NOW(), INTERVAL 7 DAY),
        DATE_ADD(NOW(), INTERVAL 7 DAY) + INTERVAL 2 HOUR,
        '온라인 줌 미팅', 0, 1, 9, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 1 HOUR),
        NOW(), NULL);

-- 미래 모집 완료 상태
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (113, '대규모 트래픽 처리 전략', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 4 DAY),
        DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 1, 7, 7, 'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_SUB(NOW(), INTERVAL 3 HOUR),
        NOW(), NULL);

-- 최신 게시글들 (방금 등록)
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (114, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 8 DAY),
        DATE_ADD(NOW(), INTERVAL 8 DAY) + INTERVAL 2 HOUR,
        '카페 모임', 0, 3, 7, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        NOW() - INTERVAL 5 MINUTE,
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (115, '클린 아키텍처 적용기', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL 6 DAY),
        DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 2 HOUR,
        '카페 모임', 0, 2, 7, 'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        NOW() - INTERVAL 2 MINUTE,
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (116, 'iOS와 Android 비교', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL 9 DAY),
        DATE_ADD(NOW(), INTERVAL 9 DAY) + INTERVAL 2 HOUR,
        '구글 미트', 0, 2, 7, 'COMMON', 'iOS와 Android 비교에 대한 경험과 의견 공유', 3,
        NOW() - INTERVAL 1 MINUTE,
        NOW(), NULL);

-- 가장 최신 게시글
INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (117, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 10 DAY),
        DATE_ADD(NOW(), INTERVAL 10 DAY) + INTERVAL 3 HOUR,
        '온라인 게더타운', 0, 3, 10, 'FRONTEND', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        NOW(),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (118, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL 12 DAY),
        DATE_ADD(NOW(), INTERVAL 12 DAY) + INTERVAL 2 HOUR,
        '카페 모임', 0, 3, 8, 'COMMON', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 1,
        NOW() + INTERVAL 30 SECOND,
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (119, '대규모 트래픽 처리 전략', '개선 경험과 효과를 나눠주세요.',
        DATE_ADD(NOW(), INTERVAL 11 DAY),
        DATE_ADD(NOW(), INTERVAL 11 DAY) + INTERVAL 2 HOUR,
        '디스코드 채널', 0, 2, 8, 'FRONTEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        NOW() + INTERVAL 1 MINUTE,
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (120, '마이크로서비스 아키텍처 설계', '실제 도입 경험과 장단점을 공유해봅시다.',
        DATE_SUB(NOW(), INTERVAL 45 MINUTE),
        DATE_ADD(NOW(), INTERVAL 75 MINUTE),
        '온라인 줌 미팅', 18, 4, 8, 'BACKEND', '마이크로서비스 아키텍처 설계에 대한 경험과 의견 공유', 2,
        DATE_SUB(NOW(), INTERVAL 2 DAY),
        NOW(), NULL);

-- 참가자 데이터 (기존과 동일)
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
       (108, 1, NOW(), NOW()),
       (109, 2, NOW(), NOW()),
       (109, 3, NOW(), NOW()),
       (110, 2, NOW(), NOW()),
       (111, 1, NOW(), NOW()),
       (111, 3, NOW(), NOW()),
       (112, 3, NOW(), NOW()),
       (113, 2, NOW(), NOW()),
       (113, 3, NOW(), NOW()),
       (114, 1, NOW(), NOW()),
       (114, 2, NOW(), NOW()),
       (114, 3, NOW(), NOW()),
       (115, 2, NOW(), NOW()),
       (115, 3, NOW(), NOW()),
       (116, 1, NOW(), NOW()),
       (116, 3, NOW(), NOW()),
       (117, 1, NOW(), NOW()),
       (117, 2, NOW(), NOW()),
       (117, 3, NOW(), NOW()),
       (118, 1, NOW(), NOW()),
       (118, 2, NOW(), NOW()),
       (118, 3, NOW(), NOW()),
       (119, 1, NOW(), NOW()),
       (119, 2, NOW(), NOW()),
       (119, 3, NOW(), NOW()),
       (119, 4, NOW(), NOW()),
       (119, 5, NOW(), NOW()),
       (119, 6, NOW(), NOW()),
       (119, 7, NOW(), NOW()),
       (119, 8, NOW(), NOW()),
       (120, 1, NOW(), NOW()),
       (120, 3, NOW(), NOW()),
       (120, 4, NOW(), NOW())
       ;

-- participant_count 업데이트 (기존과 동일)
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 100;
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 101;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 102;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 103;
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 104;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 105;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 106;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 107;
UPDATE discussions SET participant_count = 1 WHERE discussion_id = 108;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 109;
UPDATE discussions SET participant_count = 1 WHERE discussion_id = 110;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 111;
UPDATE discussions SET participant_count = 1 WHERE discussion_id = 112;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 113;
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 114;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 115;
UPDATE discussions SET participant_count = 2 WHERE discussion_id = 116;
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 117;
UPDATE discussions SET participant_count = 3 WHERE discussion_id = 118;
UPDATE discussions SET participant_count = 8 WHERE discussion_id = 119;
UPDATE discussions SET participant_count = 4 WHERE discussion_id = 120;
