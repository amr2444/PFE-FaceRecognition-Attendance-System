CREATE INDEX idx_presence_jour_statut_creation_date
    ON presence_jour (statut, creation_date);

CREATE INDEX idx_entree_recente_date
    ON entree_recente (date);

CREATE INDEX idx_user_app_role_active
    ON user_app (role, active);
