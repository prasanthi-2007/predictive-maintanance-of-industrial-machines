import pandas as pd
import numpy as np
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score, mean_absolute_error, r2_score

def train_and_evaluate():
    data_path = 'ml_engine/data/sensor_telemetry.csv'
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data file not found at {data_path}. Run data_generator.py first.")
        
    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records for training.")
    
    feature_cols = [
        'operating_hours', 'load_percent', 'temperature', 
        'vibration', 'vibration_freq', 'pressure', 'acoustic', 'rpm'
    ]
    
    X = df[feature_cols]
    y_mode = df['failure_mode']
    y_failure = df['is_failure']
    y_rul = df['rul_hours']
    
    # Train test splits
    X_train, X_test, y_mode_train, y_mode_test, y_rul_train, y_rul_test = train_test_split(
        X, y_mode, y_rul, test_size=0.2, random_state=42, stratify=y_mode
    )
    
    # 1. Multi-class Failure Mode Classifier
    print("Training Failure Mode Classifier (RandomForestClassifier)...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_mode_train)
    
    y_mode_pred = clf.predict(X_test)
    acc = accuracy_score(y_mode_test, y_mode_pred)
    f1 = f1_score(y_mode_test, y_mode_pred, average='weighted')
    report = classification_report(y_mode_test, y_mode_pred, output_dict=True)
    conf_mat = confusion_matrix(y_mode_test, y_mode_pred, labels=clf.classes_).tolist()
    
    print(f"Classification Accuracy: {acc*100:.2f}% | F1-Score: {f1:.4f}")
    
    # Feature Importances
    importances = dict(zip(feature_cols, clf.feature_importances_.round(4).tolist()))
    print("Feature Importances:", importances)
    
    # 2. Remaining Useful Life (RUL) Regressor
    print("Training Remaining Useful Life Regressor (RandomForestRegressor)...")
    reg = RandomForestRegressor(n_estimators=80, max_depth=10, random_state=42, n_jobs=-1)
    reg.fit(X_train, y_rul_train)
    
    y_rul_pred = reg.predict(X_test)
    mae = mean_absolute_error(y_rul_test, y_rul_pred)
    r2 = r2_score(y_rul_test, y_rul_pred)
    
    print(f"RUL MAE: {mae:.2f} hours | R2 Score: {r2:.4f}")
    
    # Save python joblib artifacts
    os.makedirs('ml_engine/models', exist_ok=True)
    joblib_path = 'ml_engine/models/predictive_maintenance_models.joblib'
    joblib.dump({
        'classifier': clf,
        'regressor': reg,
        'feature_cols': feature_cols,
        'classes': clf.classes_.tolist()
    }, joblib_path)
    print(f"Saved model package to {joblib_path}")
    
    # Export metrics JSON
    metrics_payload = {
        'model_name': 'RandomForest Multi-Sensor Predictive Maintenance System',
        'dataset_size': len(df),
        'train_size': len(X_train),
        'test_size': len(X_test),
        'features': feature_cols,
        'classes': clf.classes_.tolist(),
        'classification_accuracy': round(float(acc), 4),
        'classification_f1_weighted': round(float(f1), 4),
        'classification_report': report,
        'confusion_matrix': conf_mat,
        'feature_importances': importances,
        'rul_mae_hours': round(float(mae), 2),
        'rul_r2_score': round(float(r2), 4)
    }
    
    metrics_path = 'ml_engine/models/model_metrics.json'
    with open(metrics_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Saved model metrics report to {metrics_path}")

    # Generate lightweight browser-embeddable decision rules
    generate_js_rules_engine(clf, reg, feature_cols, clf.classes_.tolist(), importances, metrics_payload)

def generate_js_rules_engine(clf, reg, feature_cols, classes, feature_importances, metrics):
    """Create lightweight JS rules for standalone browser client-side inference."""
    js_metadata = {
        'classes': classes,
        'features': feature_cols,
        'feature_importances': feature_importances,
        'metrics': {
            'accuracy': metrics['classification_accuracy'],
            'f1_score': metrics['classification_f1_weighted'],
            'rul_mae': metrics['rul_mae_hours'],
            'r2_score': metrics['rul_r2_score']
        }
    }
    
    rules_path = 'ml_engine/models/model_browser_metadata.json'
    with open(rules_path, 'w') as f:
        json.dump(js_metadata, f, indent=2)
    print(f"Saved browser metadata to {rules_path}")

if __name__ == '__main__':
    train_and_evaluate()
