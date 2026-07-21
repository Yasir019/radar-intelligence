from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    competitors: Mapped[list["Competitor"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    briefs: Mapped[list["Brief"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    slack_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    alert_impact_threshold: Mapped[int] = mapped_column(Integer, default=7)

    user: Mapped[User] = relationship(back_populates="settings")


class Competitor(Base):
    __tablename__ = "competitors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    website: Mapped[str] = mapped_column(String(500))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(20), default="#6366f1")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="competitors")
    tracked_urls: Mapped[list["TrackedUrl"]] = relationship(back_populates="competitor", cascade="all, delete-orphan")


class TrackedUrl(Base):
    __tablename__ = "tracked_urls"

    id: Mapped[int] = mapped_column(primary_key=True)
    competitor_id: Mapped[int] = mapped_column(ForeignKey("competitors.id"), index=True)
    url: Mapped[str] = mapped_column(String(1000))
    page_type: Mapped[str] = mapped_column(String(30), default="other")  # pricing/changelog/blog/features/other
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_status: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    competitor: Mapped[Competitor] = relationship(back_populates="tracked_urls")
    snapshots: Mapped[list["Snapshot"]] = relationship(back_populates="tracked_url", cascade="all, delete-orphan")
    change_events: Mapped[list["ChangeEvent"]] = relationship(
        back_populates="tracked_url", cascade="all, delete-orphan"
    )


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    tracked_url_id: Mapped[int] = mapped_column(ForeignKey("tracked_urls.id"), index=True)
    content_hash: Mapped[str] = mapped_column(String(64))
    content_text: Mapped[str] = mapped_column(Text)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    tracked_url: Mapped[TrackedUrl] = relationship(back_populates="snapshots")


class ChangeEvent(Base):
    __tablename__ = "change_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    tracked_url_id: Mapped[int] = mapped_column(ForeignKey("tracked_urls.id"), index=True)
    old_snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"))
    new_snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"))
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(30), nullable=True)
    impact_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recommended_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    analysis_status: Mapped[str] = mapped_column(String(20), default="pending")  # pending/done/failed

    tracked_url: Mapped[TrackedUrl] = relationship(back_populates="change_events")
    old_snapshot: Mapped[Snapshot] = relationship(foreign_keys=[old_snapshot_id])
    new_snapshot: Mapped[Snapshot] = relationship(foreign_keys=[new_snapshot_id])


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    change_event_id: Mapped[int | None] = mapped_column(ForeignKey("change_events.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)

    user: Mapped[User] = relationship(back_populates="notifications")


class Brief(Base):
    __tablename__ = "briefs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    period_days: Mapped[int] = mapped_column(Integer, default=7)
    content_md: Mapped[str] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    user: Mapped[User] = relationship(back_populates="briefs")
