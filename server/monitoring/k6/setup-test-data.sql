-- ============================================
-- 부하 테스트 데이터 (앱 시작 후 data.sql 실행 완료 후 실행)
-- ============================================

-- 기존 부하 테스트 데이터 정리 (재실행 대비)
DELETE FROM discussion_participants WHERE discussion_id = 10001;
DELETE FROM offline_discussions WHERE discussion_id = 10001;
DELETE FROM discussions WHERE discussion_id = 10001;
DELETE FROM users WHERE user_id >= 10001 AND user_id <= 10100;

-- 100명의 테스트 유저 생성
INSERT INTO users (user_id, nickname, track, web_push_notification, created_at, modified_at)
SELECT
    10000 + seq.n AS user_id,
    CONCAT('loadtest_user_', seq.n) AS nickname,
    'BACKEND' AS track,
    false AS web_push_notification,
    NOW() AS created_at,
    NOW() AS modified_at
FROM (
    SELECT @row := @row + 1 AS n
    FROM information_schema.columns, (SELECT @row := 0) r
    LIMIT 100
) seq;

-- 테스트 OfflineDiscussion 생성 (discussions 테이블)
INSERT INTO discussions (discussion_id, title, content, category, summary, author_id, created_at, modified_at, deleted_at)
VALUES (10001, '부하 테스트용 토론', '부하 테스트 대상 오프라인 토론입니다.', 'BACKEND', '부하 테스트', 1, NOW(), NOW(), NULL);

-- 테스트 OfflineDiscussion 생성 (offline_discussions 테이블)
INSERT INTO offline_discussions (discussion_id, start_at, end_at, place, participant_count, max_participant_count)
VALUES (10001,
        DATE_ADD(NOW(), INTERVAL 30 DAY),
        DATE_ADD(NOW(), INTERVAL 30 DAY) + INTERVAL 2 HOUR,
        '부하 테스트 장소',
        0,
        100);
