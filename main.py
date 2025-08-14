'''
import pandas as pd

# Ścieżka do pliku Excel (zmień na własną)
EXCEL_PATH = 'budzet.xlsx'

# Funkcja do importu danych z dwóch arkuszy
def import_data(path):
    try:
        df_income = pd.read_excel(path, sheet_name='Przychody')
        df_expense = pd.read_excel(path, sheet_name='Wydatki')
    except Exception as e:
        print('Błąd podczas wczytywania pliku: {e}')
        return pd.DataFrame(), pd.DataFrame()
    print('Kolumny w arkuszu Przychody:', df_income.columns.tolist())
    print('Kolumny w arkuszu Wydatki:', df_expense.columns.tolist())
    print('Przykładowe wiersze Przychody:')
    print(df_income.head())
    print('Przykładowe wiersze Wydatki:')
    print(df_expense.head())
    return df_income, df_expense

def preprocess_data(df):
    # Walidacja wymaganych kolumn
    required_cols = ['Data wystawienia', 'Kwota netto', 'Etykiety']
    for col in required_cols:
        if col not in df.columns:
            print(f"Brak wymaganej kolumny: {col}")
            return df
    month_map = {
        'January': 'Styczeń',
        'February': 'Luty',
        'March': 'Marzec',
        'April': 'Kwiecień',
        'May': 'Maj',
        'June': 'Czerwiec',
        'July': 'Lipiec',
        'August': 'Sierpień',
        'September': 'Wrzesień',
        'October': 'Październik',
        'November': 'Listopad',
        'December': 'Grudzień'
    }
    df['Data wystawienia'] = pd.to_datetime(df['Data wystawienia'], errors='coerce')
    df['Miesiąc'] = df['Data wystawienia'].dt.month_name().map(month_map)
    df['Kwota netto'] = pd.to_numeric(df['Kwota netto'], errors='coerce').fillna(0)
    df['Etykiety_proc'] = df['Etykiety'].str.strip().str.upper()
    return df

def generate_dashboard(df, typ):
    months_order = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
    if df.empty or 'Etykiety_proc' not in df.columns or 'Kontrahent' not in df.columns:
        print(f'Brak danych lub wymaganych kolumn w zestawieniu: {typ}')
        return
    print(f'===== ZESTAWIENIE: {typ.upper()} =====')
    pt = df.pivot_table(index=['Etykiety_proc', 'Kontrahent'], columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
    pt = pt.reindex(columns=months_order, fill_value=0)
    pt['Suma'] = pt.sum(axis=1)
    for (branch, firm), row in pt.iterrows():
        print(f'--- {branch} ---')
        print(f'Firma: {firm}')
        for month in months_order:
            value = row[month]
            if value != 0:
                print(f'  {month}: {value:.2f} zł')
        print(f'  Suma: {row["Suma"]:.2f} zł\n')

# Przykład użycia
if __name__ == "__main__":
    df_income, df_expense = import_data(EXCEL_PATH)
    df_income = preprocess_data(df_income)
    df_expense = preprocess_data(df_expense)
    generate_dashboard(df_income, 'Przychody')
    generate_dashboard(df_expense, 'Wydatki')
'''