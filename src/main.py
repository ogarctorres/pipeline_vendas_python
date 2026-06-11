from src.process_data import carregar_dados
from src.graficos import gerar_graficos

def main():
    print("Iniciando pipeline de vendas...")

    print("\n Carregando e limpando dados...")
    df = carregar_dados()
    print(f"Dados carregados: {len(df)} linhas")

    total_vendas = df['total_venda'].sum()
    ticket_medio = df['total_venda'].mean()
    produto_mais_vendido = df.groupby('produto')['quantidade'].sum().idxmax()

    print("\n========== RELATÓRIO DE VENDAS ==========")
    print(f"Total de vendas:      R$ {total_vendas:.2f}")
    print(f"Ticket médio:         R$ {ticket_medio:.2f}")
    print(f"Produto mais vendido: {produto_mais_vendido}")
    print("=========================================")

    print("\n Gerando gráficos...")
    gerar_graficos()

    print("\nPipeline finalizado!")

main()