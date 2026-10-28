# PostgreSQL AI Analysis Reports Repository
# Replaces MongoAIAnalysisRepo — stores AI classification results in the
# 'ai_analysis_reports' table created in 010_pg_only_tables.sql.
#
# The 'top_k' field is a Python list of dicts serialised as JSONB.
# psycopg3 deserialises JSONB columns back to Python objects on read.

import json
from typing import Optional
from uuid import UUID

from app.db.postgres import get_db_connection
from app.repositories.base import AIAnalysisReport, AIAnalysisRepoBase


class PgAIAnalysisRepo(AIAnalysisRepoBase):
    async def save_analysis_report(self, report: AIAnalysisReport) -> AIAnalysisReport:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO ai_analysis_reports (
                        report_id, photo_id, record_id, model_name,
                        predicted_category_code, confidence_score,
                        is_low_confidence, top_k, user_confirmed_code, created_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                    ON CONFLICT (report_id) DO UPDATE SET
                        photo_id                = EXCLUDED.photo_id,
                        record_id               = EXCLUDED.record_id,
                        model_name              = EXCLUDED.model_name,
                        predicted_category_code = EXCLUDED.predicted_category_code,
                        confidence_score        = EXCLUDED.confidence_score,
                        is_low_confidence       = EXCLUDED.is_low_confidence,
                        top_k                   = EXCLUDED.top_k,
                        user_confirmed_code     = EXCLUDED.user_confirmed_code
                    """,
                    (
                        report.report_id,
                        report.photo_id,
                        report.record_id,
                        report.model_name,
                        report.predicted_category_code,
                        report.confidence_score,
                        report.is_low_confidence,
                        json.dumps(report.top_k),
                        report.user_confirmed_code,
                        report.created_at,
                    ),
                )
        return report

    async def get_report_by_photo(self, photo_id: UUID) -> Optional[AIAnalysisReport]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT report_id, photo_id, record_id, model_name,
                           predicted_category_code, confidence_score,
                           is_low_confidence, top_k, user_confirmed_code, created_at
                    FROM ai_analysis_reports
                    WHERE photo_id = %s
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (photo_id,),
                )
                row = cur.fetchone()
                if row:
                    data = dict(row)
                    # psycopg3 returns JSONB as Python list/dict already;
                    # guard against edge case where it arrives as a string
                    if isinstance(data.get("top_k"), str):
                        data["top_k"] = json.loads(data["top_k"])
                    return AIAnalysisReport(**data)
                return None

