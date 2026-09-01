local key = KEYS[1]

local now = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local refill_rate = tonumber(ARGV[3])
local refill_interval_ms = tonumber(ARGV[4])

local tokens = redis.call('HGET', key, 'tokens')
local last_refill = redis.call('HGET', key, 'last_refill')

if tokens == false then
    tokens = capacity
else
    tokens = tonumber(tokens)
end

if last_refill == false then
    last_refill = now
else
    last_refill = tonumber(last_refill)
end

-- Calculate how many complete refill intervals have elapsed.
local elapsed_ms = now - last_refill
local intervals = math.floor(elapsed_ms / refill_interval_ms)

if intervals > 0 then
    tokens = math.min(
        capacity,
        tokens + (intervals * refill_rate)
    )

    last_refill = last_refill + (intervals * refill_interval_ms)
end

-- Reject if there are no tokens available.
if tokens < 1 then
    local tokens_needed = 1 - tokens
    local intervals_needed = math.ceil(tokens_needed / refill_rate)

    local retry_after_ms =
        intervals_needed * refill_interval_ms - (now - last_refill)

    if retry_after_ms < 0 then
        retry_after_ms = 0
    end

    redis.call('HSET', key,
        'tokens', tokens,
        'last_refill', last_refill
    )

    redis.call(
        'PEXPIRE',
        key,
        refill_interval_ms * math.ceil(capacity / refill_rate)
    )

    return { 0, capacity, math.floor(tokens), retry_after_ms }
end

-- Consume one token.
tokens = tokens - 1

redis.call('HSET', key,
    'tokens', tokens,
    'last_refill', last_refill
)

redis.call(
    'PEXPIRE',
    key,
    refill_interval_ms * math.ceil(capacity / refill_rate)
)

return { 1, capacity, math.floor(tokens), 0 }