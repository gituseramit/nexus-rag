from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.db.models import Base
from sqlalchemy import text


def _build_engine():
    """
    asyncpg is very strict and will treat unknown query params (like 
    channel_binding=require) as part of the database name, causing crashes.
    We strip ALL query parameters from the URL string, and manually 
    inject SSL context if 'ssl' or 'sslmode' was requested.
    """
    url: str = settings.DATABASE_URL
    connect_args: dict = {}
    
    # Check if SSL was requested anywhere in the URL string
    if "sslmode=require" in url or "ssl=require" in url or "sslmode=verify-full" in url:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        connect_args["ssl"] = ctx

    # Completely strip query parameters (everything after '?')
    if "?" in url:
        url = url.split("?")[0]

    return create_async_engine(
        url,
        echo=False,
        connect_args=connect_args,
        pool_pre_ping=True,          # reconnect if connection dropped
        pool_recycle=300,            # recycle connections every 5 min
    )


engine = _build_engine()
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def init_db():
    # Step 1: Try to create the pgvector extension in its own transaction
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            print("[init_db] pgvector extension ready.")
    except Exception as e:
        print(f"[init_db] pgvector extension skipped (non-fatal): {e}")

    # Step 2: Create all tables in a fresh separate transaction
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("[init_db] Database tables created/verified successfully.")
    except Exception as e:
        print(f"[init_db] Table creation failed: {e}")
