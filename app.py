import os

from flask import Flask, jsonify

from config import Config
from extensions import db, login_manager


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    instance_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance")
    os.makedirs(instance_dir, exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)

    from auth.routes import auth_bp
    from main.routes import main_bp
    from api.routes import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/health")
    def health():
        """Simple health check endpoint used for uptime/monitoring checks."""
        return jsonify({"status": "ok"}), 200

    with app.app_context():
        from models import User

        db.create_all()
        _seed_default_user()

    return app


def _seed_default_user():
    from models import User

    if User.query.filter_by(username="admin").first() is None:
        admin = User(username="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
