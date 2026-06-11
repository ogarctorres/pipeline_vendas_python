import pandas as pd

def carregar_dados():
    df = pd.read_csv('data/dados.csv')
    df['data'] = pd.to_datetime(df['data'])
    df = df.drop_duplicates()
    df = df.dropna()
    df['total_venda'] = df['quantidade'] * df['preco_unitario']
    return df