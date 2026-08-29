import React, { useState } from 'react';
import {
  Scissors,
  Activity,
  Layers,
  FileCheck2,
  Sliders
} from 'lucide-react';

interface ModuloProtocolosEspecialidadeProps {
  darkMode?: boolean;
}

export const ModuloProtocolosEspecialidade: React.FC<ModuloProtocolosEspecialidadeProps> = ({ darkMode }) => {
  const [especialidadeAtiva, setEspecialidadeAtiva] = useState<'cirurgia' | 'endodontia' | 'dentistica' | 'periodontia'>('cirurgia');

  // Estados Cirurgia (Pell & Gregory & Winter)
  const [pellRamo, setPellRamo] = useState<'Classe I' | 'Classe II' | 'Classe III'>('Classe II');
  const [pellPosicao, setPellPosicao] = useState<'Posicao A' | 'Posicao B' | 'Posicao C'>('Posicao B');
  const [winterAngulacao, setWinterAngulacao] = useState<'Mesioangulado' | 'Distoangulado' | 'Vertical' | 'Horizontal'>('Mesioangulado');

  // Estados Endodontia
  const [cadDente, setCadDente] = useState<number>(22); // Comprimento Aparente do Dente
  const crdCalculado = cadDente - 1; // CRD = CAD - 1mm
  const ctCalculado = crdCalculado - 1; // CT = CRD - 1mm (Recuo de segurança)

  // Estados Periodontia (PSR)
  const [psrCodigo, setPsrCodigo] = useState<number>(2);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Abas Superiores das Especialidades Clínicas */}
      <div className="flex flex-wrap gap-2 text-xs font-extrabold border-b border-slate-800 pb-3">
        {[
          { id: 'cirurgia', label: 'Cirurgia (Terceiros Molares)', icon: Scissors },
          { id: 'endodontia', label: 'Endodontia (Odontometria & Irrigantes)', icon: Activity },
          { id: 'dentistica', label: 'Dentística & Prótese (Adesivos)', icon: Layers },
          { id: 'periodontia', label: 'Periodontia (PSR & Estadiamento)', icon: FileCheck2 }
        ].map((esp) => {
          const IconComponent = esp.icon;
          return (
            <button
              key={esp.id}
              onClick={() => setEspecialidadeAtiva(esp.id as any)}
              className={`px-4 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
                especialidadeAtiva === esp.id
                  ? 'bg-teal-500 text-slate-950 border-teal-400 font-black shadow-lg shadow-teal-500/20'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {esp.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo Dinâmico por Especialidade */}

      {/* 1. CIRURGIA BUCOMAXILOFACIAL */}
      {especialidadeAtiva === 'cirurgia' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Calculadora de Classificação de Inclusão */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-5 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-teal-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="w-5 h-5" /> Classificação de Terceiros Molares Inclusos
            </h3>

            <div className="space-y-4 text-xs">
              {/* Pell & Gregory - Ramo Mandibular */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Pell & Gregory (Espaço em Ramo Mandibular):</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Classe I', 'Classe II', 'Classe III'] as const).map((cl) => (
                    <button
                      key={cl}
                      onClick={() => setPellRamo(cl)}
                      className={`p-2.5 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                        pellRamo === cl ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cl}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {pellRamo === 'Classe I' && 'Espaço suficiente entre o ramo e a distal do 2º molar.'}
                  {pellRamo === 'Classe II' && 'Espaço menor que o diâmetro mesiodistal da coroa do 3º molar.'}
                  {pellRamo === 'Classe III' && 'Dente totalmente localizado dentro do ramo mandibular.'}
                </p>
              </div>

              {/* Pell & Gregory - Profundidade */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Pell & Gregory (Profundidade Relativa):</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Posicao A', 'Posicao B', 'Posicao C'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setPellPosicao(pos)}
                      className={`p-2.5 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                        pellPosicao === pos ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  {pellPosicao === 'Posicao A' && 'Plano oclusal do 3º molar no mesmo nível do 2º molar.'}
                  {pellPosicao === 'Posicao B' && 'Plano oclusal entre a linha oclusal e a cervical do 2º molar.'}
                  {pellPosicao === 'Posicao C' && 'Coroa abaixo da linha cervical do 2º molar.'}
                </p>
              </div>

              {/* Winter - Angulação */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Classificação de Winter (Angulação do Longo Eixo):</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Mesioangulado', 'Distoangulado', 'Vertical', 'Horizontal'] as const).map((ang) => (
                    <button
                      key={ang}
                      onClick={() => setWinterAngulacao(ang)}
                      className={`p-2.5 rounded-xl border text-center font-extrabold transition-all cursor-pointer ${
                        winterAngulacao === ang ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {ang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumo da Complexidade da Cirurgia */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-[11px]">
                <span className="font-extrabold text-teal-400 uppercase tracking-widest block text-[10px]">Diagnóstico de Complexidade Cirúrgica</span>
                <p className="font-bold text-white text-sm">
                  {pellRamo} • {pellPosicao} • {winterAngulacao}
                </p>
                <p className="text-slate-300 text-[11px]">
                  {pellRamo === 'Classe III' || pellPosicao === 'Posicao C' || winterAngulacao === 'Distoangulado'
                    ? '⚠️ Alta Complexidade Cirúrgica: Exige osteotomia extensa e odontossecção coronorradicular.'
                    : 'Moderada Complexidade: Exodontia cirúrgica padrão com retalho total e osteotomia discreta.'}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist do Passo a Passo Cirúrgico */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-sky-400 border-b border-slate-800 pb-3">
              Passo a Passo da Técnica Cirúrgica
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { passo: '1. Paramentação & Antissepsia Extra/Intraoral', desc: 'Clorexidina 0,12% bochecho por 1 min. Clorexidina 2% na pele perioral.' },
                { passo: '2. Anestesia Local Eficiente', desc: 'Bloqueio do Nervo Alveolar Inferior, Lingual e Bucal (para inferiores) ou Técnica Infiltrativa (superiores).' },
                { passo: '3. Incisão & Descolamento', desc: 'Incisão sulcular com alívio vestibular na distal do 2º molar. Descolamento mucoperiósteo com Descolador de Molt.' },
                { passo: '4. Osteotomia & Odontossecção', desc: 'Refrigeração abundante com Soro Fisiológico. Osteotomia de canaleta e secção do dente sob broca 702.' },
                { passo: '5. Exodontia & Curetagem', desc: 'Luxação com alavanca reta/angulada. Curetagem cuidadosa do saco pericoronário.' },
                { passo: '6. Irrigação Abundante & Sutura', desc: 'Irrigação com soro para remover serragem óssea. Sutura com fio de Seda/Nylon 4-0.' }
              ].map((p, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <h5 className="font-extrabold text-white text-xs">{p.passo}</h5>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ENDODONTIA */}
      {especialidadeAtiva === 'endodontia' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Calculadora de Odontometria */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-teal-400 border-b border-slate-800 pb-3">
              Determinação de Odontometria (CAD, CRD, CT)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Comprimento Aparente do Dente na Radiografia (CAD em mm):</label>
                <input
                  type="number"
                  value={cadDente}
                  onChange={(e) => setCadDente(Number(e.target.value) || 20)}
                  className={`w-full p-3 text-sm font-bold rounded-2xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-teal-400' : 'bg-slate-100 border-slate-200 text-teal-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-extrabold block">CAD (Radiográfico)</span>
                  <span className="text-lg font-black text-white font-mono">{cadDente} mm</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-extrabold block">CRD (CAD - 1mm)</span>
                  <span className="text-lg font-black text-sky-400 font-mono">{crdCalculado} mm</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-extrabold block">CT (Comprimento Trabalho)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">{ctCalculado} mm</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800">
                💡 O Comprimento de Trabalho (CT) estabelece o limite apical da instrumentação no limite CDC (Cimento-Dentina-Canal), 1 mm aquém do ápice radiográfico.
              </p>
            </div>
          </div>

          {/* Protocolo de Irrigação Endodôntica */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-sky-400 border-b border-slate-800 pb-3">
              Protocolo de Irrigação Químico-Mecânica
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/30 text-teal-200 space-y-1">
                <h5 className="font-extrabold text-teal-400">1. Hipoclorito de Sódio (NaOCl 2.5%)</h5>
                <p className="text-[11px] leading-relaxed">
                  Substância irrigante principal durante toda a instrumentação. Ação dissolvente tecidual e bactericida. Irrigar 3 a 5 mL a cada troca de lima.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 text-sky-200 space-y-1">
                <h5 className="font-extrabold text-sky-400">2. EDTA 17% (Remoção de Smear Layer)</h5>
                <p className="text-[11px] leading-relaxed">
                  Aplicar 3 mL de EDTA 17% por 3 minutos ao final do preparo. Agitar passivamente com lima ou ultrassom para desobstruir túbulos dentinários.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 space-y-1">
                <h5 className="font-extrabold text-emerald-400">3. Lavagem Final com Soro Fisiológico</h5>
                <p className="text-[11px] leading-relaxed">
                  Lavar abundantemente com soro para neutralizar resíduos químicos antes da secagem com cones de papel absorvente e obturação.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. DENTÍSTICA & PRÓTESE */}
      {especialidadeAtiva === 'dentistica' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-teal-400 border-b border-slate-800 pb-3">
              Guia de Sistemas Adesivos
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-amber-400">Condicionamento Ácido Total (3 ou 2 Passos)</h5>
                <p className="text-slate-300 text-[11px]">
                  Ácido Fosfórico 37% por 30s em esmalte e 15s em dentina. Lavar pelo dobro do tempo. Manter dentina ligeiramente úmida.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-emerald-400">Sistemas Adesivos Universais</h5>
                <p className="text-slate-300 text-[11px]">
                  Permitem condicionamento seletivo de esmalte. Aplicação friccional ativa por 20 segundos na dentina + jacto de ar + fotopolimerização 20s.
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-sky-400 border-b border-slate-800 pb-3">
              Protocolo de Cimentação Adesiva (Cerâmicas)
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-white">Preparo da Peça Cerâmica Vítrea</h5>
                <p className="text-slate-300 text-[11px]">
                  Ácido Fluorídrico 10% por 20s (Dissilicato de Lítio) ou 60s (Feldspática) + Lavagem + Silano por 1 min.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-white">Cimentação Resinosa Dual</h5>
                <p className="text-slate-300 text-[11px]">
                  Assentamento com cimento dual, remoção imediata dos excessos no estado gel e fotopolimerização por 40s em cada face.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PERIODONTIA */}
      {especialidadeAtiva === 'periodontia' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-teal-400 border-b border-slate-800 pb-3">
              Calculadora de PSR (Periodontal Screening and Recording)
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Selecione o Código PSR Observado na Sondagem:</label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 1, 2, 3, 4].map((cod) => (
                    <button
                      key={cod}
                      onClick={() => setPsrCodigo(cod)}
                      className={`p-3 rounded-xl border text-center font-black text-sm transition-all cursor-pointer ${
                        psrCodigo === cod ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {cod}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block">Resultado & Conduta PSR</span>
                <h5 className="font-bold text-white text-sm">Código {psrCodigo}</h5>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {psrCodigo === 0 && 'Faixa preta da sonda OMS totalmente visível. Sem sangramento ou cálculo. Conduta: Higiene bucal preventiva.'}
                  {psrCodigo === 1 && 'Faixa preta visível. Sangramento à sondagem presente. Conduta: Remoção de placa e instrução de higiene.'}
                  {psrCodigo === 2 && 'Faixa preta visível. Sangramento + Cálculo supragingival ou margem defeituosa. Conduta: Raspagem supragingival e polimento.'}
                  {psrCodigo === 3 && 'Faixa preta parcialmente oculta (Profundidade 3.5 a 5.5 mm). Conduta: Exame periodontal completo do sextante.'}
                  {psrCodigo === 4 && 'Faixa preta totalmente oculta (> 5.5 mm). Conduta: Exame periodontal completo de toda a boca (Perio Chart).'}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base text-sky-400 border-b border-slate-800 pb-3">
              Estadiamento da Periodontite (AAP / EFP 2018)
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <h5 className="font-bold text-emerald-400">Estágio I (Periodontite Leve)</h5>
                <p className="text-[11px] text-slate-400">Perda de inserção interdental de 1 a 2 mm. Perda óssea em terço coronário (&lt; 15%).</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <h5 className="font-bold text-sky-400">Estágio II (Periodontite Moderada)</h5>
                <p className="text-[11px] text-slate-400">Perda de inserção interdental de 3 a 4 mm. Perda óssea em terço coronário (15% a 33%).</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <h5 className="font-bold text-amber-400">Estágio III (Periodontite Severa)</h5>
                <p className="text-[11px] text-slate-400">Perda de inserção &ge; 5 mm. Perda de dentes &le; 4 por razões periodontais. Defeitos verticais e furcas.</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-0.5">
                <h5 className="font-bold text-rose-400">Estágio IV (Periodontite Avançada)</h5>
                <p className="text-[11px] text-slate-400">Perda de dentes &ge; 5. Colapso oclusal, mobilidade grau III e disfunção mastigatória grave.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
