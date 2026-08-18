from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.db.models import Base
from sqlalchemy import text


def _build_engine():
    """
    asyncpg does NOT accept `sslmode` or `ssl` as URL query params —
    those must be passed as connect_args. This function strips any SSL
    query parameters from the DATABASE_URL and re-injects SSL via
    connect_args so the connection works with Neon, Supabase, etc.
    """
    url: str = settings.DATABASE_URL
    connect_args: dict = {}

    # Detect and strip SSL query params that asyncpg can't handle in the URL
    ssl_required = False
    for param in ("sslmode=require", "ssl=require", "sslmode=verify-full"):
        if param in url:
            ssl_required = True
            # Remove the param cleanly, handling both ?param and &param forms
            url = url.replace(f"?{param}", "").replace(f"&{param}", "")

    if ssl_required:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = _ssl.CERT_NONE
        connect_args["ssl"] = ctx

    # Clean up any trailing ? left after stripping
    if url.endswith("?"):
        url = url[:-1]

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
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
