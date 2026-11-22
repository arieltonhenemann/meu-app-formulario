import React, { useEffect, useState } from 'react';
import {
  FormularioSalvo,
  StatusFormulario,
  TipoFormulario,
  obterCorTipo
} from '../../shared/types/formularioSalvo';
import { firebaseFormularioStorage } from '../../shared/services/firebaseFormularioStorage';
import { useAuth } from '../../shared/contexts/AuthContext';

interface ListaLateralFormulariosProps {
  onSelecionar: (formulario: FormularioSalvo) => void;
  formularioAtualId?: string;
}

const STATUS_EM_ABERTO: StatusFormulario[] = ['pendente', 'aguardando', 'agendamento'];

const obterIconeTipo = (tipo: TipoFormulario): string => {
  switch (tipo) {
    case 'CTO': return '🏢';
    case 'PON': return '📡';
    case 'LINK': return '🔗';
    case 'ADEQUACAO': return '🛠️';
  }
};

const obterIconeStatus = (status: StatusFormulario): string => {
  switch (status) {
    case 'pendente': return '⏳';
    case 'aguardando': return '⏸️';
    case 'agendamento': return '📅';
    case 'finalizado': return '✅';
  }
};

const obterLabelStatus = (status: StatusFormulario): string => {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'aguardando': return 'Aguardando';
    case 'agendamento': return 'Agendamento';
    case 'finalizado': return 'Finalizado';
  }
};

export const ListaLateralFormularios: React.FC<ListaLateralFormulariosProps> = ({
  onSelecionar,
  formularioAtualId
}) => {
  const { user, isAdmin } = useAuth();
  const [formularios, setFormularios] = useState<FormularioSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        const uid = !isAdmin ? user?.uid : undefined;
        const todos = await firebaseFormularioStorage.obterTodos(uid);
        if (!ativo) return;

        setFormularios(
          todos
            .filter(formulario => STATUS_EM_ABERTO.includes(formulario.status))
            .sort((a, b) =>
              (b.dataAlteracaoStatus || b.dataModificacao).localeCompare(
                a.dataAlteracaoStatus || a.dataModificacao
              )
            )
        );
      } catch (error) {
        console.error('Erro ao carregar a lista lateral de formulários:', error);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregar();
    window.addEventListener('online', carregar);

    return () => {
      ativo = false;
      window.removeEventListener('online', carregar);
    };
  }, [isAdmin, user?.uid]);

  return (
    <aside className="lista-lateral" aria-label="Ordem de serviço em aberto">
      <div className="lista-lateral-titulo">
        <span>📌 Em aberto</span>
        <span className="lista-lateral-contador">{formularios.length}</span>
      </div>
      <div className="lista-lateral-subtitulo">Pendente · Aguardando · Agendamento</div>

      {carregando ? (
        <div className="lista-lateral-vazio">Carregando...</div>
      ) : formularios.length === 0 ? (
        <div className="lista-lateral-vazio">Nenhuma O.S. em aberto.</div>
      ) : (
        <div className="lista-lateral-itens">
          {formularios.map(formulario => (
            <button
              key={formulario.id}
              type="button"
              className={`lista-lateral-item${formulario.id === formularioAtualId ? ' ativo' : ''}`}
              onClick={() => onSelecionar(formulario)}
              title={`Abrir ${formulario.codigoOS} para edição`}
            >
              <span className="lista-lateral-icone" style={{ color: obterCorTipo(formulario.tipo) }}>
                {obterIconeTipo(formulario.tipo)}
              </span>
              <span className="lista-lateral-info">
                <strong>{formulario.codigoOS}</strong>
                <small>
                  {formulario.tipo} · {obterIconeStatus(formulario.status)} {obterLabelStatus(formulario.status)}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
