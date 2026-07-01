import uvicorn
from app import config

if __name__ == "__main__":
    print(f"Starting TalentSphere AI Semantic Service on {config.HOST}:{config.PORT}...")
    # Using reload=True during development allows code changes to reload instantly
    # We turn reload off if we want a clean execution context or in production environments
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
    )
