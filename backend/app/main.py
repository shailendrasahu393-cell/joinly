from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .services import firebase # Initialize firebase admin
from .routes import auth, users, plans, join_requests, notifications, reports, messages

app = FastAPI(
    title="JOINLY API",
    description="Backend API for JOINLY MVP",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for elegant error responses
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(plans.router, prefix="/api/plans", tags=["plans"])
app.include_router(join_requests.router, prefix="/api/join-requests", tags=["join_requests"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(reports.router, prefix="/api/safety", tags=["safety"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])

@app.get("/")
def read_root():
    return {"message": "Welcome to JOINLY API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "firebase": "configured" if firebase.db is not None else "not configured"}
