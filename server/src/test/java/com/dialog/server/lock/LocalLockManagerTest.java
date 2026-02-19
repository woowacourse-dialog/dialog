package com.dialog.server.lock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

class LocalLockManagerTest {

    private LocalLockManager lockManager;

    @BeforeEach
    void setUp() {
        lockManager = new LocalLockManager();
    }

    @Test
    void 같은_키에_대해_lock_unlock이_정상_동작한다() {
        // given
        Long key = 1L;

        // when & then (예외 없이 수행되면 성공)
        lockManager.lock(key);
        lockManager.unlock(key);
    }

    @Test
    void 같은_키에_대해_두_스레드가_순차적으로_실행된다() throws InterruptedException {
        // given
        Long key = 1L;
        AtomicInteger counter = new AtomicInteger(0);
        CountDownLatch latch = new CountDownLatch(2);

        // when
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.submit(() -> {
            lockManager.lock(key);
            try {
                int current = counter.get();
                Thread.sleep(100);
                counter.set(current + 1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lockManager.unlock(key);
                latch.countDown();
            }
        });

        executor.submit(() -> {
            lockManager.lock(key);
            try {
                int current = counter.get();
                Thread.sleep(100);
                counter.set(current + 1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lockManager.unlock(key);
                latch.countDown();
            }
        });

        latch.await();

        // then - 직렬화되었으므로 counter는 정확히 2여야 한다
        assertThat(counter.get()).isEqualTo(2);
    }

    @Test
    void 다른_키에_대해_두_스레드가_동시에_실행된다() throws InterruptedException {
        // given
        Long key1 = 1L;
        Long key2 = 2L;
        CountDownLatch bothLocked = new CountDownLatch(2);
        CountDownLatch done = new CountDownLatch(2);
        AtomicInteger concurrentCount = new AtomicInteger(0);

        // when
        ExecutorService executor = Executors.newFixedThreadPool(2);

        executor.submit(() -> {
            lockManager.lock(key1);
            try {
                concurrentCount.incrementAndGet();
                bothLocked.countDown();
                bothLocked.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lockManager.unlock(key1);
                done.countDown();
            }
        });

        executor.submit(() -> {
            lockManager.lock(key2);
            try {
                concurrentCount.incrementAndGet();
                bothLocked.countDown();
                bothLocked.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                lockManager.unlock(key2);
                done.countDown();
            }
        });

        done.await();

        // then - 두 스레드가 동시에 락을 획득했으므로 concurrentCount는 2
        assertThat(concurrentCount.get()).isEqualTo(2);
    }

    @RepeatedTest(10)
    void 같은_키에_대해_락_요청_순서대로_획득한다() throws InterruptedException {
        // given
        Long key = 1L;
        int threadCount = 5;
        List<Integer> acquisitionOrder = Collections.synchronizedList(new ArrayList<>());
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        // 메인 스레드가 먼저 락 획득 → 나머지 스레드를 대기 상태로 만듦
        lockManager.lock(key);

        ExecutorService executor = Executors.newFixedThreadPool(threadCount);

        // when - 스레드 0~4가 순서대로 락을 요청
        for (int i = 0; i < threadCount; i++) {
            final int order = i;
            executor.submit(() -> {
                readyLatch.countDown();
                lockManager.lock(key);
                try {
                    acquisitionOrder.add(order);
                } finally {
                    lockManager.unlock(key);
                    doneLatch.countDown();
                }
            });

            // 각 스레드가 lock() 대기 상태에 진입할 시간 확보
            Thread.sleep(50);
        }

        // 모든 스레드가 대기 큐에 들어갈 때까지 대기
        readyLatch.await();
        Thread.sleep(100);

        // 메인 스레드 락 해제 → 대기 중인 스레드들이 순서대로 획득
        lockManager.unlock(key);
        doneLatch.await();

        // then - 락 획득 순서가 요청 순서와 동일해야 한다
        assertThat(acquisitionOrder).containsExactly(0, 1, 2, 3, 4);

        executor.shutdown();
    }
}
