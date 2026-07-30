import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, computed_field, field_validator

from app.logo import company_logo_url

PageType = Literal["pricing", "changelog", "blog", "features", "other"]
ChangeCategory = Literal["pricing_change", "new_feature", "messaging_change", "promotion", "other"]


# ---------- Auth ----------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", value):
            raise ValueError("Password must contain a number")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    email: str
    demo_mode: bool


# ---------- Competitors / URLs ----------

class TrackedUrlCreate(BaseModel):
    url: str = Field(min_length=8, max_length=1000)
    page_type: PageType = "other"


class TrackedUrlUpdate(BaseModel):
    url: str | None = None
    page_type: PageType | None = None
    is_active: bool | None = None


class TrackedUrlOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    competitor_id: int
    url: str
    page_type: str
    is_active: bool
    last_checked_at: datetime | None
    last_status: str | None


class CompetitorCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    website: str = Field(min_length=4, max_length=500)
    notes: str | None = None
    color: str = "#6366f1"


class CompetitorUpdate(BaseModel):
    name: str | None = None
    website: str | None = None
    notes: str | None = None
    color: str | None = None


class CompetitorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    website: str
    notes: str | None
    color: str
    created_at: datetime
    tracked_urls: list[TrackedUrlOut] = []

    @computed_field
    @property
    def logo_url(self) -> str | None:
        return company_logo_url(self.website)


# ---------- Changes / AI ----------

class ChangeAnalysis(BaseModel):
    """Structured output the LLM must return for each detected change."""

    summary: str = Field(description="2-3 sentence summary of what changed and why it matters competitively")
    category: ChangeCategory
    impact_score: int = Field(ge=1, le=10, description="Competitive impact: 1 trivial, 10 urgent threat")
    recommended_action: str = Field(description="One concrete action the team should take")


class ChangeEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tracked_url_id: int
    detected_at: datetime
    summary: str | None
    category: str | None
    impact_score: int | None
    recommended_action: str | None
    analysis_status: str
    # enriched fields (populated in routers)
    competitor_id: int | None = None
    competitor_name: str | None = None
    competitor_color: str | None = None
    competitor_logo_url: str | None = None
    url: str | None = None
    page_type: str | None = None


class DiffLine(BaseModel):
    type: Literal["add", "del", "ctx", "hunk"]
    text: str


class DiffResponse(BaseModel):
    change_event_id: int
    old_fetched_at: datetime
    new_fetched_at: datetime
    lines: list[DiffLine]


class CheckRunResult(BaseModel):
    checked_urls: int
    errors: int
    new_changes: list[ChangeEventOut]


# ---------- Notifications ----------

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    change_event_id: int | None
    title: str
    body: str
    is_read: bool
    created_at: datetime


# ---------- Briefs ----------

class BriefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    period_days: int
    content_md: str
    generated_at: datetime


# ---------- Battlecard ----------

class BattlecardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    competitor_id: int
    content_md: str
    generated_at: datetime


# ---------- Next Move Predictor ----------

class PredictedMove(BaseModel):
    move: str = Field(description="The specific move the competitor is likely to make next")
    timeframe: str = Field(description="Expected window, e.g. '4-6 weeks'")
    confidence: int = Field(ge=0, le=100, description="Confidence percentage")
    rationale: str = Field(description="One sentence: which observed patterns support this prediction")


class PredictionAnalysis(BaseModel):
    """Structured output the LLM must return for the next-move prediction."""

    strategy_profile: str = Field(description="2-3 sentence 'Strategy DNA' profile of this competitor")
    threat_level: int = Field(ge=1, le=10, description="Overall competitive threat 1-10")
    moves: list[PredictedMove] = Field(description="The 3 most likely next moves, most likely first")


class PredictionOut(BaseModel):
    id: int
    competitor_id: int
    strategy_profile: str
    threat_level: int
    moves: list[PredictedMove]
    generated_at: datetime


# ---------- Ask Radar ----------

class AskMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class AskRequest(BaseModel):
    messages: list[AskMessage] = Field(min_length=1, max_length=20)


# ---------- War Room ----------

class WarRoomTurn(BaseModel):
    role: Literal["attacker", "defender", "verdict"]
    speaker: str
    text: str


class WarRoomOut(BaseModel):
    id: int
    competitor_id: int
    competitor_name: str
    competitor_color: str
    competitor_logo_url: str | None = None
    rounds: int
    transcript: list[WarRoomTurn]
    created_at: datetime


# ---------- Settings ----------

class SettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slack_webhook_url: str | None
    alert_impact_threshold: int


class SettingsUpdate(BaseModel):
    slack_webhook_url: str | None = None
    alert_impact_threshold: int | None = Field(default=None, ge=1, le=10)


# ---------- Stats ----------

class TimelineBucket(BaseModel):
    date: str
    count: int


class ImpactBucket(BaseModel):
    impact: int
    count: int


class StatsOverview(BaseModel):
    competitors: int
    tracked_urls: int
    changes_7d: int
    high_impact_7d: int
    timeline: list[TimelineBucket]
    impact_distribution: list[ImpactBucket]
