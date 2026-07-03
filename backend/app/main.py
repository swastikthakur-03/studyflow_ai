# ── Register all API routes under /api/v1 ─────────────────────
app.include_router(api_router, prefix="/api/v1")

print("===================================")
for route in app.routes:
    print(route.path)
print("===================================")