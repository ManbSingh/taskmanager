from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from extensions import db
from models import Task

api_bp = Blueprint("api", __name__)


def _validate_status(status):
    return status in Task.VALID_STATUSES


@api_bp.route("/tasks", methods=["GET"])
@login_required
def list_tasks():
    """List tasks for the current user. Supports ?q= search and ?status= filter."""
    query = Task.query.filter_by(user_id=current_user.id)

    search = request.args.get("q", "").strip()
    if search:
        like = f"%{search}%"
        query = query.filter(
            db.or_(Task.title.ilike(like), Task.description.ilike(like))
        )

    status = request.args.get("status", "").strip()
    if status:
        if not _validate_status(status):
            return jsonify(
                {"error": f"Invalid status filter. Must be one of {list(Task.VALID_STATUSES)}"}
            ), 400
        query = query.filter_by(status=status)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([t.to_dict() for t in tasks]), 200


@api_bp.route("/tasks/<int:task_id>", methods=["GET"])
@login_required
def get_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task.to_dict()), 200


@api_bp.route("/tasks", methods=["POST"])
@login_required
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    status = data.get("status", Task.STATUS_OPEN)

    if not title:
        return jsonify({"error": "Title is required"}), 400
    if not _validate_status(status):
        return jsonify(
            {"error": f"Invalid status. Must be one of {list(Task.VALID_STATUSES)}"}
        ), 400

    task = Task(
        title=title,
        description=description,
        status=status,
        user_id=current_user.id,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@api_bp.route("/tasks/<int:task_id>", methods=["PUT"])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400
        task.title = title

    if "description" in data:
        task.description = (data.get("description") or "").strip()

    if "status" in data:
        status = data.get("status")
        if not _validate_status(status):
            return jsonify(
                {"error": f"Invalid status. Must be one of {list(Task.VALID_STATUSES)}"}
            ), 400
        task.status = status

    db.session.commit()
    return jsonify(task.to_dict()), 200


@api_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200
