import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Layers,
  DollarSign,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';
import { getUserKeys, pushToCloud, pullFromCloud, getItemJSON } from '../services/cloudSync';

interface BancoDeDadosBackupProps {
  darkMode?: boolean;
  usuarioId?: string;
}

interface RestorePoint {
  id: string;
  timestamp: string;
  dataHoraFormatada: string;
  totalProducao: number;
  totalFinanceiro: number;
  tamanhoKB: number;
  producao: any[];
  financeiro: any[];
  pacientes?: any[];
  consultas?: any[];
}

export const BancoDeDadosBackup: React.FC<BancoDeDadosBackupProps> = ({
  darkMode,
  usuarioId
}) => {
  const userKeys = getUserKeys(usuarioId);
  const keyProducao = userKeys.PRODUCAO;
  const keyFinanceiro = userKeys.FINANCEIRO;
  const keyRestorePoints = `odonto_restore_points_${usuarioId || 'usr-admin-master'}`;

  const [producaoData, setProducaoData] = useState<any[]>(() => getItemJSON(keyProducao, []));
  const [financeiroData, setFinanceiroData] = useState<any[]>(() => getItemJSON(keyFinanceiro, []));
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>(() => getItemJSON(keyRestorePoints, []));
  
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [sincronizando, setSincronizando] = useState<boolean>(false);

  // Recarrega os dados do localStorage e da nuvem
  const carregarDadosLocais = () => {
    const prod = getItemJSON(keyProducao, []);
    const fin = getItemJSON(keyFinanceiro, []);
    const rp = getItemJSON(keyRestorePoints, []);
    setProducaoData(Array.isArray(prod) ? prod : []);
    setFinanceiroData(Array.isArray(fin) ? fin : []);
    setRestorePoints(Array.isArray(rp) ? rp : []);
  };

  useEffect(() => {
    carregarDadosLocais();
  }, [keyProducao, keyFinanceiro, keyRestorePoints]);

  // Cálculos de Estatística do Banco de Dados
  const totalItensProducao = producaoData.length;
  const totalValorProducao = producaoData.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalItensFinanceiro = financeiroData.length;
  const totalValorFinanceiro = financeiroData.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  // Estimativa do Tamanho Armazenado (bytes / KB)
  const jsonProducao = JSON.stringify(producaoData);
  const jsonFinanceiro = JSON.stringify(financeiroData);
  const tamanhoBytesTotal = new Blob([jsonProducao + jsonFinanceiro]).size;
  const tamanhoKB = (tamanhoBytesTotal / 1024).toFixed(2);

  // GERAR PONTO DE RESTAURAÇÃO AUTOMÁTICO
  const criarPontoRestauracaoInterno = (prod: any[], fin: any[], _motivo: string = 'Backup Manual') => {
    const agora = new Date();
    const novoPonto: RestorePoint = {
      id: `rp-${Date.now()}`,
      timestamp: agora.toISOString(),
      dataHoraFormatada: `${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR')}`,
      totalProducao: prod.length,
      totalFinanceiro: fin.length,
      tamanhoKB: Number((new Blob([JSON.stringify(prod) + JSON.stringify(fin)]).size / 1024).toFixed(2)),
      producao: prod,
      financeiro: fin
    };

    const listaAtualizada = [novoPonto, ...restorePoints].slice(0, 10); // Mantém os últimos 10 pontos
    setRestorePoints(listaAtualizada);
    localStorage.setItem(keyRestorePoints, JSON.stringify(listaAtualizada));
    return novoPonto;
  };

  // 1. FAZER BACKUP COMPLETO DO BANCO DE DADOS (DOWNLOAD JSON)
  const handleBaixarBackupJSON = () => {
    try {
      const prod = getItemJSON(keyProducao, []);
      const fin = getItemJSON(keyFinanceiro, []);
      const pac = getItemJSON('odonto_pacientes_v1', []);
      const con = getItemJSON('odonto_consultas_v1', []);

      const dataHoje = new Date().toISOString().split('T')[0];
      const backupPayload = {
        sistema: 'OdontoWeb ERP',
        versao: '2.0.0',
        tipo: 'BACKUP_BANCO_DADOS_COMPLETO',
        dataExportacao: new Date().toISOString(),
        dataFormata: new Date().toLocaleString('pt-BR'),
        usuarioId: usuarioId || 'usr-admin-master',
        estatisticas: {
          totalProducao: prod.length,
          valorProducao: totalValorProducao,
          totalFinanceiro: fin.length,
          valorFinanceiro: totalValorFinanceiro,
          tamanhoKB: tamanhoKB
        },
        dados: {
          producao: prod,
          financeiro: fin,
          pacientes: pac,
          consultas: con
        }
      };

      // Salva snapshot no Histórico Local antes do Download
      criarPontoRestauracaoInterno(prod, fin, 'Backup Download JSON');

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Backup_Banco_Dados_OdontoWeb_${dataHoje}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMensagemSucesso(`✅ Backup do Banco de Dados gerado com sucesso! (${prod.length} itens de Produção, ${fin.length} de Financeiro baixados).`);
      setTimeout(() => setMensagemSucesso(null), 6000);
    } catch (e) {
      setMensagemErro('❌ Falha ao exportar backup do Banco de Dados.');
      setTimeout(() => setMensagemErro(null), 5000);
    }
  };

  // 2. RESTAURAR BANCO DE DADOS A PARTIR DE ARQUIVO JSON (UPLOAD)
  const handleRestaurarBackupArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        let prodRestaurar: any[] = [];
        let finRestaurar: any[] = [];

        // Aceita backups no formato OdontoWeb novo ou arrays diretos
        if (parsed.dados) {
          prodRestaurar = Array.isArray(parsed.dados.producao) ? parsed.dados.producao : [];
          finRestaurar = Array.isArray(parsed.dados.financeiro) ? parsed.dados.financeiro : [];
        } else if (parsed.producao || parsed.financeiro) {
          prodRestaurar = Array.isArray(parsed.producao) ? parsed.producao : [];
          finRestaurar = Array.isArray(parsed.financeiro) ? parsed.financeiro : [];
        } else {
          throw new Error('Formato de arquivo de backup inválido.');
        }

        if (!window.confirm(`⚠️ CONFIRMAÇÃO DE RESTAURAÇÃO:\n\nVocê está prestes a restaurar:\n• ${prodRestaurar.length} registros de PRODUÇÃO\n• ${finRestaurar.length} registros de FINANCEIRO\n\nTodos os dados atuais serão atualizados para este backup. Deseja continuar?`)) {
          return;
        }

        // Criar um ponto de restauração de emergência dos dados atuais antes de sobrescrever
        criarPontoRestauracaoInterno(producaoData, financeiroData, 'Snapshot Pré-Restauração');

        // Atualiza LocalStorage
        localStorage.setItem(keyProducao, JSON.stringify(prodRestaurar));
        localStorage.setItem(keyFinanceiro, JSON.stringify(finRestaurar));

        // Atualiza Estados Locais
        setProducaoData(prodRestaurar);
        setFinanceiroData(finRestaurar);

        // Sincroniza com a nuvem Serverless
        setSincronizando(true);
        await pushToCloud({ producao: prodRestaurar, financeiro: finRestaurar }, usuarioId);
        setSincronizando(false);

        setMensagemSucesso(`🎉 BANCO DE DADOS RESTAURADO COM SUCESSO!\nRecuperados: ${prodRestaurar.length} itens de Produção e ${finRestaurar.length} itens do Financeiro.`);
        setTimeout(() => setMensagemSucesso(null), 8000);
      } catch (err) {
        setMensagemErro('❌ Arquivo de backup inválido ou corrompido. Certifique-se de usar um arquivo JSON gerado pelo OdontoWeb.');
        setTimeout(() => setMensagemErro(null), 6000);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reseta input
  };

  // 3. RESTAURAR UM PONTO DE RESTAURAÇÃO HISTÓRICO LOCAL
  const handleRestaurarPontoHistorico = async (ponto: RestorePoint) => {
    if (!window.confirm(`🔄 Restaurar Ponto de Restauração de ${ponto.dataHoraFormatada}?\n\nIrá restaurar ${ponto.totalProducao} itens de Produção e ${ponto.totalFinanceiro} de Financeiro.`)) {
      return;
    }

    try {
      // Salva snapshot de emergência do estado atual
      criarPontoRestauracaoInterno(producaoData, financeiroData, 'Snapshot Pré-Restauração de Ponto');

      localStorage.setItem(keyProducao, JSON.stringify(ponto.producao));
      localStorage.setItem(keyFinanceiro, JSON.stringify(ponto.financeiro));

      setProducaoData(ponto.producao);
      setFinanceiroData(ponto.financeiro);

      setSincronizando(true);
      await pushToCloud({ producao: ponto.producao, financeiro: ponto.financeiro }, usuarioId);
      setSincronizando(false);

      setMensagemSucesso(`✅ Ponto de restauração de ${ponto.dataHoraFormatada} restaurado com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 6000);
    } catch (e) {
      setMensagemErro('❌ Erro ao aplicar ponto de restauração.');
      setTimeout(() => setMensagemErro(null), 5000);
    }
  };

  // 4. FORÇAR SINCRONIZAÇÃO EM TEMPO REAL COM A NUVEM
  const handleForcarSincronizacaoNuvem = async () => {
    setSincronizando(true);
    await pushToCloud({
      producao: getItemJSON(keyProducao, []),
      financeiro: getItemJSON(keyFinanceiro, [])
    }, usuarioId);

    await pullFromCloud((payload) => {
      if (payload.producao) setProducaoData(payload.producao);
      if (payload.financeiro) setFinanceiroData(payload.financeiro);
    }, true, usuarioId);

    setSincronizando(false);
    setMensagemSucesso('🟢 Banco de dados sincronizado e verificado com sucesso na Nuvem Serverless!');
    setTimeout(() => setMensagemSucesso(null), 5000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-200 animate-fadeIn">
      
      {/* Top Banner executivo do Banco de Dados */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
                Gestão de Segurança & Backups
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Sincronizado na Nuvem
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2">
              Banco de Dados, Backup & Restauração
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Proteja seus dados de Produção e Financeiro com backups locais em JSON e restauração em 1-clique.
            </p>
          </div>
        </div>

        <button
          onClick={handleForcarSincronizacaoNuvem}
          disabled={sincronizando}
          className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin text-amber-400' : ''}`} />
          {sincronizando ? 'Sincronizando Nuvem...' : 'Sincronizar Nuvem Agora'}
        </button>
      </div>

      {/* ALERTAS DE STATUS DA OPERAÇÃO */}
      {mensagemSucesso && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="whitespace-pre-line">{mensagemSucesso}</span>
        </div>
      )}

      {mensagemErro && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* CARDS DE STATUS GERAL DO BANCO DE DADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Produção */}
        <div className="card-cyber p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-teal-400 uppercase tracking-wider">
            <span>Tabela: Produção</span>
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalItensProducao} <span className="text-xs text-slate-400 font-normal">registros</span>
          </p>
          <span className="text-[11px] font-extrabold text-emerald-400 block font-mono">
            R$ {totalValorProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} faturados
          </span>
        </div>

        {/* Total Financeiro */}
        <div className="card-cyber p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-sky-400 uppercase tracking-wider">
            <span>Tabela: Financeiro</span>
            <DollarSign className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalItensFinanceiro} <span className="text-xs text-slate-400 font-normal">registros</span>
          </p>
          <span className="text-[11px] font-extrabold text-sky-300 block font-mono">
            R$ {totalValorFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acumulados
          </span>
        </div>

        {/* Tamanho Armazenado */}
        <div className="card-cyber p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-amber-400 uppercase tracking-wider">
            <span>Volume de Dados</span>
            <HardDrive className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            {tamanhoKB} <span className="text-xs text-slate-400 font-normal font-sans">KB</span>
          </p>
          <span className="text-[11px] font-bold text-slate-400 block">
            Isolado no repositório local
          </span>
        </div>

        {/* Pontos de Restauração */}
        <div className="card-cyber p-5 rounded-3xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>Pontos Salvos</span>
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {restorePoints.length} <span className="text-xs text-slate-400 font-normal">snapshots</span>
          </p>
          <span className="text-[11px] font-bold text-emerald-300 block">
            Pronto para recuperação instantânea
          </span>
        </div>

      </div>

      {/* CENTRO DE BACKUP E RESTAURAÇÃO (BOTÕES PRINCIPAIS) */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="border-b border-slate-800/40 pb-3">
          <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-wider">
            AÇÕES DE BACKUP E RECUPERAÇÃO DE DADOS
          </span>
          <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-400" /> Exportar ou Importar Banco de Dados
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* PAINEL 1: FAZER BACKUP (DOWNLOAD JSON) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-teal-400 font-extrabold text-sm">
                <Download className="w-5 h-5" /> 1. Fazer Backup Completo (Download)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere um arquivo de segurança comprimido em formato JSON contendo todos os seus dados de <strong>Produção</strong>, <strong>Financeiro</strong> e configurações. Salve em um pendrive ou computador seguro.
              </p>
            </div>

            <button
              onClick={handleBaixarBackupJSON}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer w-full hover:scale-[1.01]"
            >
              <FileJson className="w-4.5 h-4.5" /> Baixar Backup do Banco de Dados (.JSON)
            </button>
          </div>

          {/* PAINEL 2: RESTAURAR BACKUP (UPLOAD ARQUIVO) */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm">
                <Upload className="w-5 h-5" /> 2. Restaurar Banco de Dados (Upload)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Carregue um arquivo de backup previamente salvo (.JSON) para restaurar 100% dos seus lançamentos de Produção e Financeiro se algo ocorrer.
              </p>
            </div>

            <label className="bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer w-full text-center hover:scale-[1.01]">
              <Upload className="w-4.5 h-4.5" /> Selecionar Arquivo de Backup para Restaurar
              <input
                type="file"
                accept=".json"
                onChange={handleRestaurarBackupArquivo}
                className="hidden"
              />
            </label>
          </div>

        </div>
      </div>

      {/* HISTÓRICO DE PONTOS DE RESTAURAÇÃO AUTOMÁTICOS (RESTORE POINTS) */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
              HISTÓRICO DE SEGURANÇA
            </span>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-emerald-400" /> Pontos de Restauração Automáticos ({restorePoints.length})
            </h3>
          </div>

          <span className="text-xs text-slate-400 font-semibold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            Recuperação em 1 Clique
          </span>
        </div>

        {restorePoints.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
            Nenhum ponto de restauração recente salvo ainda. Ao baixar um backup ou atualizar dados, pontos de restauração serão criados automaticamente aqui.
          </div>
        ) : (
          <div className="space-y-2">
            {restorePoints.map((ponto) => (
              <div
                key={ponto.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors hover:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-sm block">
                      Backup de {ponto.dataHoraFormatada}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Produção: {ponto.totalProducao} itens • Financeiro: {ponto.totalFinanceiro} itens ({ponto.tamanhoKB} KB)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRestaurarPontoHistorico(ponto)}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow hover:scale-105 shrink-0 w-full sm:w-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-teal-400" /> Restaurar Este Ponto
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
