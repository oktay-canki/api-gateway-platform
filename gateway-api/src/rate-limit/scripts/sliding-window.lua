local key = KEYS[1]

local now = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local request_id = ARGV[4]

local window_start = now - window_ms

-- Remove requests that are outside the current window.
redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

-- Count requests currently inside the window.
local current_count = redis.call('ZCARD', key)

-- Reject if the limit has already been reached.
if current_count >= max_requests then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')

    local retry_after_ms = window_ms

    if #oldest > 0 then
        local oldest_timestamp = tonumber(oldest[2])
        retry_after_ms = window_ms - (now - oldest_timestamp)

        if retry_after_ms < 0 then
            retry_after_ms = 0
        end
    end

    return { 0, max_requests, 0, retry_after_ms }
end

-- Record this request.
redis.call('ZADD', key, now, request_id)

-- Expire the key after the window.
redis.call('PEXPIRE', key, window_ms)

local remaining = max_requests - current_count - 1

return { 1, max_requests, remaining, 0 }