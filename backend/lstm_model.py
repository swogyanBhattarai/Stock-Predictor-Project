import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, Activation
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.feature_selection import SelectKBest, f_regression
from flask import Flask, request, jsonify
import plotly.graph_objects as go
import plotly.io as pio

actual_stock = []
prediction_results = []
future_forecast = []
model_accuracy = 0.0
latest_dataframe = None

def create_sequences(data, window_size):
    X, y = [], []
    for i in range(window_size, len(data)):
        X.append(data[i-window_size:i])
        y.append(data[i, [0, 1, 2]])  # Predicting Close, High, Low
    return np.array(X), np.array(y)

def inverse_transform_columns(scaler, data):
    dummy = np.zeros((len(data), scaler.n_features_in_))
    dummy[:, [0, 1, 2]] = data
    inversed = scaler.inverse_transform(dummy)
    return inversed[:, [0, 1, 2]]  # Close, High, Low

def estimate_open_prices(df):
    open_prices = [df['CLOSE PRICE'].iloc[0]]  # Use first close as first open
    open_prices.extend(df['CLOSE PRICE'].shift(1).iloc[1:])
    df['OPEN PRICE'] = open_prices
    return df

def plot_candlestick(df, title, col_prefix='', show_confidence=False): 
    fig = go.Figure(data=[go.Candlestick(
        x=df['BUSINESS DATE'],
        open=df[f'{col_prefix}OPEN PRICE'],
        high=df[f'{col_prefix}HIGH PRICE'],
        low=df[f'{col_prefix}LOW PRICE'],
        close=df[f'{col_prefix}CLOSE PRICE']
    )])

    fig.update_layout(title=title, xaxis_title='Date', yaxis_title='Price')
    html = pio.to_html(fig, full_html=False, include_plotlyjs='cdn')
    return html

def plot_predicted_candlestick(dates, opens, predictions):
    predicted_df = pd.DataFrame({
        'BUSINESS DATE': dates,
        'OPEN PRICE': opens,
        'CLOSE PRICE': predictions[:, 0],
        'HIGH PRICE': predictions[:, 1],
        'LOW PRICE': predictions[:, 2],
    })
    plot_candlestick(predicted_df, '📈 Predicted Candlestick Chart')

def run_prediction_pipeline(filepath):
    window_size = 20
    global latest_dataframe
    print(f"\n🔍 Processing: {filepath}")

    df = pd.read_csv(filepath)
    df = df.sort_values('BUSINESS DATE')
    df = estimate_open_prices(df)

    global actual_stock, prediction_results, future_forecast, model_accuracy

    recent_rows = df 

    for _, row in recent_rows.iterrows():
        actual_stock.append({
            'date': row['BUSINESS DATE'],
            'open': row['OPEN PRICE'],
            'high': row['HIGH PRICE'],
            'low': row['LOW PRICE'],
            'close': row['CLOSE PRICE'],
            'volume': row.get('TOTAL TRADED QUANTITY', 0)
        })

    features = ['CLOSE PRICE', 'HIGH PRICE', 'LOW PRICE', 'TOTAL TRADED QUANTITY']
    data = df[features].dropna().copy()

    y_target = data['CLOSE PRICE']
    X_features = data.drop('CLOSE PRICE', axis=1)

    k = 3
    selector = SelectKBest(score_func=f_regression, k=k)
    X_selected = selector.fit_transform(X_features, y_target)

    mask = selector.get_support()
    selected_features = X_features.columns[mask].tolist()
    print(f"Top {k} selected features: {selected_features}")

    filtered_df = df[['CLOSE PRICE'] + selected_features].copy()
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(filtered_df)

    X, y = create_sequences(scaled_data, window_size)
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    # Build Model
    model = Sequential()
    model.add(LSTM(50, return_sequences=False, input_shape=(X.shape[1], X.shape[2])))
    model.add(Dropout(0.4))
    model.add(Dense(3)) 
    model.add(Activation('relu'))  
    model.compile(optimizer='adam', loss='mean_squared_error')
    
    early_stop = EarlyStopping(
    monitor='val_loss',
    patience=20,
    restore_best_weights=True
    )
    
    model.fit(X_train, y_train, epochs=500, batch_size=8, validation_data=(X_test, y_test), callbacks=[early_stop],verbose=0)

    model_filename = filepath.split('/')[-1].replace('.csv', '_model.h5')
    model.save(model_filename)

    # Prediction
    predictions = model.predict(X_test)
    
    for i, entry in enumerate(actual_stock):
        if i == 0:
            entry['open'] = entry['close']  # First open = first close
        else:
            entry['open'] = actual_stock[i-1]['close']  # Subsequent opens = previous close
    
    y_test_inv = inverse_transform_columns(scaler, y_test)
    predictions_inv = inverse_transform_columns(scaler, predictions)
    r2 = r2_score(y_test_inv, predictions_inv)
    print(f"Accuracy: {r2*100:.2f}%")

    # Predict next day for each input sequence
    all_preds = []
    opens = []
    dates = []
    for i in range(window_size, len(scaled_data) - 1):
        seq = scaled_data[i - window_size:i]
        seq = np.expand_dims(seq, axis=0)
        pred_scaled = model.predict(seq, verbose=0)[0]
        pred = inverse_transform_columns(scaler, [pred_scaled])[0]
        all_preds.append(pred)
        opens.append(df['OPEN PRICE'].iloc[i + 1])
        dates.append(df['BUSINESS DATE'].iloc[i + 1])

    all_preds = np.array(all_preds)

    # Plot actual candlestick chart
    # plot_candlestick(df, f'📊 Actual Candlestick Chart - {filepath}')

    # Set OPEN PRICE as previous predicted CLOSE
    opens = [df['CLOSE PRICE'].iloc[window_size - 1]]  # First open = last known close
    for i in range(1, len(all_preds)):
        opens.append(all_preds[i - 1][0])  # Previous day's predicted close

    # Plot predicted candlestick chart with corrected OPEN PRICES
    # plot_predicted_candlestick(dates, opens, all_preds)

    for i, (d, p) in enumerate(zip(dates, all_preds)):
        prediction_results.append({
            "date": d,
            "open": float(opens[i]),
            "high": float(p[1]),
            "low": float(p[2]),
            "close": float(p[0]),
            "volume": float(df['TOTAL TRADED QUANTITY'].iloc[i + window_size]) if 'TOTAL TRADED QUANTITY' in df.columns else 0
        })
    model_accuracy = round(r2 * 100, 2)

    future_days = 5 
    future_preds = []
    last_sequence = scaled_data[-window_size:].copy()

    num_simulations = 50
    all_paths = []

    for sim in range(num_simulations):
        sim_sequence = last_sequence.copy()
        sim_preds = []

        for _ in range(future_days):
            input_seq = np.expand_dims(sim_sequence, axis=0)
            pred_scaled = model.predict(input_seq, verbose=0)[0]

            # Add randomness based on historical volatility
            volatility = np.std(scaled_data[:, 0])
            pred_scaled += np.random.normal(0, volatility * 0.3, pred_scaled.shape)
            pred_scaled = np.clip(pred_scaled, a_min=0, a_max=None)

            pred_actual = inverse_transform_columns(scaler, [pred_scaled])[0]
            sim_preds.append(pred_actual)

            # Create a new row with predicted values
            new_row = np.zeros((sim_sequence.shape[1],))
            new_row[0:3] = pred_scaled[0:3]

            # Estimate volume
            price_change = abs(pred_scaled[0] - sim_sequence[-1][0])
            mean_diff = np.mean(np.abs(np.diff(scaled_data[:, 0])))
            vol_scale = 1.0 + (price_change / (mean_diff + 1e-8))
            new_row[3] = sim_sequence[-1][3] * vol_scale * np.random.uniform(0.7, 1.3)

            sim_sequence = np.vstack([sim_sequence[1:], new_row])

        all_paths.append(sim_preds)

    mean_preds = np.mean(all_paths, axis=0)

    # Future dates
    future_dates = pd.date_range(start=df['BUSINESS DATE'].iloc[-1], periods=future_days + 1, freq='B')[1:]
    future_df = pd.DataFrame(mean_preds, columns=['CLOSE PRICE', 'HIGH PRICE', 'LOW PRICE'])
    future_df['BUSINESS DATE'] = future_dates
    future_df['OPEN PRICE'] = future_df['CLOSE PRICE'].shift(1)
    future_df.loc[0, 'OPEN PRICE'] = df.loc[df.index[-1], 'CLOSE PRICE']

    # Confidence intervals
    paths_array = np.array(all_paths)
    future_df['LOWER_BOUND'] = np.percentile(paths_array[:, :, 0], 10, axis=0)
    future_df['UPPER_BOUND'] = np.percentile(paths_array[:, :, 0], 90, axis=0)

    # Save CSV
    future_filename = os.path.basename(filepath)
    save_path = os.path.join('./future_predictions', f'future_{future_filename}')
    os.makedirs('./future_predictions', exist_ok=True)
    future_df.to_csv(save_path, index=False)
    print(f"✅ Saved future predictions to: {save_path}")
    
    latest_dataframe = df
    
    # Store future forecast for API access
    future_forecast = []
    for row in future_df.to_dict(orient='records'):
      future_forecast.append({
          'date': row['BUSINESS DATE'],
          'open': row['OPEN PRICE'],
          'high': row['HIGH PRICE'],
          'low': row['LOW PRICE'],
          'close': row['CLOSE PRICE'],
          'lowerBound': row['LOWER_BOUND'],
          'upperBound': row['UPPER_BOUND'],
          'volume': row.get('TOTAL TRADED QUANTITY', 0),  
      })


if __name__ == "__main__":
    run_prediction_pipeline()
