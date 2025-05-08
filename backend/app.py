# backend/app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import lstm_model

app = Flask(__name__)
CORS(app)  # Allow requests from frontend


@app.route('/')
def home():
    return "✅ LSTM Stock API is running!"

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    filename = file.filename
    save_path = os.path.join('./datasets', filename)
    os.makedirs('./datasets', exist_ok=True)
    file.save(save_path)

    lstm_model.run_prediction_pipeline(save_path)  # This sets prediction_results, actual_stock, etc.

    return jsonify({
        'original': lstm_model.actual_stock,
        'prediction': lstm_model.future_forecast
    }), 200


@app.route('/predict', methods=['GET'])
def get_predictions():
    return jsonify({"prediction": lstm_model.prediction_results})

@app.route('/future', methods=['GET'])
def get_forecast():
    return jsonify({'forecast': lstm_model.future_forecast})

@app.route('/accuracy', methods=['GET'])
def get_accuracy():
    return jsonify({'accuracy': lstm_model.model_accuracy})

@app.route('/actual', methods=['GET'])
def get_actual():
    return jsonify({"actual": lstm_model.actual_stock})

@app.route('/api/chart-html')
def get_candlestick_html():
    global latest_dataframe
    if latest_dataframe is None:
        return jsonify({"error": "No chart data available"}), 404
    
    html = lstm_model.plot_candlestick(latest_dataframe, "📊 Actual Candlestick Chart")
    return jsonify({"html": html})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
