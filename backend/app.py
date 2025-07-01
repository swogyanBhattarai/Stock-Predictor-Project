# backend/app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from models import db, User, Stock, TrainedModel, Transaction
import os
import lstm_model
from flask_bcrypt import Bcrypt
import jwt
import datetime
import json
import pandas as pd
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stock_predictor.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app)  # Allow requests from frontend


bcrypt = Bcrypt(app)
SECRET_KEY = "supersecterkey"

users_db = [ ]

def make_json_serializable(data):
    def convert(obj):
        if isinstance(obj, dict):
            return {k: convert(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert(v) for v in obj]
        elif isinstance(obj, (datetime.date, datetime.datetime, pd.Timestamp)):
            return obj.isoformat()
        return obj

    return convert(data)

def get_current_user():
    token = request.headers.get('Authorization')
    if not token:
        return None
    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user = User.query.filter_by(email=decoded['email']).first()
        return user
    except Exception:
        return None


@app.route('/')
def home():
    return "✅ LSTM Stock API is running!"

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 400

    password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(email=email, name=name, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Registered successfully'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode({
        'email': user.email,
        'name': user.name,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1) 
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({'token': token})

@app.route('/api/protected', methods=['GET'])
def protected():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Token missing'}), 403

    try:
        decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return jsonify({'message': f"Welcome {decoded['name']}!"})
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401


@app.route('/api/stocks', methods=['POST'])
def add_stock():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    symbol = data.get('symbol')
    name = data.get('name')

    if not symbol:
        return jsonify({'error': 'Symbol is required'}), 400

    existing = Stock.query.filter_by(user_id=user.id, symbol=symbol).first()
    if existing:
        return jsonify({'error': 'Stock already exists'}), 400

    stock = Stock(symbol=symbol, name=name, user_id=user.id)
    db.session.add(stock)
    db.session.commit()

    return jsonify({'message': 'Stock added', 'stock': {'id': stock.id, 'symbol': stock.symbol, 'name': stock.name}})

@app.route('/api/stocks/<int:stock_id>/transaction', methods=['POST'])
def add_transaction(stock_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found'}), 404

    data = request.get_json()
    t_type = data.get('type')
    quantity = data.get('quantity')
    price = data.get('price')

    if t_type not in ['buy', 'sell']:
        return jsonify({'error': 'Invalid transaction type'}), 400
    if not quantity or quantity <= 0:
        return jsonify({'error': 'Invalid quantity'}), 400
    if not price or price <= 0:
        return jsonify({'error': 'Invalid price'}), 400

    # Check if selling more than owned
    if t_type == 'sell':
        buys = [t for t in stock.transactions if t.type == 'buy']
        sells = [t for t in stock.transactions if t.type == 'sell']
        total_buys = sum(t.quantity for t in buys)
        total_sells = sum(t.quantity for t in sells)
        total_quantity = total_buys - total_sells
        if quantity > total_quantity:
            return jsonify({'error': "You don't have enough shares to sell"}), 400

    transaction = Transaction(
        stock_id=stock.id,
        type=t_type,
        quantity=quantity,
        price=price
    )
    db.session.add(transaction)
    db.session.commit()

    return jsonify({'message': 'Transaction added'})

@app.route('/api/stocks/<int:stock_id>', methods=['GET'])
def get_stock_details(stock_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found'}), 404

    transactions = [{
        'id': t.id,
        'type': t.type,
        'quantity': t.quantity,
        'price': t.price,
        'timestamp': t.timestamp.isoformat()
    } for t in stock.transactions]

    trained_models = [{
        'id': m.id,
        'filename': m.filename,
        'accuracy': m.accuracy,
        'upload_time': m.upload_time.isoformat()
    } for m in stock.trained_models]

    buys = [t for t in stock.transactions if t.type == 'buy']
    sells = [t for t in stock.transactions if t.type == 'sell']

    total_buys = sum(t.quantity for t in buys)
    total_sells = sum(t.quantity for t in sells)
    total_quantity = total_buys - total_sells
    total_buy_cost = sum(t.quantity * t.price for t in buys)
    avg_buy_price = (total_buy_cost / total_buys) if total_buys > 0 else 0

    return jsonify({
        'id': stock.id,
        'symbol': stock.symbol,
        'name': stock.name,
        'transactions': transactions,
        'trained_models': trained_models,
        'total_quantity': total_quantity,
        'average_buy_price': avg_buy_price
    })


@app.route('/api/stocks/<int:stock_id>/upload', methods=['POST'])
def upload_for_stock(stock_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    files = request.files.getlist('file')  # get list of files

    import pandas as pd

    dfs = []
    for file in files:
        try:
            df = pd.read_csv(file)
            dfs.append(df)
        except Exception as e:
            return jsonify({'error': f"Failed to read CSV file {file.filename}: {str(e)}"}), 400

    if not dfs:
        return jsonify({'error': 'No valid CSV files uploaded'}), 400

    # Concatenate all dataframes vertically, ignoring index for a clean join
    combined_df = pd.concat(dfs, ignore_index=True)

    # Sort by BUSINESS DATE
    if 'BUSINESS DATE' not in combined_df.columns:
        return jsonify({'error': 'BUSINESS DATE column missing in uploaded data'}), 400
    combined_df = combined_df.sort_values('BUSINESS DATE')

    combined_df = combined_df.drop_duplicates(subset='BUSINESS DATE', keep='last')

    if len(files) == 1:
        original_filename = secure_filename(files[0].filename)
        filename = f"{stock.symbol}_{original_filename}"
    else:
        filename = f"combined_{stock.symbol}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.csv"

    # Save combined CSV
    save_path = os.path.join('./datasets', filename)
    os.makedirs('./datasets', exist_ok=True)
    combined_df.to_csv(save_path, index=False)

    # Run your LSTM training/prediction pipeline on combined CSV
    lstm_model.run_prediction_pipeline(save_path)

    # Save trained model info to DB
    trained_model = TrainedModel(
        stock_id=stock.id,
        filename=filename,
        csv_path=open(save_path, 'rb').read(),  # read combined CSV bytes
        prediction_result=json.dumps(make_json_serializable(lstm_model.future_forecast)),
        accuracy=lstm_model.model_accuracy,
        original=json.dumps(make_json_serializable(lstm_model.actual_stock))
    )
    db.session.add(trained_model)
    db.session.commit()

    return jsonify({
        'original': lstm_model.actual_stock,
        'prediction': lstm_model.future_forecast,
        'accuracy': lstm_model.model_accuracy
    })


@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    stocks = Stock.query.filter_by(user_id=user.id).all()
    result = []

    for stock in stocks:
        buys = [t for t in stock.transactions if t.type == 'buy']
        sells = [t for t in stock.transactions if t.type == 'sell']

        total_buys = sum(t.quantity for t in buys)
        total_sells = sum(t.quantity for t in sells)
        total_quantity = total_buys - total_sells

        total_buy_cost = sum(t.quantity * t.price for t in buys)
        avg_buy_price = (total_buy_cost / total_buys) if total_buys > 0 else 0

        latest_model = TrainedModel.query.filter_by(stock_id=stock.id).order_by(TrainedModel.upload_time.desc()).first()

        # For now, set current price to avg_buy_price as placeholder
        current_price = avg_buy_price

        result.append({
            'id': stock.id,
            'symbol': stock.symbol,
            'name': stock.name,
            'total_quantity': total_quantity,
            'average_buy_price': avg_buy_price,
            'current_price': current_price,
            'latest_accuracy': latest_model.accuracy if latest_model else None,
            'latest_trained_model_id': latest_model.id if latest_model else None
        })

    return jsonify(result)

@app.route('/api/trained-models/<int:model_id>', methods=['GET'])
def get_trained_model_details(model_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    trained_model = TrainedModel.query.get(model_id)
    if not trained_model or trained_model.stock.user_id != user.id:
        return jsonify({'error': 'Not found'}), 404

    prediction = trained_model.prediction_result
    # You might want to also return original data if stored
    try:
        prediction = json.loads(prediction)  # <-- Parse JSON string to Python object
    except Exception:
        prediction = []
    
    return jsonify({
        'id': trained_model.id,
        'filename': trained_model.filename,
        'accuracy': trained_model.accuracy,
        'upload_time': trained_model.upload_time.isoformat(),
        'prediction': prediction,
        "original": trained_model.original
    })

@app.route('/api/trained-models/<int:model_id>', methods=['DELETE'])
def delete_trained_model(model_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    trained_model = TrainedModel.query.get(model_id)
    if not trained_model or trained_model.stock.user_id != user.id:
        return jsonify({'error': 'Not found'}), 404

    db.session.delete(trained_model)
    db.session.commit()
    return jsonify({'message': 'Trained model deleted successfully'})

@app.route('/api/stocks/<int:stock_id>', methods=['DELETE'])
def delete_stock(stock_id):
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    stock = Stock.query.filter_by(id=stock_id, user_id=user.id).first()
    if not stock:
        return jsonify({'error': 'Stock not found'}), 404

    # Delete related transactions
    for transaction in stock.transactions:
        db.session.delete(transaction)
    
    # Delete related trained models
    for model in stock.trained_models:
        db.session.delete(model)

    # Delete the stock itself
    db.session.delete(stock)
    db.session.commit()

    return jsonify({'message': 'Stock and all related data deleted successfully'})


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
    with app.app_context():
        db.create_all()
    app.run(debug=False, port=5000)
