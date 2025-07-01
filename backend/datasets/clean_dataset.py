import pandas as pd

# Load the original CSV
df = pd.read_csv("stock_adbl.csv")

# Strip whitespace from column names
df.columns = df.columns.str.strip()

print("Original rows:", len(df))

# Drop rows with any missing values
df.dropna(inplace=True)
print("After dropping missing values:", len(df))

# Clean commas from numeric columns
numeric_cols = ['LTP', 'High', 'Low', 'Quantity', 'Trunover']
for col in numeric_cols:
    df[col] = df[col].astype(str).str.replace(',', '').str.strip()

# Parse Date column with mixed formats
df['Date'] = pd.to_datetime(df['Date'], format='mixed', errors='coerce')

# Drop rows with unparseable dates
df = df[df['Date'].notna()]
print("After parsing valid dates:", len(df))

# Drop duplicate dates (keep first occurrence)
df.drop_duplicates(subset=['Date'], keep='first', inplace=True)
print("After dropping duplicate dates:", len(df))

# Convert numeric columns
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Drop rows with invalid numeric data
df.dropna(subset=numeric_cols, inplace=True)
print("After cleaning numeric fields:", len(df))

# Format Date to YYYY-MM-DD
df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

# Build the final cleaned DataFrame
converted_df = pd.DataFrame({
    'BUSINESS DATE': df['Date'],
    'CLOSE PRICE': df['LTP'],
    'HIGH PRICE': df['High'],
    'LOW PRICE': df['Low'],
    'TOTAL TRADED QUANTITY': df['Quantity'],
    'TOTAL TRADED VALUE': df['Trunover'],
    'TOTAL TRADES': 0  # Placeholder
})

print("Final converted rows:", len(converted_df))
print(converted_df.head())

# Save to CSV
converted_df.to_csv("converted_dataset.csv", index=False)
print("✅ Cleaned and saved as 'converted_dataset.csv'")
