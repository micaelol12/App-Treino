import pandas as pd

def processar_dados_analise(df):
    if df.empty:
        return df
    
    # Conversão de tipos
    df["Data"] = pd.to_datetime(df["Data"])
    df["Carga"] = pd.to_numeric(df["Carga"])
    df["Reps"] = pd.to_numeric(df["Reps"])
    
    # Cálculos
    df["Volume Load (kg)"] = df["Carga"] * df["Reps"]
    df["1RM Estimada (kg)"] = df["Carga"] * (1 + (df["Reps"] / 30))
    return df

def processar_dados_peso(df):
    if df.empty:
        return df
        
    df["Data"] = pd.to_datetime(df["Data"])
    df["Peso"] = pd.to_numeric(df["Peso"])
    df = df.sort_values(by="Data").drop_duplicates(subset=["Data"], keep="last")
    
    # Média móvel
    df["Média 7 Dias"] = df["Peso"].rolling(window=7, min_periods=1).mean()
    return df