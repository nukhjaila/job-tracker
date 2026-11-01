CREATE TABLE IF NOT EXISTS applications(
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'wishlist' CHECK (status IN ('wishlist', 'applied', 'interview', 'offer', 'rejected')),
    url TEXT NOT NULL DEFAULT '',
    interview_date TIMESTAMPTZ,
    notes TEXT NOT NULL DEFAULT '',
    position_in_column INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);