import React, { useEffect, useState } from 'react';
import {
  FormularioSalvo,
  StatusFormulario,
  TipoFormulario,
  obterCorTipo
} from '../../shared/types/formularioSalvo';
import { firebaseFormularioStorage } from '../../shared/services/firebaseFormularioStorage';
import { useAuth } from '../../shared/contexts/AuthContext';
import { formatarDataHora } from '../../shared/utils';

interface ListaLateralFormulariosProps {
  onSelecionar: (formulario: FormularioSalvo) => void;
  formularioAtualId?: string;
  tipo: TipoFormulario;
}

const STATUS_EM_ABERTO: StatusFormulario[] = ['pendente', 'aguardando', 'agendamento'];

const GRUPOS_STATUS: Array<{ status: StatusFormulario; titulo: string; icone: string }> = [
  { status: 'pendente', titulo: 'Pendentes', icone: '⏳' },
  { status: 'aguardando', titulo: 'Aguardando', icone: '⏸️' },
  { status: 'agendamento', titulo: 'Agendados', icone: '📅' }
];

const obterIconeTipo = (tipo: TipoFormulario): string => {
  switch (tipo) {
    case 'CTO': return '🏢';
    case 'PON': return '📡';
    case 'LINK': return '🔗';
    case 'ADEQUACAO': return '🛠️';
  }
};

export const ListaLateralFormularios: React.FC<ListaLateralFormulariosProps> = ({
  onSelecionar,
  formularioAtualId,
  tipo
}) => {
  const { user, isAdmin } = useAuth();
  const [formularios, setFormularios] = useState<FormularioSalvo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    const uid = !isAdmin ? user?.uid : undefined;

    // Também acompanha mudanças feitas pelo admin em tempo real.
    const unsubscribe = firebaseFormularioStorage.escutarMudancas(
      (todos) => {
        if (!ativo) return;

        setFormularios(
          todos
            .filter(formulario =>
              formulario.tipo === tipo && STATUS_EM_ABERTO.includes(formulario.status)
            )
            .sort((a, b) =>
              (b.dataAlteracaoStatus || b.dataModificacao).localeCompare(
                a.dataAlteracaoStatus || a.dataModificacao
              )
            )
        );
        setCarregando(false);
      },
      uid
    );

    return () => {
      ativo = false;
      unsubscribe();
    };
  }, [isAdmin, user?.uid, tipo]);

  return (
    <aside className="lista-lateral" aria-label={`Ordem de serviço ${tipo} em aberto`}>
      <div className="lista-lateral-titulo">
        <span>📌 {tipo} em aberto</span>
        <span className="lista-lateral-contador">{formularios.length}</span>
      </div>
      <div className="lista-lateral-subtitulo">Pendentes · Aguardando · Agendados</div>

      {carregando ? (
        <div className="lista-lateral-vazio">Carregando...</div>
      ) : (
        GRUPOS_STATUS.map(grupo => {
          const itens = formularios.filter(formulario => formulario.status === grupo.status);

          return (
            <section key={grupo.status} className="lista-lateral-grupo">
              <div className="lista-lateral-grupo-titulo">
                <span>{grupo.icone} {grupo.titulo}</span>
                <span className="lista-lateral-contador">{itens.length}</span>
              </div>

              {itens.length === 0 ? (
                <div className="lista-lateral-vazio">Nenhuma</div>
              ) : (
                <div className="lista-lateral-itens">
                  {itens.map(formulario => (
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
                          Atualizado: {formatarDataHora(new Date(formulario.dataAlteracaoStatus || formulario.dataModificacao))}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </aside>
  );
};
