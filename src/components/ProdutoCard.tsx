// Componente React que usa código compartilhado
import React from 'react';
import { Produto, formatarMoeda } from '../shared';

interface ProdutoCardProps {
  produto: Produto;
}

export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto }) => {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      maxWidth: '300px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {produto.imagem && (
        <img
          src={produto.imagem}
          alt={produto.nome}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '12px'
          }}
        />
      )}
      
      <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
        {produto.nome}
      </h3>
      
      <p style={{ 
        fontSize: '24px', 
        fontWeight: 'bold', 
        color: '#2196F3',
        margin: '8px 0'
      }}>
        {formatarMoeda(produto.preco)}
      </p>
      
      <p style={{ 
        color: '#666', 
        fontSize: '14px',
        margin: '8px 0'
      }}>
        {produto.descricao}
      </p>
      
      <button style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        width: '100%'
      }}>
        Comprar
      </button>
    </div>
  );
};
