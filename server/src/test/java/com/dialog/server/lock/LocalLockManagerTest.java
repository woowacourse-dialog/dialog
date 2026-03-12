package com.dialog.server.lock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
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

}
