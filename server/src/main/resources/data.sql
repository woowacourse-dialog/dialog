INSERT INTO users (user_id, nickname, phone_number, email_notification, phone_notification, created_at, modified_at, is_deleted)
VALUES (1, '김개발', '010-1234-5678', true, true, NOW(), NOW(), false),
       (2, '홍길동', '010-9876-5432', true, false, NOW(), NOW(), false),
       (3, '박코딩', '010-5555-1234', false, true, NOW(), NOW(), false);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (100, '모바일 UX 설계 전략', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL '1 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '1 3:00' DAY_MINUTE),
        '구글 미트', 0, 3, 10, 'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '1 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (101, '대규모 트래픽 처리 전략', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '1 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '1 6:00' DAY_MINUTE),
        '온라인 줌 미팅', 0, 3, 5, 'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '1 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (102, '모바일 UX 설계 전략', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '2 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '2 3:00' DAY_MINUTE),
        '온라인 게더타운', 0, 2, 8, 'ANDROID', '모바일 UX 설계 전략에 대한 경험과 의견 공유', 2,
        DATE_ADD(NOW(), INTERVAL '2 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (103, '실시간 채팅 구현 전략', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '2 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '2 6:00' DAY_MINUTE),
        '디스코드 채널', 0, 2, 8, 'ANDROID', '실시간 채팅 구현 전략에 대한 경험과 의견 공유', 1,
        DATE_ADD(NOW(), INTERVAL '2 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (104, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL '3 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '3 3:00' DAY_MINUTE),
        '카페 모임', 0, 3, 9, 'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_ADD(NOW(), INTERVAL '3 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (105, 'CI/CD 구축 사례', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL '3 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '3 6:00' DAY_MINUTE),
        '회사 회의실', 0, 2, 5, 'ANDROID', 'CI/CD 구축 사례에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '3 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (106, 'AI 도구를 활용한 생산성 향상', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '4 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '4 3:00' DAY_MINUTE),
        '구글 미트', 0, 2, 10, 'FRONTEND', 'AI 도구를 활용한 생산성 향상에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '4 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (107, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '4 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '4 6:00' DAY_MINUTE),
        '온라인 게더타운', 0, 2, 10, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '4 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (108, '협업 툴의 선택 기준', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '5 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '5 3:00' DAY_MINUTE),
        '온라인 줌 미팅', 0, 1, 7, 'BACKEND', '협업 툴의 선택 기준에 대한 경험과 의견 공유', 1,
        DATE_ADD(NOW(), INTERVAL '5 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (109, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '5 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '5 6:00' DAY_MINUTE),
        '온라인 줌 미팅', 0, 2, 6, 'BACKEND', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_ADD(NOW(), INTERVAL '5 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (110, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '6 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '6 3:00' DAY_MINUTE),
        '디스코드 채널', 0, 1, 7, 'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_ADD(NOW(), INTERVAL '6 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (111, 'iOS와 Android 비교', '이 주제에 대한 경험과 전략을 토론합니다.',
        DATE_ADD(NOW(), INTERVAL '6 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '6 6:00' DAY_MINUTE),
        '온라인 게더타운', 0, 2, 9, 'BACKEND', 'iOS와 Android 비교에 대한 경험과 의견 공유', 1,
        DATE_ADD(NOW(), INTERVAL '6 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (112, 'GraphQL 활용기', '개선 경험과 효과를 나눠주세요.',
        DATE_ADD(NOW(), INTERVAL '7 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '7 3:00' DAY_MINUTE),
        '온라인 줌 미팅', 0, 1, 9, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '7 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (113, '대규모 트래픽 처리 전략', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '7 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '7 6:00' DAY_MINUTE),
        '온라인 게더타운', 0, 2, 7, 'BACKEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '7 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (114, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '8 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '8 3:00' DAY_MINUTE),
        '카페 모임', 0, 3, 7, 'ANDROID', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '8 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (115, '클린 아키텍처 적용기', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '8 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '8 6:00' DAY_MINUTE),
        '카페 모임', 0, 2, 7, 'ANDROID', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 2,
        DATE_ADD(NOW(), INTERVAL '8 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (116, 'iOS와 Android 비교', '각자의 관점을 공유해 주세요.',
        DATE_ADD(NOW(), INTERVAL '9 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '9 3:00' DAY_MINUTE),
        '구글 미트', 0, 2, 7, 'COMMON', 'iOS와 Android 비교에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '9 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (117, 'GraphQL 활용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '9 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '9 6:00' DAY_MINUTE),
        '온라인 게더타운', 0, 3, 10, 'FRONTEND', 'GraphQL 활용기에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '9 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (118, '클린 아키텍처 적용기', '실제 프로젝트에서의 사례 중심으로 이야기해봅시다.',
        DATE_ADD(NOW(), INTERVAL '10 1:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '10 3:00' DAY_MINUTE),
        '카페 모임', 0, 3, 8, 'COMMON', '클린 아키텍처 적용기에 대한 경험과 의견 공유', 1,
        DATE_ADD(NOW(), INTERVAL '10 0:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussions (discussion_id, title, content, start_at, end_at, place, view_count, participant_count,
                         max_participant_count, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (119, '대규모 트래픽 처리 전략', '개선 경험과 효과를 나눠주세요.',
        DATE_ADD(NOW(), INTERVAL '10 4:00' DAY_MINUTE),
        DATE_ADD(NOW(), INTERVAL '10 6:00' DAY_MINUTE),
        '디스코드 채널', 0, 2, 8, 'FRONTEND', '대규모 트래픽 처리 전략에 대한 경험과 의견 공유', 3,
        DATE_ADD(NOW(), INTERVAL '10 3:50' DAY_MINUTE),
        NOW(), NULL);

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (100, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (100, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (100, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (101, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (101, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (101, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (102, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (102, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (103, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (103, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (104, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (104, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (104, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (105, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (105, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (106, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (106, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (107, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (107, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (108, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (109, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (109, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (110, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (111, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (111, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (112, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (113, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (113, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (114, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (114, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (114, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (115, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (115, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (116, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (116, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (117, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (117, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (117, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (118, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (118, 2, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (118, 3, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (119, 1, NOW(), NOW());

INSERT INTO discussion_participants (discussion_id, participant_id, created_at, modified_at)
VALUES (119, 3, NOW(), NOW());

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

UPDATE discussions SET participant_count = 2 WHERE discussion_id = 119;
