from src.process_data import carregar_dados

def test_dataframe_nao_vazio():
    df = carregar_dados()
    assert len(df) > 0

def test_coluna_total_venda_existe():
    df = carregar_dados()
    assert 'total_venda' in df.columns

def test_sem_valores_nulos():
    df = carregar_dados()
    assert df.isnull().sum().sum() == 0