package com.dialog.server.lock;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.stereotype.Component;

@Component
public class LocalLockManager implements LockManager {

    private final ConcurrentHashMap<Long, ReentrantLock> lockMap = new ConcurrentHashMap<>();

    @Override
    public void lock(Long key) {
        lockMap.computeIfAbsent(key, k -> new ReentrantLock()).lock();
    }

    @Override
    public void unlock(Long key) {
        ReentrantLock lock = lockMap.get(key);
        if (lock != null) {
            lock.unlock();
        }
    }
}
