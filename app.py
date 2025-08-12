from datetime import timedelta
from flask import Flask, render_template, request, url_for, redirect, flash, session
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user 
import bcrypt
from markupsafe import escape
import pandas as pd
import os
import tempfile
from openpyxl import load_workbook
from config import Config
from extensions import db
from routes import bp as main_bp
from models import User
from dotenv import load_dotenv


#Initialize app
app = Flask(__name__)
app.config.from_object(Config)
#czasem po dłuższej bezczynności przy odswiezeniu wywalało mysql connection not available wiec dodaje to
app.config['SQLALCHEMY_ENGINE_OPTIONS']={
    "pool_pre_ping":True,
    "pool_recycle":280
}
db.init_app(app)
#blueprints
app.register_blueprint(main_bp)
#tworzymy tabele
with app.app_context():
    db.create_all()
load_dotenv()
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY')
app.permanent_session_lifetime = timedelta(minutes=30)
EXCEL_PATH = 'budzet.xlsx'

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view= 'login'

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
    df['Nr dokumentu'] = df['Nr dokumentu'].astype(str).str.strip().str.upper().str.replace(' ','')
    #df['Nr dokumentu'] = "".join(temp.split())
    df['Lp.'] = df['Lp.'].astype(str).str.strip()
    if 'Kontrahent' in df.columns:
        df['Kontrahent'] = df['Kontrahent'].astype(str).str.strip()
    if 'Rodzaj' in df.columns:
        df['Rodzaj'] = df['Rodzaj'].astype(str).str.strip()
    for col in ['Data wystawienia', 'Termin płatności']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d')
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

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/', methods=['GET'])
def home():
    return render_template("start.html")

@app.route('/login', methods=['GET','POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    if request.method == 'POST':
        username = request.form['username'].strip()
        password = request.form['password'].encode('utf-8')#bcrypt musi miec bytes lol

        if not username or not password:
            flash('Podaj nazwę użytkownika i hasło')
            return redirect(url_for('login'))
        user = User.query.filter_by(username=username).first()
        if user:
            hashed = user.password_hash.encode('utf-8') 
            if bcrypt.checkpw(password, hashed):
                login_user(user)
                next_page =  request.args.get('next')
                #Logowanie udalo sie
                print("id uzytkownika: {user.id}")
                session['user_id'] = user.id
                session['username'] = user.username
                session['role'] = user.role
                return redirect(next_page or url_for('dashboard'))
            else:
                #logowanie nieudane
                flash('Nieprawidłowa nazwa użytkownika lub hasło', 'error')
                return redirect(url_for('login'))
        else:
            #logowanie nieudane
            flash('Nieprawidłowa nazwa użytkownika lub hasło')
            return redirect(url_for('login'))
    #najpierw wyswietl formularz
    return render_template("login.html")

@app.route('/register', methods = ['GET','POST'])
def register():
    return render_template("register.html")
@app.route('/logout')
def logout():
    session.clear() #usuwa sesje
    return redirect(url_for('login'))

@app.route('/dashboard', methods=['GET'])
@login_required
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
@login_required
def analiza():
    typ = request.args.get('typ', 'Przychody')
    if not os.path.exists(EXCEL_PATH):
        return render_template('analiza.html',  typ=typ, branches=[], branch='', months_order=[], suma_row_list=[], kontrahenci_sorted=[], pivot={}, sort_by='', sort_order='desc')
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
@login_required
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
@login_required
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

#dokumenty -> widok całej tabeli do edycji rekordów
@app.route('/dokumenty', methods=['GET'])
@login_required
def dokumenty():
    typ = request.args.get('typ', 'Przychody')
    if not os.path.exists(EXCEL_PATH):
        return render_template('dokumenty.html', rows=[], typ=typ, branch='', branches=[], error='Brak pliku Excel.')
    

    try:
        df = pd.read_excel(EXCEL_PATH, sheet_name=typ)
        df=preprocess_data(df)
    except Exception as e:
        return render_template('dokumenty.html', rows=[], typ=typ, branch='', branches=[], error=str(e))
    
    
    unique_branches = df[['Etykiety', 'Etykiety_proc']].drop_duplicates()
    branches =unique_branches['Etykiety'].tolist()
    etykieta_map = dict(zip(unique_branches['Etykiety'], unique_branches['Etykiety_proc']))

    branch_org = request.args.get('branch', branches[0] if branches else '')
    branch_proc = etykieta_map.get(branch_org, branch_org)

    filtered_df = df[df['Etykiety_proc'] == branch_proc] if branch_proc else df
    filtered_df2 = filtered_df.drop(columns=['Etykiety_proc', 'Miesiąc'], errors='ignore')
    rows = filtered_df2.to_dict(orient='records')

    return render_template('dokumenty.html', rows=rows, typ=typ, branch=branch_org, branches=branches)

@app.route('/importExcel', methods = ['POST'])
def importExcel():
    file = request.files.get('file')
    if not file:
        flash("Nie wybrano pliku","error")
        return redirect(url_for('dokumenty'))
    #dodać if-a sprawdzajacego typ pliku -> aby byl .xlsx

    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as tmp:
        file.save(tmp.name)
        newPath = tmp.name

    if not os.path.exists(EXCEL_PATH) or not newPath:
        flash("Nie podano ścieżki", 'error')
        return redirect(url_for('dokumenty'))
    try:
        oldDfIncome = pd.read_excel(EXCEL_PATH, sheet_name='Przychody')
        oldDfIncome = preprocess_data(oldDfIncome)

        oldDfExpense = pd.read_excel(EXCEL_PATH, sheet_name='Wydatki')
        oldDfExpense = preprocess_data(oldDfExpense)
        
        newDfIncome = pd.read_excel(newPath, 'Przychody')
        newDfIncome = preprocess_data(newDfIncome)
        
        newDfExpense = pd.read_excel(newPath, 'Wydatki')
        newDfExpense = preprocess_data(newDfExpense)
        
    except Exception as e:
        flash(f"Error: {e}, nie udał się import pliku.")
        return redirect(url_for('dokumenty'))
    #łączenie sheetu przychody
    oldDfIncome = merge_data(oldDfIncome,newDfIncome, keys=['Nr dokumentu','Kontrahent','Rodzaj','Etykiety'])
    #lączenie sheetu wydatki
    oldDfExpense = merge_data(oldDfExpense,newDfExpense, keys=['Nr dokumentu','Kontrahent','Etykiety'])
    #zapis z powrotem do starego pliku
    with pd.ExcelWriter(EXCEL_PATH) as writer:
        oldDfIncome.to_excel(writer, sheet_name='Przychody', float_format="%.2f", index=False)
        oldDfExpense.to_excel(writer, sheet_name='Wydatki',float_format="%.2f",index=False)
    return redirect(url_for('dokumenty'))

def merge_data(old_df, new_df, keys):
    # normalizacja kluczy aby były takie same
    for k in keys:
        old_df[k] = old_df[k].astype(str).str.strip().str.upper()
        new_df[k] = new_df[k].astype(str).str.strip().str.upper()
    #kopia starego dataframe
    merged_df = old_df.copy()

    for _, new_row in new_df.iterrows():
        #szukamy w starym pliku wiersza o takich samych kluczach
        mask = (merged_df[keys[0]] == new_row[keys[0]]) & (merged_df[keys[1]] == new_row[keys[1]]) & (merged_df[keys[2]] == new_row[keys[2]])
        if len(keys) == 4:
            mask &= (merged_df[keys[3]] == new_row[keys[3]])
        
        if mask.any():
            #Aktualizacja istniejącego wiersza
            idx = merged_df[mask].index[0]
            for col in merged_df.columns:
                if col != 'Lp.':
                    merged_df.at[idx, col] = new_row[col]
        else:
            #Dodanie nowego wierszaz nowym Lp.
            merged_df['Lp.'] = pd.to_numeric(merged_df['Lp.'], errors="coerce").fillna(0).astype(int)
            new_lp = merged_df['Lp.'].max() + 1 if not merged_df.empty else 1
            new_row_dict = new_row.to_dict()
            new_row_dict['Lp.'] = new_lp
            merged_df = pd.concat([merged_df, pd.DataFrame([new_row_dict])], ignore_index=True)

    return merged_df
                

#route to handle save edited records back to the file
@app.route('/zapisz', methods=['POST'])
@login_required
def zapisz():
    #wczytanie wszystkich danych do dataframeow
    all_sheets = pd.read_excel(EXCEL_PATH, sheet_name=None)

    kontrahent = request.form.get("kontrahent")
    typ = request.form.get("typ")
    branch = request.form.get("branch")
    naglowki = request.form.getlist("naglowki[]")
    wartosci = request.form.getlist("wartosci[]")
    index = request.form.get("index")

    try:
        index = int(index)
    except ValueError:
        return "Błędny format indeksu", 400

    print("Odebrano dane:")
    print("kontrahent:", kontrahent)
    print("typ:", typ)
    print("branch:", branch)
    print("naglowki:", naglowki)
    print("wartosci:", wartosci)
    print("index:", index)

    if not kontrahent or not naglowki or not wartosci or not typ or not branch:
        return "Brak wymaganych danych", 400
    
    if index is None:
        return "brak indeksu do edycji:", 400

    if len(naglowki) != len(wartosci):
        return "Nieprawidłowa liczba miesięcy i wartości", 400


    
    if not os.path.exists(EXCEL_PATH):
        return 'Error: no such file or directory', 500
    
    #df = pd.read_excel(EXCEL_PATH, sheet_name=typ)
    df = all_sheets[typ]
    df = preprocess_data(df)



    typy_kolumn = df.dtypes.to_dict()

    dane = {}
    for naglowek, wartosc in zip(naglowki, wartosci):
        if pd.api.types.is_numeric_dtype(typy_kolumn.get(naglowek)):
            # liczba → konwertujemy na float (jeśli puste, to NaN)
            try:
                dane[naglowek] = float(wartosc.replace(",", ".").replace(" ", "")) if wartosc.strip() != "" else None
            except ValueError:
                dane[naglowek] = None
        else:
            dane[naglowek] = wartosc
    
    df['Etykiety_proc'] = df['Etykiety'].str.strip().str.upper()
    branch_proc = branch.strip().upper()

    #Updates rows for specific company and month
    df['Lp.'] = pd.to_numeric(df['Lp.'], errors='coerce').astype('Int64')
    idx = (
        (df['Lp.'] == index)&
        (df['Etykiety_proc'] == branch_proc) &
        (df['Kontrahent'] == kontrahent) 
          )
    #check if any row can be updated
    if idx.sum() == 0:
        print("Dostępne Lp.:", df['Lp.'].unique())
        print("Dostępne etykiety:", df['Etykiety_proc'].unique())
        print("Dostępni kontrahenci:", df['Kontrahent'].unique())
        return "Nie znaleziono rekordu do aktualizacji", 404


    #replace row with new data
    for kol, val in dane.items():
        df.loc[idx, kol] = val

    # Save the updated DataFrame back to the Excel file
    df_to_save = df.drop(columns=["Etykiety_proc", "Miesiąc"], errors='ignore')
    all_sheets[typ] = df_to_save

    #for col in ['Data wystawienia', 'Termin płatności']:
     #   if col in df_to_save.columns:
      #      df_to_save[col] = pd.to_datetime(df_to_save[col], errors='coerce').dt.date

    with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
        for sheet_name, sheet_df in all_sheets.items():
            sheet_df.to_excel(writer, sheet_name=sheet_name, index =False)
        
        #df_to_save.to_excel(writer, sheet_name=typ, index=False)

    return 'Zapisano', 200



if __name__ == '__main__':
    import webbrowser
    webbrowser.open('http://127.0.0.1:5000/')
    app.run(debug=True)
