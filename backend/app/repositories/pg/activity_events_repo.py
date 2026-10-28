# PostgreSQL Activity Events Repository
# Replaces MongoActivityEventsRepo — stores audit/event log entries in the
# 'activity_events' table created in 010_pg_only_tables.sql.
#
# The 'payload' field is a flexible Python dict serialised as JSONB, allowing
# each event_type to carry its own structure without schema changes.

import json
from typing import List
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import ActivityEvent, ActivityEventsRepoBase


class PgActivityEventsRepo(ActivityEventsRepoBase):
    async def record_event(self, event: ActivityEvent) -> ActivityEvent:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO activity_events (
                        event_id, user_id, event_type, payload, timestamp
                    ) VALUES (%s, %s, %s, %s::jsonb, %s)
                    ON CONFLICT (event_id) DO NOTHING
                    """,
                    (
                        event.event_id,
                        event.user_id,
                        event.event_type,
                        json.dumps(event.payload),
                        event.timestamp,
                    ),
                )
        return event

    async def list_recent_events(self, limit: int = 50) -> List[ActivityEvent]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT event_id, user_id, event_type, payload, timestamp
                    FROM activity_events
                    ORDER BY timestamp DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
                events = []
                for row in rows:
                    data = dict(row)
                    # Guard: psycopg3 normally deserialises JSONB automatically
                    if isinstance(data.get("payload"), str):
                        data["payload"] = json.loads(data["payload"])
                    events.append(ActivityEvent(**data))
                return events

