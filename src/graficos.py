import matplotlib.pyplot as plt
import os
from src.process_data import carregar_dados

def gerar_graficos():
    df = carregar_dados()   

    os.makedirs('reports', exist_ok=True)

    # Gráfico 1 — Receita por produto
    receita_por_produto = df.groupby('produto')['total_venda'].sum()

    plt.figure(figsize=(8, 5))
    receita_por_produto.plot(kind='bar', color='steelblue')
    plt.title('Receita por Produto')
    plt.xlabel('Produto')
    plt.ylabel('Receita (R$)')
    plt.tight_layout()
    plt.savefig('reports/receita_por_produto.png')
    plt.close()
    print("Gráfico 1 salvo!")

    # Gráfico 2 — Evolução de vendas no tempo
    vendas_por_dia = df.groupby('data')['total_venda'].sum()

    plt.figure(figsize=(8, 5))
    vendas_por_dia.plot(kind='line', marker='o', color='green')
    plt.title('Evolução de Vendas')
    plt.xlabel('Data')
    plt.ylabel('Total Vendido (R$)')
    plt.tight_layout()
    plt.savefig('reports/evolucao_vendas.png')
    plt.close()
    print("Gráfico 2 salvo!")
