from flask import Flask, render_template, request
from markupsafe import escape
import pandas as pd
import os

app = Flask(__name__)
EXCEL_PATH = 'budzet.xlsx'

months_order = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
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

def preprocess_data(df):
    required_cols = ['Data wystawienia', 'Kwota netto', 'Etykiety']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Brak wymaganej kolumny: {col}")
    df['Data wystawienia'] = pd.to_datetime(df['Data wystawienia'], errors='coerce')
    df['Miesiąc'] = df['Data wystawienia'].dt.month_name().map(month_map)
    df['Kwota netto'] = pd.to_numeric(df['Kwota netto'], errors='coerce').fillna(0)
    df['Etykiety_proc'] = df['Etykiety'].str.strip().str.upper()
    return df

def format_number(val):
    import math
    if val is None:
        return ''
    try:
        if isinstance(val, float) and math.isnan(val):
            return ''
        return f"{val:,.2f}".replace(",", " ").replace(".", ",")
    except Exception:
        return ''

@app.template_filter('format_number')
def jinja_format_number(val):
    if val == 0:
        return ''
    return format_number(val)

@app.route('/', methods=['GET'])
def home():
    return analiza()

@app.route('/dashboard', methods=['GET'])
def dashboard():
    typ = request.args.get('typ', 'Przychody')
    if not os.path.exists(EXCEL_PATH):
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc')
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name=typ)
        df = preprocess_data(df)
    except Exception as e:
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc', error=str(e))
    if df.empty or 'Etykiety' not in df.columns:
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc', error='Brak danych w pliku budżetu!')
    unique_branches = df[['Etykiety', 'Etykiety_proc']].drop_duplicates()
    branches = unique_branches['Etykiety'].tolist()
    etykieta_map = dict(zip(unique_branches['Etykiety'], unique_branches['Etykiety_proc']))
    branch_org = request.args.get('branch', branches[0] if branches else '')
    branch_proc = etykieta_map.get(branch_org, branch_org)
    branch_df = df[df['Etykiety_proc'] == branch_proc]
    if branch_df.empty:
        pivot = {}
        suma_row_list = [0]*len(months_order) + [0]
        kontrahenci_sorted = []
    else:
        pt = branch_df.pivot_table(index='Kontrahent', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
        pt = pt.reindex(columns=months_order, fill_value=0)
        pt['Suma roczna'] = pt.sum(axis=1)
        suma_row = pt[months_order].sum(axis=0)
        suma_roczna = pt['Suma roczna'].sum()
        suma_row_list = list(suma_row) + [suma_roczna]
        sort_by = request.args.get('sort_by', 'Suma roczna')
        sort_order = request.args.get('sort_order', 'desc')
        if sort_by == 'Kontrahent':
            kontrahenci_sorted = sorted(pt.index.tolist(), reverse=(sort_order=='desc'))
        elif sort_by in months_order + ['Suma roczna']:
            kontrahenci_sorted = pt.sort_values(by=sort_by, ascending=(sort_order=='asc')).index.tolist()
        else:
            kontrahenci_sorted = pt.index.tolist()
        pivot = {k: {m: pt.loc[k, m] for m in months_order} | {'Suma roczna': pt.loc[k, 'Suma roczna']} for k in pt.index}
    html_args = dict(
        typ=typ,
        branches=branches,
        branch=branch_org,
        months_order=months_order,
        suma_row_list=suma_row_list,
        kontrahenci_sorted=kontrahenci_sorted,
        pivot=pivot,
        sort_by=request.args.get('sort_by', 'Suma roczna'),
        sort_order=request.args.get('sort_order', 'desc')
    )
    return render_template('analiza.html', **html_args)

@app.route('/analiza', methods=['GET'])
def analiza():
    typ = request.args.get('typ', 'Przychody')
    if not os.path.exists(EXCEL_PATH):
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc')
    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name=typ)
        df = preprocess_data(df)
    except Exception as e:
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc', error=str(e))
    if df.empty or 'Etykiety' not in df.columns:
        return render_template('analiza.html', typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc', error='Brak danych w pliku budżetu!')
    unique_branches = df[['Etykiety', 'Etykiety_proc']].drop_duplicates()
    branches = unique_branches['Etykiety'].tolist()
    etykieta_map = dict(zip(unique_branches['Etykiety'], unique_branches['Etykiety_proc']))
    branch_org = request.args.get('branch', branches[0] if branches else '')
    branch_proc = etykieta_map.get(branch_org, branch_org)
    branch_df = df[df['Etykiety_proc'] == branch_proc]
    if branch_df.empty:
        pivot = {}
        suma_row_list = [0]*len(months_order) + [0]
        kontrahenci_sorted = []
    else:
        pt = branch_df.pivot_table(index='Kontrahent', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
        pt = pt.reindex(columns=months_order, fill_value=0)
        pt['Suma roczna'] = pt.sum(axis=1)
        suma_row = pt[months_order].sum(axis=0)
        suma_roczna = pt['Suma roczna'].sum()
        suma_row_list = list(suma_row) + [suma_roczna]
        sort_by = request.args.get('sort_by', 'Suma roczna')
        sort_order = request.args.get('sort_order', 'desc')
        if sort_by == 'Kontrahent':
            kontrahenci_sorted = sorted(pt.index.tolist(), reverse=(sort_order=='desc'))
        elif sort_by in months_order + ['Suma roczna']:
            kontrahenci_sorted = pt.sort_values(by=sort_by, ascending=(sort_order=='asc')).index.tolist()
        else:
            kontrahenci_sorted = pt.index.tolist()
        pivot = {k: {m: pt.loc[k, m] for m in months_order} | {'Suma roczna': pt.loc[k, 'Suma roczna']} for k in pt.index}
    html_args = dict(
        typ=typ,
        branches=branches,
        branch=branch_org,
        months_order=months_order,
        suma_row_list=suma_row_list,
        kontrahenci_sorted=kontrahenci_sorted,
        pivot=pivot,
        sort_by=request.args.get('sort_by', 'Suma roczna'),
        sort_order=request.args.get('sort_order', 'desc')
    )
    return render_template('analiza.html', **html_args)

@app.route('/podsumowanie', methods=['GET'])
def podsumowanie():
    if not os.path.exists(EXCEL_PATH):
        return render_template('podsumowanie.html', summary_income=[], summary_expense=[])
    try:
        df_income = pd.read_excel(EXCEL_PATH, sheet_name='Przychody')
        df_expense = pd.read_excel(EXCEL_PATH, sheet_name='Wydatki')
        df_income = preprocess_data(df_income)
        df_expense = preprocess_data(df_expense)
    except Exception as e:
        return render_template('podsumowanie.html', summary_income=[], summary_expense=[], error=str(e))
    # Sumy przychodów wg gałęzi
    summary_income = df_income.groupby('Etykiety')['Kwota netto'].sum().reset_index()
    summary_income['Etykieta_org'] = summary_income['Etykiety']
    # Sumy wydatków wg gałęzi
    summary_expense = df_expense.groupby('Etykiety')['Kwota netto'].sum().reset_index()
    summary_expense['Etykieta_org'] = summary_expense['Etykiety']
    # Pivot: przychody wg gałęzi i miesięcy
    pivot_income = df_income.pivot_table(index='Etykiety', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
    pivot_income = pivot_income.reindex(columns=months_order, fill_value=0)
    pivot_income['Suma roczna'] = pivot_income.sum(axis=1)
    pivot_income_dict = {row: [pivot_income.loc[row, m] for m in months_order] + [pivot_income.loc[row, 'Suma roczna']] for row in pivot_income.index}
    # Pivot: wydatki wg gałęzi i miesięcy
    pivot_expense = df_expense.pivot_table(index='Etykiety', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
    pivot_expense = pivot_expense.reindex(columns=months_order, fill_value=0)
    pivot_expense['Suma roczna'] = pivot_expense.sum(axis=1)
    pivot_expense_dict = {row: [pivot_expense.loc[row, m] for m in months_order] + [pivot_expense.loc[row, 'Suma roczna']] for row in pivot_expense.index}
    # Sumy przychodów wg miesięcy
    summary_income_month = df_income.groupby('Miesiąc')['Kwota netto'].sum().reindex(months_order, fill_value=0).reset_index()
    # Sumy wydatków wg miesięcy
    summary_expense_month = df_expense.groupby('Miesiąc')['Kwota netto'].sum().reindex(months_order, fill_value=0).reset_index()
    return render_template(
        'podsumowanie.html',
        summary_income=summary_income,
        summary_expense=summary_expense,
        summary_income_month=summary_income_month,
        summary_expense_month=summary_expense_month,
        months_order=months_order,
        pivot_income=pivot_income_dict,
        pivot_expense=pivot_expense_dict,
    )

@app.route('/wynagrodzenia', methods=['GET'])
def wynagrodzenia():
    # Zawsze używaj arkusza 'Wydatki', ignoruj parametr 'typ'
    if not os.path.exists(EXCEL_PATH):
        return render_template('wynagrodzenia.html', wynagrodzenia_podzial={}, suma_wyplat=0)
    try:
        df_wyd = pd.read_excel(EXCEL_PATH, sheet_name='Wydatki')
    except Exception as e:
        return render_template('wynagrodzenia.html', wynagrodzenia_podzial={}, suma_wyplat=0, error=str(e))
    if df_wyd.empty or 'Etykiety' not in df_wyd.columns or 'Kwota netto' not in df_wyd.columns or 'Kontrahent' not in df_wyd.columns:
        return render_template('wynagrodzenia.html', wynagrodzenia_podzial={}, suma_wyplat=0, error='Brak danych w arkuszu Wydatki!')
    df_wyd['Etykiety_proc'] = df_wyd['Etykiety'].str.strip().str.upper()
    df_wyd['Kwota netto'] = pd.to_numeric(df_wyd['Kwota netto'], errors='coerce').fillna(0)
    # Filtrowanie tylko wynagrodzeń
    df_wyn = df_wyd[df_wyd['Etykiety_proc'] == 'WYPŁATY'].copy()
    df_wyn['Data wystawienia'] = pd.to_datetime(df_wyn['Data wystawienia'], errors='coerce')
    df_wyn['Miesiąc'] = df_wyn['Data wystawienia'].dt.month_name().map(month_map)
    months_order_local = months_order
    # Pivot: osoba x miesiąc
    pivot = df_wyn.pivot_table(index='Kontrahent', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
    pivot = pivot.reindex(columns=months_order_local, fill_value=0)
    pivot['Suma roczna'] = pivot.sum(axis=1)
    wynagrodzenia_podzial = {osoba: [pivot.loc[osoba, m] for m in months_order_local] + [pivot.loc[osoba, 'Suma roczna']] for osoba in pivot.index}
    suma_wyplat = df_wyn['Kwota netto'].sum()
    return render_template(
        'wynagrodzenia.html',
        wynagrodzenia_podzial=wynagrodzenia_podzial,
        suma_wyplat=suma_wyplat,
        months_order=months_order_local
    )

if __name__ == '__main__':
    import webbrowser
    webbrowser.open('http://127.0.0.1:5000/')
    app.run(debug=True)
