"""
Initial migration — create all tables

Revision ID: 001_initial
"""

from alembic import op
import sqlalchemy as sa

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",            sa.Integer(),     primary_key=True),
        sa.Column("name",          sa.String(100),   nullable=False),
        sa.Column("email",         sa.String(255),   nullable=False),
        sa.Column("password_hash", sa.String(255),   nullable=False),
        sa.Column("is_active",     sa.Boolean(),     nullable=False, server_default="true"),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_id",    "users", ["id"],    unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── documents ────────────────────────────────────────────
    op.create_table(
        "documents",
        sa.Column("id",          sa.Integer(),     primary_key=True),
        sa.Column("user_id",     sa.Integer(),     sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name",   sa.String(255),   nullable=False),
        sa.Column("file_path",   sa.String(500),   nullable=False),
        sa.Column("file_size",   sa.BigInteger(),  server_default="0"),
        sa.Column("page_count",  sa.Integer(),     server_default="0"),
        sa.Column("upload_date", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_documents_id",      "documents", ["id"],      unique=False)
    op.create_index("ix_documents_user_id", "documents", ["user_id"], unique=False)

    # ── document_chunks ───────────────────────────────────────
    op.create_table(
        "document_chunks",
        sa.Column("id",           sa.Integer(),    primary_key=True),
        sa.Column("document_id",  sa.Integer(),    sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_text",   sa.Text(),       nullable=False),
        sa.Column("chunk_index",  sa.Integer(),    nullable=False),
        sa.Column("page_number",  sa.Integer(),    server_default="1"),
        sa.Column("embedding_id", sa.String(100),  nullable=True),
    )
    op.create_index("ix_document_chunks_id",          "document_chunks", ["id"],          unique=False)
    op.create_index("ix_document_chunks_document_id", "document_chunks", ["document_id"], unique=False)
    op.create_index("ix_document_chunks_embedding_id","document_chunks", ["embedding_id"],unique=False)

    # ── flashcards ────────────────────────────────────────────
    op.create_table(
        "flashcards",
        sa.Column("id",          sa.Integer(),    primary_key=True),
        sa.Column("user_id",     sa.Integer(),    sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_id", sa.Integer(),    sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("question",    sa.Text(),       nullable=False),
        sa.Column("answer",      sa.Text(),       nullable=False),
        sa.Column("topic",       sa.String(200),  nullable=True),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_flashcards_id",      "flashcards", ["id"],      unique=False)
    op.create_index("ix_flashcards_user_id", "flashcards", ["user_id"], unique=False)

    # ── quizzes ───────────────────────────────────────────────
    op.create_table(
        "quizzes",
        sa.Column("id",              sa.Integer(),    primary_key=True),
        sa.Column("user_id",         sa.Integer(),    sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_id",     sa.Integer(),    sa.ForeignKey("documents.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title",           sa.String(300),  nullable=False, server_default="Quiz"),
        sa.Column("quiz_type",       sa.String(20),   nullable=False, server_default="mcq"),
        sa.Column("score",           sa.Float(),      nullable=True),
        sa.Column("total_questions", sa.Integer(),    server_default="0"),
        sa.Column("date",            sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_quizzes_id",      "quizzes", ["id"],      unique=False)
    op.create_index("ix_quizzes_user_id", "quizzes", ["user_id"], unique=False)

    # ── quiz_questions ────────────────────────────────────────
    op.create_table(
        "quiz_questions",
        sa.Column("id",             sa.Integer(),  primary_key=True),
        sa.Column("quiz_id",        sa.Integer(),  sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_text",  sa.Text(),     nullable=False),
        sa.Column("options",        sa.JSON(),     nullable=True),
        sa.Column("correct_answer", sa.Text(),     nullable=False),
        sa.Column("user_answer",    sa.Text(),     nullable=True),
        sa.Column("explanation",    sa.Text(),     nullable=True),
        sa.Column("is_correct",     sa.Integer(),  nullable=True),
    )
    op.create_index("ix_quiz_questions_id",      "quiz_questions", ["id"],      unique=False)
    op.create_index("ix_quiz_questions_quiz_id", "quiz_questions", ["quiz_id"], unique=False)

    # ── tasks ─────────────────────────────────────────────────
    op.create_table(
        "tasks",
        sa.Column("id",         sa.Integer(),    primary_key=True),
        sa.Column("user_id",    sa.Integer(),    sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title",      sa.String(300),  nullable=False),
        sa.Column("subject",    sa.String(200),  nullable=False),
        sa.Column("priority",   sa.String(10),   nullable=False, server_default="medium"),
        sa.Column("deadline",   sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration",   sa.Float(),      nullable=False, server_default="1.0"),
        sa.Column("status",     sa.String(20),   nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tasks_id",      "tasks", ["id"],      unique=False)
    op.create_index("ix_tasks_user_id", "tasks", ["user_id"], unique=False)


def downgrade() -> None:
    # Drop in reverse dependency order
    op.drop_table("tasks")
    op.drop_table("quiz_questions")
    op.drop_table("quizzes")
    op.drop_table("flashcards")
    op.drop_table("document_chunks")
    op.drop_table("documents")
    op.drop_table("users")
