from app.models.dashboard_model import find_profile_by_user_id, find_recent_sessions, record_game_session, serialize_dashboard_profile, upsert_profile
from app.models.user_model import find_user_by_id, serialize_user, update_user_profile
from app.services.db_service import get_db


def _build_games():
    return [
        {"title": "Coffee with Interview Arena", "detail": "Start with a calm conversational round built for warm-up practice.", "route": "/dashboard/game1", "icon": "book-open-check"},
        {"title": "Salary Negotiator Poker", "detail": "Learn salary negotiation in a poker-style game with resume-based salary guidance.", "route": "/dashboard/game2", "icon": "bar-chart-3"},
        {"title": "Articulate Master", "detail": "Sharpen clear answers, tighter structure, and polished interview delivery.", "route": "/game3/session", "icon": "brain"},
        {"title": "GOOGLY MASTER", "detail": "Read tricky questions, spot the trap, and lock in your confidence bet.", "route": "/game4/session", "icon": "gamepad-2"},
    ]


def _build_leaderboard(current_user_id: str, current_user_name: str, current_user_points: int):
    db = get_db()
    users_collection = db["users"]
    profiles_collection = db["dashboard_profiles"]

    user_rows = list(users_collection.find({}, {"email": 1, "name": 1, "created_at": 1}))
    user_ids = [str(row["_id"]) for row in user_rows]
    profile_rows = list(profiles_collection.find({"user_id": {"$in": user_ids}}, {"user_id": 1, "arena_points": 1, "completed_games": 1}))

    profile_map = {row["user_id"]: row for row in profile_rows}
    leaderboard_rows = []

    for user in user_rows:
        user_id = str(user["_id"])
        profile = profile_map.get(user_id, {})
        points = int(profile.get("arena_points", 0) or 0)
        completed_games = int(profile.get("completed_games", 0) or 0)
        name = (user.get("name") or user.get("email") or "Player").strip()
        leaderboard_rows.append(
            {
                "user_id": user_id,
                "name": name,
                "points": points,
                "completed_games": completed_games,
                "is_current_user": user_id == current_user_id,
            }
        )

    if current_user_id not in {row["user_id"] for row in leaderboard_rows}:
        leaderboard_rows.append(
            {
                "user_id": current_user_id,
                "name": current_user_name,
                "points": current_user_points,
                "completed_games": 0,
                "is_current_user": True,
            }
        )

    leaderboard_rows.sort(
        key=lambda row: (
            -int(row.get("points", 0) or 0),
            -int(row.get("completed_games", 0) or 0),
            str(row.get("name", "")).lower(),
        )
    )

    ranked_rows = []
    current_rank = None
    for index, row in enumerate(leaderboard_rows[:10], start=1):
        ranked_row = {
            "rank": index,
            "name": row["name"],
            "points": int(row["points"]),
        }
        if row.get("is_current_user"):
            ranked_row["is_current_user"] = True
            current_rank = index
        ranked_rows.append(ranked_row)

    return ranked_rows, current_rank


def _normalize_profile_snapshot(profile_data: dict) -> dict:
    snapshot = dict(profile_data)
    if not snapshot.get("recent_sessions") and not snapshot.get("last_activity_at"):
        snapshot["streak_days"] = 0
        snapshot["arena_points"] = 0
        snapshot["completed_games"] = 0
        snapshot["weekly_progress"] = 0
        snapshot["focus_areas"] = snapshot.get("focus_areas") or snapshot.get("problems") or []
    return snapshot


def save_dashboard_profile(user_id: str, profile_data: dict):
    user_name = profile_data.get("name")
    if user_name is not None:
        update_user_profile(user_id, name=str(user_name))

    profile = upsert_profile(user_id, profile_data)
    return {
        "user": serialize_user(find_user_by_id(user_id)),
        "profile": _normalize_profile_snapshot(serialize_dashboard_profile(profile)),
    }


def get_dashboard_profile(user_id: str):
    profile = find_profile_by_user_id(user_id)
    if not profile:
        return None
    return _normalize_profile_snapshot(serialize_dashboard_profile(profile))


def get_dashboard_overview(user_id: str):
    user = find_user_by_id(user_id)
    if not user:
        return None

    profile = find_profile_by_user_id(user_id)
    if not profile:
        profile = upsert_profile(
            user_id,
            {
                "goal": "",
                "user_type": "",
                "problems": [],
            },
        )

    profile_data = _normalize_profile_snapshot(serialize_dashboard_profile(profile))
    user_data = serialize_user(user)

    focus_areas = profile_data["focus_areas"] or profile_data["problems"]
    current_points = profile_data["arena_points"]
    recent_sessions = find_recent_sessions(user_id, limit=5)

    if recent_sessions:
        next_session = []
        for item in recent_sessions[:3]:
            title = item.get("title") or "Recent session"
            summary = item.get("summary") or "Review your latest performance."
            next_session.append({"label": f"Review {title}", "detail": summary})
    else:
        next_session = [
            {"label": "Warm up", "detail": "Complete one focused session to establish a new baseline."},
            {"label": "Practice", "detail": "Work on your weakest focus area from onboarding."},
            {"label": "Review", "detail": "Check the latest feedback and adjust your next round."},
        ]

    leaderboard, current_rank = _build_leaderboard(user_id, user_data["name"], current_points)

    profile_data["leaderboard_rank"] = current_rank or 0

    return {
        "user": {
            **user_data,
            "goal": profile_data["goal"],
            "user_type": profile_data["user_type"],
            "problems": focus_areas,
        },
        "stats": {
            "streak_days": profile_data["streak_days"],
            "arena_points": current_points,
            "focus_area_count": len(focus_areas),
            "completed_games": profile_data["completed_games"],
            "weekly_progress": profile_data["weekly_progress"],
        },
        "focus_areas": focus_areas,
        "next_session": next_session,
        "games": _build_games(),
        "leaderboard": leaderboard,
        "profile": profile_data,
    }


def record_activity(user_id: str, session_data: dict):
    profile = record_game_session(user_id, session_data)
    if not profile:
        return None
    return _normalize_profile_snapshot(serialize_dashboard_profile(profile))


def update_dashboard_profile(user_id: str, profile_data: dict):
    return save_dashboard_profile(user_id, profile_data)
