CREATE TABLE IF NOT EXISTS errors (
    id SERIAL PRIMARY KEY,
    error_text TEXT,
    stack TEXT,
    service TEXT,
    error_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox (
    id SERIAL PRIMARY KEY,
    error_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);