# >>> DB-INTEGRATION-POINT: PyMongo Client
# This is the single file responsible for creating and lifecycle-managing
# the MongoDB client using PyMongo.
# In MONGO_MODE=mock, this client is NEVER instantiated.

import logging
from typing import Optional
from pymongo import MongoClient
from pymongo.database import Database

from app.config import get_settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None


def init_mongo_client() -> Optional[MongoClient]:
    """
    Initializes PyMongo MongoClient if MONGO_MODE == 'mongo'.
    >>> DB-INTEGRATION-POINT: Verify MONGO_URI, database accessibility, and replica set/indexes.
    """
    global _mongo_client
    settings = get_settings()

    if settings.MONGO_MODE != "mongo":
        logger.info("MONGO_MODE is '%s'. Skipping MongoDB client initialization.", settings.MONGO_MODE)
        return None

    if _mongo_client is None:
        logger.info("Connecting to MongoDB at %s (Database: %s)...", settings.MONGO_URI, settings.MONGO_DB_NAME)
        _mongo_client = MongoClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=5000,
            uuidRepresentation="standard"
        )
        logger.info("MongoDB client connected.")

    return _mongo_client


def close_mongo_client() -> None:
    """Closes the MongoDB client connection on shutdown."""
    global _mongo_client
    if _mongo_client is not None:
        logger.info("Closing MongoDB client...")
        _mongo_client.close()
        _mongo_client = None
        logger.info("MongoDB client closed.")


def get_mongo_db() -> Optional[Database]:
    """Returns the configured Mongo Database instance or None if not initialized."""
    client = init_mongo_client()
    if client is None:
        return None
    settings = get_settings()
    return client[settings.MONGO_DB_NAME]
