package com.dialog.server.lock;

public interface LockManager {

    void lock(Long key);

    void unlock(Long key);
}
