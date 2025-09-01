import io
import sys
import subprocess
from flask import Flask, request, session, send_file, send_from_directory, jsonify
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
import bcrypt
import pandas as pd
import os
from config import Config
from extensions import db
from models import User
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Initialize app - serve the build directory
app = Flask(__name__, static_folder='frontend/build', static_url_path='')
CORS(app, supports_credentials=True)
app.config.from_object(Config)
db.init_app(app)
#flask limiter initialization
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["1000 per day","50 per minute"],
    storage_uri="memory://"
)
# Create tables if they don't exist
with app.app_context():
    db.create_all()

app.secret_key = app.config['SECRET_KEY']
app.permanent_session_lifetime = app.config['PERMANENT_SESSION_LIFETIME']
EXCEL_PATH = 'budzet.xlsx'

login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'status': 'error', 'message': 'Authentication required'}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

SHEETS_CACHE = {}
if os.path.exists(EXCEL_PATH):
    try:
        SHEETS_CACHE = {
            sheet: pd.read_excel(EXCEL_PATH, sheet_name=sheet)
            for sheet in ["Przychody", "Wydatki"]
        }
    except Exception as e:
        print(f"Error loading Excel file: {e}")

months_order = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
month_map = {
    'January': 'Styczeń', 'February': 'Luty', 'March': 'Marzec', 'April': 'Kwiecień',
    'May': 'Maj', 'June': 'Czerwiec', 'July': 'Lipiec', 'August': 'Sierpień',
    'September': 'Wrzesień', 'October': 'Październik', 'November': 'Listopad', 'December': 'Grudzień'
}

def preprocess_data(df):
    required_cols = ['Data wystawienia', 'Kwota netto', 'Etykiety']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Brak wymaganej kolumny: {col}")
    if 'Lp.' in df.columns:
        df['Lp.'] = df['Lp.'].astype(str).str.strip()
    if 'Nr dokumentu' in df.columns:
        df['Nr dokumentu'] = df['Nr dokumentu'].astype(str).str.strip().str.upper().str.replace(' ','')
    if 'Kontrahent' in df.columns:
        df['Kontrahent'] = df['Kontrahent'].astype(str).str.strip()
    if 'Rodzaj' in df.columns:
        df['Rodzaj'] = df['Rodzaj'].astype(str).str.strip()
    if 'Metoda' in df.columns:
        df['Metoda'] = df['Metoda'].astype(str).str.strip().fillna('')
    df['Data wystawienia'] = pd.to_datetime(df['Data wystawienia'], errors='coerce')
    df['Termin płatności'] = pd.to_datetime(df['Termin płatności'], errors='coerce')
    df['Miesiąc'] = df['Data wystawienia'].dt.month_name().map(month_map)
    df['Rok'] = df['Data wystawienia'].dt.year
    for col in ['Zapłacono','Pozostało','Razem','Kwota netto']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    if 'Etykiety' in df.columns:
        df['Etykiety'] = df['Etykiety'].str.strip().str.upper()
        df['Etykiety_proc'] = df['Etykiety'].str.strip().str.upper()
    for col in ['Data wystawienia', 'Termin płatności']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
    return df

# --- AUTH API ROUTES ---

@app.route('/api/auth/status')
@login_required
def auth_status():
    print(f"--- STATUS CHECK: User is authenticated: {current_user.is_authenticated} ---")
    return jsonify({'status': 'success', 'user': {'id': current_user.id, 'username': current_user.username, 'role': current_user.role}})

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    print("--- LOGIN FUNCTION CALLED ---") # FINAL DEBUG
    if current_user.is_authenticated:
        return jsonify({'status': 'success', 'user': {'username': current_user.username, 'role': current_user.role}})

    data = request.get_json()
    username = data.get('username', '').strip()
    password_raw = data.get('password', '')
    print(f"--- LOGIN ATTEMPT: Username='{username}' ---")

    if not username or not password_raw:
        print("DEBUG: Login failed - missing username or password.")
        return jsonify({'status': 'error', 'message': 'Podaj nazwę użytkownika i hasło'}), 400

    if len(username) > 32 or len(password_raw) > 128:
        print("DEBUG: Login failed - input too long.")
        return ({'status':'error','message':'Nazwa użytkownika lub hasło jesy zbyt długiw=e'}), 400

    password = password_raw.encode('utf-8')

    user = User.query.filter_by(username=username).first()
    print(f"DEBUG: User found in DB: {'Yes' if user else 'No'}")
    
    try:
        password_ok = user and bcrypt.checkpw(password, user.password_hash.encode('utf-8'))
        print(f"DEBUG: Password check result: {password_ok}")
        if password_ok:
            login_user(user)
            print("DEBUG: Login successful, user session created.")
            return jsonify({'status': 'success', 'message': 'Zalogowano pomyślnie', 'user': {'id': user.id, 'username': user.username, 'role': user.role}})
    except Exception as e:
        print(f"DEBUG: An exception occurred during password check: {e}")
        return jsonify({'status': 'error', 'message': 'Błąd serwera podczas weryfikacji hasła.'}), 500
    
    print("DEBUG: Login failed, incorrect credentials.")
    return jsonify({'status': 'error', 'message': 'Nieprawidłowa nazwa użytkownika lub hasło'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    session.clear()
    return jsonify({'status': 'success', 'message': 'Wylogowano pomyślnie'})

# --- DATA API ROUTES ---

@app.route('/api/data/analiza', methods=['GET'])
@login_required
def analiza():
    typ = request.args.get('typ', 'Przychody')
    if not SHEETS_CACHE or typ not in SHEETS_CACHE:
        return jsonify({'error': 'Brak danych lub nieprawidłowy typ.'}), 404
    try:
        df_full = preprocess_data(SHEETS_CACHE[typ].copy())
        all_years = pd.concat([df_full['Rok']]).dropna().unique()
        min_year, max_year = (int(all_years.min()), int(all_years.max())) if len(all_years) > 0 else (None, None)
        year = request.args.get('year', default=max_year, type=int)
        df = df_full[df_full['Rok'] == year]
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    unique_branches = df.drop_duplicates(subset=['Etykiety_proc'])
    branches = unique_branches['Etykiety'].tolist()
    etykieta_map = dict(zip(unique_branches['Etykiety'], unique_branches['Etykiety_proc']))
    branch_org = request.args.get('branch', branches[0] if branches else '')
    branch_proc = etykieta_map.get(branch_org, branch_org)
    branch_df = df[df['Etykiety_proc'] == branch_proc]
    if branch_df.empty:
        pivot, suma_row_list, kontrahenci_sorted = {}, [0]*len(months_order) + [0], []
    else:
        pt = branch_df.pivot_table(index='Kontrahent', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
        pt = pt.reindex(columns=months_order, fill_value=0)
        pt['Suma roczna'] = pt.sum(axis=1)
        suma_row_list = list(pt[months_order].sum(axis=0)) + [pt['Suma roczna'].sum()]
        sort_by = request.args.get('sort_by', 'Suma roczna')
        sort_order = request.args.get('sort_order', 'desc')
        kontrahenci_sorted = pt.sort_values(by=sort_by, ascending=(sort_order=='asc')).index.tolist()
        pivot = pt.to_dict(orient='index')
    return jsonify(
        typ=typ, branches=branches, branch=branch_org, months_order=months_order,
        suma_row_list=suma_row_list, kontrahenci_sorted=kontrahenci_sorted, pivot=pivot,
        sort_by=request.args.get('sort_by', 'Suma roczna'), sort_order=request.args.get('sort_order', 'desc'),
        current_year=year, min_year=min_year, max_year=max_year
    )

@app.route('/api/data/podsumowanie', methods=['GET'])
@login_required
def podsumowanie():
    if not SHEETS_CACHE:
        return jsonify({'error': 'Brak danych w pamięci podręcznej.'}), 404
    year = request.args.get('year', default=None, type=int)
    try:
        df_income_full = preprocess_data(SHEETS_CACHE['Przychody'].copy())
        df_expense_full = preprocess_data(SHEETS_CACHE['Wydatki'].copy())
        all_years = pd.concat([df_income_full['Rok'], df_expense_full['Rok']]).dropna().unique()
        min_year, max_year = (int(all_years.min()), int(all_years.max())) if len(all_years) > 0 else (None, None)
        if year is None:
            year = max_year
        df_income_current_year = df_income_full[df_income_full['Rok'] == year] if year else pd.DataFrame()
        df_expense_current_year = df_expense_full[df_expense_full['Rok'] == year] if year else pd.DataFrame()
        df_income_prev_year = pd.DataFrame()
        df_expense_prev_year = pd.DataFrame()
        if year and (year - 1) in all_years:
            df_income_prev_year = df_income_full[df_income_full['Rok'] == (year - 1)]
            df_expense_prev_year = df_expense_full[df_expense_full['Rok'] == (year - 1)]
        def get_table_data(df):
            if df.empty or 'Etykiety' not in df.columns:
                return {'pivot': {}, 'branches_sorted': [], 'suma_row_list': [0]*len(months_order) + [0]}
            pt = df.pivot_table(index='Etykiety', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
            pt = pt.reindex(columns=months_order, fill_value=0)
            pt['Suma roczna'] = pt.sum(axis=1)
            suma_row = pt[months_order].sum(axis=0)
            suma_roczna = pt['Suma roczna'].sum()
            suma_row_list = list(suma_row) + [suma_roczna]
            branches_sorted = pt.index.tolist()
            pivot_dict = pt.to_dict(orient='index')
            return {'pivot': pivot_dict, 'branches_sorted': branches_sorted, 'suma_row_list': suma_row_list}
        income_table_data = get_table_data(df_income_current_year)
        expense_table_data = get_table_data(df_expense_current_year)
        def get_chart_data(df_current, df_prev, all_branches_raw):
            chart_data = {'line_charts': {}, 'bar_chart': {}}
            all_branches_for_charts = ['WSZYSTKIE'] + all_branches_raw
            if df_prev.empty:
                monthly_prev_all_zeros = [0 for _ in months_order]
            else:
                pivoted_df_prev_all = df_prev.pivot_table(index='Rok', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0).reindex(columns=months_order, fill_value=0)
                monthly_prev_all_zeros = pivoted_df_prev_all.iloc[0].tolist() if not pivoted_df_prev_all.empty else [0 for _ in months_order]
            for branch in all_branches_for_charts:
                if branch == 'WSZYSTKIE':
                    pivoted_df_current = df_current.pivot_table(index='Rok', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0).reindex(columns=months_order, fill_value=0)
                    monthly_current_all = pivoted_df_current.iloc[0].tolist() if not pivoted_df_current.empty else [0 for _ in months_order]
                    chart_data['line_charts'][branch] = {'current_year': monthly_current_all, 'prev_year': monthly_prev_all_zeros}
                else:
                    branch_df_current = df_current[df_current['Etykiety'] == branch]
                    if df_prev.empty:
                        branch_df_prev = pd.DataFrame()
                    else:
                        branch_df_prev = df_prev[df_prev['Etykiety'] == branch]
                    monthly_current = branch_df_current.pivot_table(index='Rok', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0).reindex(columns=months_order, fill_value=0).iloc[0].tolist() if not branch_df_current.empty else [0 for _ in months_order]
                    if branch_df_prev.empty:
                        monthly_prev = [0 for _ in months_order]
                    else:
                        pivoted_branch_df_prev = branch_df_prev.pivot_table(index='Rok', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0).reindex(columns=months_order, fill_value=0)
                        monthly_prev = pivoted_branch_df_prev.iloc[0].tolist() if not pivoted_branch_df_prev.empty else [0 for _ in months_order]
                    chart_data['line_charts'][branch] = {'current_year': monthly_current, 'prev_year': monthly_prev}
            if df_current.empty or 'Etykiety' not in df_current.columns or 'Kwota netto' not in df_current.columns:
                chart_data['bar_chart'] = {}
            else:
                bar_pt = df_current.pivot_table(index='Etykiety', values='Kwota netto', aggfunc='sum', fill_value=0)
                if not bar_pt.empty and 'Kwota netto' in bar_pt.columns:
                    chart_data['bar_chart'] = bar_pt['Kwota netto'].to_dict()
                else:
                    chart_data['bar_chart'] = {}
            return chart_data
        all_income_branches_raw = df_income_full['Etykiety'].dropna().unique().tolist()
        all_expense_branches_raw = df_expense_full['Etykiety'].dropna().unique().tolist()
        income_chart_data = get_chart_data(df_income_current_year, df_income_prev_year, all_income_branches_raw)
        expense_chart_data = get_chart_data(df_expense_current_year, df_expense_prev_year, all_expense_branches_raw)
        return jsonify({
            'current_year': year, 'min_year': min_year, 'max_year': max_year, 'months_order': months_order,
            'income_table': income_table_data, 'expense_table': expense_table_data,
            'income_chart_data': income_chart_data, 'expense_chart_data': expense_chart_data,
            'all_income_branches': ['WSZYSTKIE'] + all_income_branches_raw,
            'all_expense_branches': ['WSZYSTKIE'] + all_expense_branches_raw
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/wynagrodzenia', methods=['GET'])
@login_required
def wynagrodzenia_api():
    if 'Wydatki' not in SHEETS_CACHE:
        return jsonify({'error': 'Brak danych o wydatkach.'}), 404
    try:
        df_full = preprocess_data(SHEETS_CACHE['Wydatki'].copy())
        df_full_wyn = df_full[df_full['Etykiety'].str.strip().str.upper() == 'WYPŁATY'].copy()
        if df_full_wyn.empty:
            return jsonify({
                'table_data': [], 'months_order': months_order, 'min_year': None, 'max_year': None,
                'current_year': None, 'error': 'Brak danych o wynagrodzeniach.'
            }), 200
        all_years = df_full_wyn['Rok'].dropna().unique()
        min_year, max_year = (int(all_years.min()), int(all_years.max())) if len(all_years) > 0 else (None, None)
        year = request.args.get('year', default=max_year, type=int)
        df_wyn_year = df_full_wyn[df_full_wyn['Rok'] == year]
        if df_wyn_year.empty:
            return jsonify({
                'table_data': [], 'months_order': months_order, 'min_year': min_year,
                'max_year': max_year, 'current_year': year
            }), 200
        pivot = df_wyn_year.pivot_table(index='Kontrahent', columns='Miesiąc', values='Kwota netto', aggfunc='sum', fill_value=0)
        pivot = pivot.reindex(columns=months_order, fill_value=0)
        pivot['Suma roczna'] = pivot.sum(axis=1)
        sort_by = request.args.get('sort_by', 'Suma roczna')
        sort_order = request.args.get('sort_order', 'desc')
        if sort_by == 'Osoba':
            pivot = pivot.sort_index(ascending=(sort_order == 'asc'))
        else:
            pivot = pivot.sort_values(by=sort_by, ascending=(sort_order == 'asc'))
        table_data = []
        for index, row in pivot.iterrows():
            person_data = {'Osoba': index}
            for month in months_order:
                person_data[month] = row[month]
            person_data['Suma roczna'] = row['Suma roczna']
            table_data.append(person_data)
        return jsonify({
            'table_data': table_data, 'months_order': months_order, 'min_year': min_year,
            'max_year': max_year, 'current_year': year
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/dokumenty', methods=['GET'])
@login_required
def dokumenty():
    typ = request.args.get('typ', 'Przychody')
    if not SHEETS_CACHE or typ not in SHEETS_CACHE:
        return jsonify({'error': 'Brak danych lub nieprawidłowy typ.'}), 404
    try:
        df_full = preprocess_data(pd.read_excel(EXCEL_PATH, sheet_name=typ))
        all_years = df_full['Rok'].dropna().unique()
        min_year, max_year = (int(all_years.min()), int(all_years.max())) if len(all_years) > 0 else (None, None)
        year = request.args.get("year", default=max_year, type=int)
        df = df_full[df_full['Rok'] == year]
        branches = ['WSZYSTKIE'] + df['Etykiety'].unique().tolist()
        branch_org = request.args.get('branch', 'WSZYSTKIE')
        if branch_org != 'WSZYSTKIE':
            df = df[df['Etykiety'] == branch_org]
        sort_by = request.args.get('sort_by', 'Lp.')
        sort_order = request.args.get('sort_order', 'asc')
        if sort_by in df.columns:
            df = df.sort_values(by=sort_by, ascending=(sort_order == 'asc'))
        cols_to_drop = ['Etykiety_proc', 'Miesiąc', 'Rok']
        df = df.drop(columns=[col for col in cols_to_drop if col in df.columns])
        rows = df.to_dict(orient='records')
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    return jsonify(
        rows=rows, typ=typ, branch=branch_org, branches=branches,
        min_year=min_year, max_year=max_year, current_year=year
    )

@app.route('/api/documents/<int:lp>', methods=['PUT'])
@login_required
def update_document(lp):
    typ = request.args.get('typ')
    if not typ:
        return jsonify({'message': 'Query parameter "typ" is required.'}), 400
    try:
        all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
        if typ not in all_sheets:
            return jsonify({'message': f'Sheet "{typ}" not found.'}), 404
        df = all_sheets[typ]
        df['Lp.'] = pd.to_numeric(df['Lp.'], errors='coerce')
        row_index = df.index[df['Lp.'] == lp].tolist()
        if not row_index:
            return jsonify({'message': f'Record with lp={lp} not found.'}), 404
        row_index = row_index[0]
        new_data = request.get_json()
        for column, value in new_data.items():
            if column in df.columns:
                df.loc[row_index, column] = value
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, data_frame in all_sheets.items():
                if sheet_name == typ:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    data_frame.to_excel(writer, sheet_name=sheet_name, index=False)
        SHEETS_CACHE[typ] = pd.read_excel(EXCEL_PATH, sheet_name=typ)
        return jsonify({'message': 'Record updated successfully.'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/documents/<int:lp>', methods=['DELETE'])
@login_required
def delete_document(lp):
    typ = request.args.get('typ')
    if not typ:
        return jsonify({'message': 'Query parameter "typ" is required.'}), 400
    try:
        all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
        if typ not in all_sheets:
            return jsonify({'message': f'Sheet "{typ}" not found.'}), 404
        df = all_sheets[typ]
        df['Lp.'] = pd.to_numeric(df['Lp.'], errors='coerce')
        if lp not in df['Lp.'].values:
            return jsonify({'message': f'Record with lp={lp} not found.'}), 404
        df = df[df['Lp.'] != lp]
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, data_frame in all_sheets.items():
                if sheet_name == typ:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    data_frame.to_excel(writer, sheet_name=sheet_name, index=False)
        SHEETS_CACHE[typ] = pd.read_excel(EXCEL_PATH, sheet_name=typ)
        return jsonify({'message': 'Record deleted successfully.'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/data/add', methods=['POST'])
@login_required
def add_data():
    payload = request.get_json()
    sheet_to_update = payload.get('typ')
    new_record_data = payload.get('new_record')
    if not sheet_to_update or not new_record_data:
        return jsonify({'message': 'Sheet name "typ" and "new_record" data are required.'}), 400
    try:
        all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
        if sheet_to_update not in all_sheets:
            return jsonify({'message': f'Sheet "{sheet_to_update}" not found.'}), 404
        df = all_sheets[sheet_to_update]
        if df.empty or df['Lp.'].empty:
            new_lp = 1
        else:
            numeric_lp = pd.to_numeric(df['Lp.'], errors='coerce').dropna()
            new_lp = int(numeric_lp.max()) + 1 if not numeric_lp.empty else 1
        new_record_data['Lp.'] = new_lp
        new_record_df = pd.DataFrame([new_record_data])
        if not df.empty:
            new_record_df = new_record_df.reindex(columns=df.columns)
        all_sheets[sheet_to_update] = pd.concat([df, new_record_df], ignore_index=True)
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, data_frame in all_sheets.items():
                data_frame.to_excel(writer, sheet_name=sheet_name, index=False)
        SHEETS_CACHE[sheet_to_update] = all_sheets[sheet_to_update]
        return jsonify({'message': 'Record added successfully.', 'new_record': new_record_data}), 201
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@app.route('/api/sheet/clear', methods=['POST'])
@login_required
def clear_sheet():
    data = request.get_json()
    sheet_to_clear = data.get('typ')
    if not sheet_to_clear:
        return jsonify({'message': 'Sheet name "typ" is required.'}), 400
    try:
        all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
        if sheet_to_clear not in all_sheets:
            return jsonify({'message': f'Sheet "{sheet_to_clear}" not found.'}), 404
        columns = all_sheets[sheet_to_clear].columns
        all_sheets[sheet_to_clear] = pd.DataFrame(columns=columns)
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, df in all_sheets.items():
                df.to_excel(writer, sheet_name=sheet_name, index=False)
        SHEETS_CACHE[sheet_to_clear] = all_sheets[sheet_to_clear]
        return jsonify({'message': f'Sheet "{sheet_to_clear}" has been cleared.'}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

def merge_logic(old_df, new_df):
    old_df['Nr dokumentu'] = old_df['Nr dokumentu'].astype(str).str.strip()
    new_df['Nr dokumentu'] = new_df['Nr dokumentu'].astype(str).str.strip()
    old_df = old_df.set_index('Nr dokumentu')
    new_df = new_df.set_index('Nr dokumentu')
    old_df.update(new_df)
    new_rows_to_add = new_df[~new_df.index.isin(old_df.index)]
    combined_df = pd.concat([old_df.reset_index(), new_rows_to_add.reset_index()], ignore_index=True)
    combined_df['Lp.'] = pd.to_numeric(combined_df['Lp.'], errors='coerce')
    existing_lp_df = combined_df.dropna(subset=['Lp.'])
    new_lp_df = combined_df[combined_df['Lp.'].isna()]
    max_lp = existing_lp_df['Lp.'].max()
    if pd.isna(max_lp):
        max_lp = 0
    new_lp_df.loc[:, 'Lp.'] = range(int(max_lp) + 1, int(max_lp) + 1 + len(new_lp_df))
    final_df = pd.concat([existing_lp_df, new_lp_df], ignore_index=True)
    final_df['Lp.'] = final_df['Lp.'].astype(int)
    final_df = final_df.sort_values(by='Lp.').reset_index(drop=True)
    return final_df

@app.route('/api/file/import', methods=['POST'])
@login_required
def importExcel():
    file = request.files.get('file')
    if not file or not file.filename.endswith('.xlsx'):
        return jsonify({"status": "error", "message": "Proszę wybrać plik .xlsx"}), 400
    try:
        old_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)
        new_sheets = pd.read_excel(file, sheet_name=None)
        sheets_to_process = ["Przychody", "Wydatki"]
        for sheet_name in sheets_to_process:
            if sheet_name in new_sheets and 'Nr dokumentu' in new_sheets[sheet_name].columns:
                new_df = new_sheets[sheet_name]
                new_df_cleaned = new_df.dropna(subset=['Nr dokumentu'])
                duplicates = new_df_cleaned[new_df_cleaned['Nr dokumentu'].duplicated(keep=False)]
                if not duplicates.empty:
                    dup_list = duplicates['Nr dokumentu'].astype(str).unique().tolist()
                    return jsonify({
                        "status": "error", 
                        "message": f"Błąd w pliku do importu: Znaleziono zduplikowane numery dokumentów w arkuszu '{sheet_name}': {', '.join(dup_list)}"
                    }), 400
            if sheet_name in old_sheets and 'Nr dokumentu' in old_sheets[sheet_name].columns:
                old_df = old_sheets[sheet_name]
                old_df_cleaned = old_df.dropna(subset=['Nr dokumentu'])
                duplicates = old_df_cleaned[old_df_cleaned['Nr dokumentu'].duplicated(keep=False)]
                if not duplicates.empty:
                    dup_list = duplicates['Nr dokumentu'].astype(str).unique().tolist()
                    return jsonify({
                        "status": "error", 
                        "message": f"Błąd w pliku na serwerze: Znaleziono zduplikowane numery dokumentów w arkuszu '{sheet_name}': {', '.join(dup_list)}"
                    }), 400
        processed_sheets = {}
        for sheet_name in sheets_to_process:
            old_df = old_sheets.get(sheet_name)
            new_df = new_sheets.get(sheet_name)
            if new_df is None:
                if old_df is not None:
                    processed_sheets[sheet_name] = old_df
                continue
            if old_df is None or old_df.empty:
                if 'Lp.' not in new_df.columns or new_df['Lp.'].isnull().all():
                    new_df.loc[:, 'Lp.'] = range(1, len(new_df) + 1)
                processed_sheets[sheet_name] = new_df
            else:
                processed_sheets[sheet_name] = merge_logic(old_df.copy(), new_df.copy())
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, df in processed_sheets.items():
                if df is not None:
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
        for sheet_name, df in processed_sheets.items():
            if sheet_name in SHEETS_CACHE and df is not None:
                SHEETS_CACHE[sheet_name] = df
        return jsonify({"status": "success", "message": "Plik został pomyślnie zaimportowany i połączony."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/export/documents')
@login_required
def export_documents():
    typ = request.args.get('typ', 'Przychody')
    year = request.args.get('year', type=int)
    search_query = request.args.get('search', '')
    if not SHEETS_CACHE or typ not in SHEETS_CACHE:
        return jsonify({'error': 'Brak danych lub nieprawidłowy typ.'}), 404
    try:
        df_full = preprocess_data(pd.read_excel(EXCEL_PATH, sheet_name=typ))
        if year:
            df = df_full[df_full['Rok'] == year]
        else:
            all_years = df_full['Rok'].dropna().unique()
            max_year = int(all_years.max()) if len(all_years) > 0 else None
            df = df_full[df_full['Rok'] == max_year] if max_year else df_full
        if search_query:
            mask = df.apply(lambda row: row.astype(str).str.contains(search_query, case=False).any(), axis=1)
            df = df[mask]
        cols_to_drop = ['Etykiety_proc', 'Miesiąc', 'Rok']
        df_export = df.drop(columns=[col for col in cols_to_drop if col in df.columns])
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_export.to_excel(writer, index=False, sheet_name=typ)
        output.seek(0)
        filename = f"export_{typ}_{year or 'wszystkie'}.xlsx"
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/file/download')
@login_required
def downloadExcel():
    return send_file(EXCEL_PATH, as_attachment=True)

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
