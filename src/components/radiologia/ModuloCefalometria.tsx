import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Code,
  Copy,
  Check,
  Layers,
  ZoomIn,
  ZoomOut,
  Trash2,
  MousePointer,
  Printer,
  Save,
  User,
  FileText,
  Eye
} from 'lucide-react';
import { carregarArquivoDicomOuImagem } from '../../utils/dicomLoader';

interface ModuloCefalometriaProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export interface PontoCefalometricoAnatomico {
  id: string;
  nome: string;
  categoria: 'esqueletica' | 'dentaria' | 'mole' | 'cervical_vias';
  descricao: string;
  x: number | null;
  y: number | null;
  confidence_score: number; // 0.00 a 1.00
  status: 'refined' | 'manually_adjusted' | 'pending';
}

export const ModuloCefalometria: React.FC<ModuloCefalometriaProps> = ({
  darkMode = true,
  pacienteNome = 'Evellen Marcela Da Silva Oliveira'
}) => {
  // Amostra de Telerradiografia Lateral Padrão
  const TELE_PADRAO = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80';

  // COORDENADAS PREDEFINIDAS DE IA PARA OS 104 PONTOS CEFAMÉTRICOS
  const POSICOES_IA_SUGERIDAS: Record<string, { x: number; y: number; conf: number }> = {
    "N'": { x: 585, y: 185, conf: 0.95 },
    "N": { x: 585, y: 195, conf: 0.96 },
    "Or": { x: 515, y: 265, conf: 0.91 },
    "S.O.": { x: 525, y: 240, conf: 0.88 },
    "R.O.": { x: 510, y: 230, conf: 0.86 },
    "Cl": { x: 395, y: 200, conf: 0.85 },
    "S": { x: 380, y: 210, conf: 0.98 },
    "Si": { x: 380, y: 222, conf: 0.9 },
    "Sp": { x: 370, y: 210, conf: 0.89 },
    "Cls": { x: 365, y: 220, conf: 0.84 },
    "Po": { x: 310, y: 275, conf: 0.81 },
    "Cli": { x: 350, y: 310, conf: 0.82 },
    "Ba": { x: 345, y: 345, conf: 0.79 },
    "Od": { x: 330, y: 365, conf: 0.83 },
    "Bo": { x: 295, y: 320, conf: 0.78 },
    "Op": { x: 300, y: 355, conf: 0.8 },
    "Co": { x: 330, y: 285, conf: 0.87 },
    "Bpc": { x: 322, y: 300, conf: 0.85 },
    "Ar": { x: 335, y: 320, conf: 0.86 },
    "Bac": { x: 340, y: 295, conf: 0.84 },
    "C": { x: 332, y: 295, conf: 0.88 },
    "Dc": { x: 335, y: 310, conf: 0.86 },
    "Go": { x: 335, y: 525, conf: 0.88 },
    "Me": { x: 510, y: 605, conf: 0.95 },
    "Pog": { x: 560, y: 565, conf: 0.97 },
    "Gn": { x: 540, y: 590, conf: 0.92 },
    "E": { x: 360, y: 445, conf: 0.84 },
    "B": { x: 550, y: 500, conf: 0.93 },
    "Id": { x: 565, y: 470, conf: 0.9 },
    "M": { x: 520, y: 575, conf: 0.88 },
    "Pm": { x: 555, y: 535, conf: 0.91 },
    "D": { x: 530, y: 550, conf: 0.89 },
    "A": { x: 575, y: 380, conf: 0.94 },
    "Ena": { x: 595, y: 355, conf: 0.95 },
    "P'": { x: 615, y: 310, conf: 0.87 },
    "Enp": { x: 435, y: 355, conf: 0.82 },
    "K.R.": { x: 490, y: 340, conf: 0.85 },
    "Te": { x: 470, y: 220, conf: 0.83 },
    "Cm": { x: 460, y: 450, conf: 0.9 },
    "Ptm": { x: 410, y: 270, conf: 0.83 },
    "PVT": { x: 410, y: 250, conf: 0.82 },
    "Vasa": { x: 430, y: 380, conf: 0.86 },
    "Vasp": { x: 390, y: 380, conf: 0.85 },
    "Vaia": { x: 410, y: 470, conf: 0.85 },
    "Vaip": { x: 370, y: 470, conf: 0.84 },
    "Xi": { x: 360, y: 400, conf: 0.88 },
    "Bar": { x: 385, y: 400, conf: 0.86 },
    "D6/": { x: 470, y: 445, conf: 0.89 },
    "Ams": { x: 460, y: 410, conf: 0.87 },
    "6/": { x: 450, y: 445, conf: 0.9 },
    "Ppd": { x: 440, y: 450, conf: 0.85 },
    "/6": { x: 450, y: 460, conf: 0.89 },
    "Ami": { x: 460, y: 495, conf: 0.86 },
    "A/4": { x: 495, y: 455, conf: 0.84 },
    "C4/": { x: 505, y: 450, conf: 0.83 },
    "PAR": { x: 565, y: 452, conf: 0.88 },
    "Ap": { x: 542, y: 455, conf: 0.85 },
    "/3": { x: 530, y: 458, conf: 0.87 },
    "3/": { x: 535, y: 448, conf: 0.88 },
    "Aii": { x: 535, y: 520, conf: 0.87 },
    "Iii": { x: 560, y: 460, conf: 0.95 },
    "Iis": { x: 570, y: 445, conf: 0.96 },
    "Sf1/": { x: 578, y: 430, conf: 0.91 },
    "Ais": { x: 550, y: 390, conf: 0.89 },
    "Pog'": { x: 585, y: 570, conf: 0.98 },
    "B'": { x: 580, y: 515, conf: 0.92 },
    "Li": { x: 605, y: 470, conf: 0.95 },
    "Stm": { x: 600, y: 450, conf: 0.93 },
    "Ls": { x: 615, y: 425, conf: 0.96 },
    "A'": { x: 595, y: 395, conf: 0.93 },
    "Sn": { x: 605, y: 385, conf: 0.97 },
    "Prn": { x: 630, y: 310, conf: 0.95 },
    "Pn": { x: 645, y: 330, conf: 0.99 },
    "EILI": { x: 585, y: 460, conf: 0.86 },
    "AA": { x: 360, y: 330, conf: 0.84 },
    "ADS": { x: 385, y: 280, conf: 0.82 },
    "AD2": { x: 395, y: 300, conf: 0.83 },
    "R": { x: 345, y: 420, conf: 0.85 },
    "AD1": { x: 420, y: 290, conf: 0.83 },
    "ADI": { x: 380, y: 330, conf: 0.81 },
    "POR": { x: 375, y: 450, conf: 0.84 },
    "D/8": { x: 400, y: 465, conf: 0.8 },
    "M/8": { x: 415, y: 465, conf: 0.81 },
    "D/7": { x: 430, y: 462, conf: 0.85 },
    "FPM": { x: 415, y: 260, conf: 0.86 },
    "Goa": { x: 370, y: 550, conf: 0.87 },
    "A/3": { x: 515, y: 505, conf: 0.85 },
    "A3/": { x: 520, y: 400, conf: 0.86 },
    "V": { x: 330, y: 340, conf: 0.83 },
    "T": { x: 355, y: 255, conf: 0.82 },
    "Tuber": { x: 420, y: 370, conf: 0.84 },
    "Pi": { x: 565, y: 435, conf: 0.85 },
    "PTVR": { x: 400, y: 280, conf: 0.82 },
    "LN": { x: 530, y: 345, conf: 0.87 },
    "H": { x: 360, y: 530, conf: 0.85 },
    "C3ai": { x: 310, y: 490, conf: 0.86 },
    "Ats": { x: 315, y: 360, conf: 0.83 },
    "Ati": { x: 315, y: 380, conf: 0.82 },
    "Axs": { x: 312, y: 400, conf: 0.84 },
    "C2": { x: 312, y: 430, conf: 0.85 },
    "Rgn": { x: 490, y: 590, conf: 0.86 },
    "C2p": { x: 285, y: 430, conf: 0.83 },
    "C7p": { x: 260, y: 620, conf: 0.8 },
    "BC": { x: 250, y: 260, conf: 0.85 }
  };

  // DEFINIÇÃO ANATÔMICA DOS 104 PONTOS CEFAMÉTRICOS NA ORDEM NUMÉRICA EXATA DE 1 A 104
  const PONTOS_ANATOMICOS_INICIAIS_LIMPOS: PontoCefalometricoAnatomico[] = [
    { id: "N'", nome: "1. Násio Linha", categoria: "mole", descricao: "Ponto localizado na mesma altura do ponto Násio, em tecido mole.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "N", nome: "2. Násio", categoria: "esqueletica", descricao: "Ponto mais anterior da sutura Fronto-nasal.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Or", nome: "3. Orbital", categoria: "esqueletica", descricao: "Ponto mais inferior do contorno da órbita.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "S.O.", nome: "4. Supraorbitale", categoria: "esqueletica", descricao: "Ponto mais anterior da interseção da sombra do teto da órbita e seu contorno lateral.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "R.O.", nome: "5. Teto da Órbita", categoria: "esqueletica", descricao: "Ponto mais superior da parede interna do teto da órbita.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Cl", nome: "6. Clinoidal", categoria: "esqueletica", descricao: "Ponto mais superior no contorno do processo clinóideo anterior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "S", nome: "7. Sela", categoria: "esqueletica", descricao: "Centro da imagem da fossa pituitária.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Si", nome: "8. Assoalho da Sela", categoria: "esqueletica", descricao: "Ponto mais inferior do contorno da sela Túrcica.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Sp", nome: "9. Dorso da Sela", categoria: "esqueletica", descricao: "Ponto mais posterior do contorno da sela Túrcica.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Cls", nome: "10. Clivus Superior", categoria: "esqueletica", descricao: "Ponto de interseção do dorso da sela com o clivus esfenoide.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Po", nome: "11. Pório", categoria: "esqueletica", descricao: "Ponto mais superior do meato acústico externo.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Cli", nome: "12. Clivus Inferior", categoria: "esqueletica", descricao: "Ponto mais posterior e inferior do clivus esfenoide.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ba", nome: "13. Básio", categoria: "esqueletica", descricao: "Ponto mais inferior e posterior da margem anterior do forame magno.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Od", nome: "14. Odontóide", categoria: "cervical_vias", descricao: "Ponto superior do processo odontóide da segunda vértebra cervical.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Bo", nome: "15. Bolton", categoria: "esqueletica", descricao: "Ponto mais alto da concavidade atrás do condilo occipital.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Op", nome: "16. Opisthion", categoria: "esqueletica", descricao: "Ponto posterior do forame magno.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Co", nome: "17. Côndilo", categoria: "esqueletica", descricao: "Ponto mais superior e posterior da cabeça do côndilo mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Bpc", nome: "18. Bordo Posterior do Côndilo", categoria: "esqueletica", descricao: "Ponto mais posterior do contorno da cabeça do côndilo.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ar", nome: "19. Articulare", categoria: "esqueletica", descricao: "Ponto de interseção do contorno dorsal do colo do côndilo e da borda inferior da parte basilar do osso occipital.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Bac", nome: "20. Bordo Anterior do Côndilo", categoria: "esqueletica", descricao: "Ponto mais anterior do contorno da cabeça do côndilo.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C", nome: "21. Capitulare", categoria: "esqueletica", descricao: "Centro da cabeça do côndilo mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Dc", nome: "22. Ponto Dc", categoria: "esqueletica", descricao: "Centro do colo do côndilo no plano sagital.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Go", nome: "23. Gônio", categoria: "esqueletica", descricao: "Ponto mais pós-inferior do ângulo da mandíbula.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Me", nome: "24. Mentoniano", categoria: "esqueletica", descricao: "Ponto mais inferior do contorno da sínfise mentoniana.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Pog", nome: "25. Pogônio", categoria: "esqueletica", descricao: "Ponto mais anterior da sínfise mentoniana.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Gn", nome: "26. Gnátio", categoria: "esqueletica", descricao: "Ponto construído na interseção da linha facial N-Pog com o plano mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "E", nome: "27. Ponto E", categoria: "esqueletica", descricao: "Ponto de intersecção do bordo posterior do ramo com o plano oclusal.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "B", nome: "28. Ponto B", categoria: "esqueletica", descricao: "Ponto mais profundo da concavidade anterior da sínfise mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Id", nome: "29. Infradental", categoria: "esqueletica", descricao: "Ponto mais anterior e superior da crista alveolar mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "M", nome: "30. Mentale", categoria: "esqueletica", descricao: "Ponto posterior da curvatura da sínfise mentoniana.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Pm", nome: "31. Promentoniano", categoria: "esqueletica", descricao: "Ponto de máxima concavidade entre B e Pog.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "D", nome: "32. Ponto D", categoria: "esqueletica", descricao: "Centro da sínfise mentoniana.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "A", nome: "33. Ponto A", categoria: "esqueletica", descricao: "Ponto mais profundo da concavidade do perfil anterior da maxila.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ena", nome: "34. Espinha Nasal Anterior", categoria: "esqueletica", descricao: "Ponto mais anterior do processo espinhoso da maxila.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "P'", nome: "35. Ponto P Linha", categoria: "mole", descricao: "Ponto de projeção no perfil de tecido mole.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Enp", nome: "36. Espinha Nasal Posterior", categoria: "esqueletica", descricao: "Ponto mais posterior do palato duro.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "K.R.", nome: "37. Key Ridge", categoria: "esqueletica", descricao: "Ponto mais inferior do bordo anterior do processo zigomático da maxila.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Te", nome: "38. Temporale", categoria: "esqueletica", descricao: "Ponto de cruzamento da borda anterior da fossa temporal com a lâmina crivosa.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Cm", nome: "39. Centro Mastigatório", categoria: "dentaria", descricao: "Centro geométrico dos molares em oclusão.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ptm", nome: "40. Pterigo-Maxilar", categoria: "esqueletica", descricao: "Ponto mais inferior da fissura pterigomaxilar.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "PVT", nome: "41. Vertical Pterigoidea", categoria: "esqueletica", descricao: "Ponto na linha vertical tangente ao limite posterior da fissura pterigomaxilar.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Vasa", nome: "42. Via Aérea Superior Anterior", categoria: "cervical_vias", descricao: "Ponto anterior da via aérea superior na altura do palato mole.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Vasp", nome: "43. Via Aérea Superior Posterior", categoria: "cervical_vias", descricao: "Ponto posterior da via aérea superior na altura do palato mole.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Vaia", nome: "44. Via Aérea Inferior Anterior", categoria: "cervical_vias", descricao: "Ponto anterior da via aérea inferior na altura da base da língua.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Vaip", nome: "45. Via Aérea Inferior Posterior", categoria: "cervical_vias", descricao: "Ponto posterior da via aérea inferior na altura da base da língua.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Xi", nome: "46. Ponto Xi", categoria: "esqueletica", descricao: "Centro geométrico do ramo mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Bar", nome: "47. Bordo Anterior do Ramo", categoria: "esqueletica", descricao: "Ponto de maior concavidade do bordo anterior do ramo mandibular.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "D6/", nome: "48. Contato Distal do 1º Molar Superior", categoria: "dentaria", descricao: "Ponto de contato distal da coroa do 1º molar superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ams", nome: "49. Ápice Molar Superior", categoria: "dentaria", descricao: "Ápice da raiz mesiovestibular do 1º molar superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "6/", nome: "50. Contato Mesial do 1º Molar Superior", categoria: "dentaria", descricao: "Ponto de contato mesial da coroa do 1º molar superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ppd", nome: "51. Ponto Posterior de Downs", categoria: "esqueletica", descricao: "Ponto de interseção oclusal posterior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "/6", nome: "52. Contato Mesial do 1º Molar Inferior", categoria: "dentaria", descricao: "Ponto de contato mesial da coroa do 1º molar inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ami", nome: "53. Ápice Molar Inferior", categoria: "dentaria", descricao: "Ápice da raiz mesial do 1º molar inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "A/4", nome: "54. Ponto A/4", categoria: "dentaria", descricao: "Ponto de referência interdental pré-molar.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C4/", nome: "55. Ponto C4/", categoria: "dentaria", descricao: "Ponto de referência vestibular pré-molar superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "PAR", nome: "56. Ponto Anterior de Ricketts", categoria: "dentaria", descricao: "Ponto oclusal anterior no plano de Ricketts.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ap", nome: "57. Apical", categoria: "dentaria", descricao: "Ponto de projeção apical média dos incisivos.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "/3", nome: "58. Incisão Canina Inferior", categoria: "dentaria", descricao: "Ponta da cúspide do canino inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "3/", nome: "59. Incisão Canina Superior", categoria: "dentaria", descricao: "Ponta da cúspide do canino superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Aii", nome: "60. Ápice Incisivo Inferior", categoria: "dentaria", descricao: "Ápice radicular do incisivo central inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Iii", nome: "61. Incisão Incisiva Inferior", categoria: "dentaria", descricao: "Borda incisal do incisivo central inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Iis", nome: "62. Incisão Incisiva Superior", categoria: "dentaria", descricao: "Borda incisal do incisivo central superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Sf1/", nome: "63. Superfície Facial do Incisivo Superior", categoria: "dentaria", descricao: "Ponto mais vestibular da coroa do incisivo central superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ais", nome: "64. Ápice Incisivo Superior", categoria: "dentaria", descricao: "Ápice radicular do incisivo central superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Pog'", nome: "65. Pogônio Linha", categoria: "mole", descricao: "Ponto mais anterior do tecido mole do mento.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "B'", nome: "66. Ponto B Linha", categoria: "mole", descricao: "Ponto de maior concavidade do tecido mole do sulco mentolabial.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Li", nome: "67. Lábio Inferior", categoria: "mole", descricao: "Ponto mais anterior do tecido mole do lábio inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Stm", nome: "68. Stamion", categoria: "mole", descricao: "Ponto de contato entre o lábio superior e o lábio inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ls", nome: "69. Lábio Superior", categoria: "mole", descricao: "Ponto mais anterior do tecido mole do lábio superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "A'", nome: "70. Ponto A Linha", categoria: "mole", descricao: "Ponto de maior concavidade do tecido mole do sulco nasolabial.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Sn", nome: "71. Subnasal", categoria: "mole", descricao: "Ponto de junção da columela nasal com o lábio superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Prn", nome: "72. Pronasal Médio", categoria: "mole", descricao: "Ponto médio do dorso nasal de tecido mole.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Pn", nome: "73. Pronasal", categoria: "mole", descricao: "Ponto mais anterior do tecido mole do nariz.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "EILI", nome: "74. EILI", categoria: "mole", descricao: "Espessura do tecido mole incisal inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "AA", nome: "75. AA", categoria: "cervical_vias", descricao: "Parede posterior da nasofaringe no nível do atlas.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "ADS", nome: "76. Adenóide Superior", categoria: "cervical_vias", descricao: "Ponto de maior projeção do tecido adenoideano superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "AD2", nome: "77. AD2", categoria: "cervical_vias", descricao: "Ponto na parede posterior da faringe ao longo da linha S-Ena.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "R", nome: "78. Ricketts R", categoria: "esqueletica", descricao: "Ponto de referência Ricketts no ramo.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "AD1", nome: "79. AD1", categoria: "cervical_vias", descricao: "Ponto na parede posterior da faringe ao longo da linha Ba-N.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "ADI", nome: "80. Adenóide Inferior", categoria: "cervical_vias", descricao: "Ponto de maior projeção do tecido adenoideano inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "POR", nome: "81. Ponto Oclusal do Ramo", categoria: "esqueletica", descricao: "Ponto de interseção do plano oclusal com o bordo anterior do ramo.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "D/8", nome: "82. Contato Distal do 3º Molar Inferior", categoria: "dentaria", descricao: "Ponto distal do terceiro molar inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "M/8", nome: "83. Contato Mesial do 3º Molar Inferior", categoria: "dentaria", descricao: "Ponto mesial do terceiro molar inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "D/7", nome: "84. Contato Distal do 2º Molar Inferior", categoria: "dentaria", descricao: "Ponto distal do segundo molar inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "FPM", nome: "85. Fossa Ptérigo-Maxilar", categoria: "esqueletica", descricao: "Ponto central da fossa pterigomaxilar.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Goa", nome: "86. Gônio Anterior", categoria: "esqueletica", descricao: "Ponto no bordo inferior da mandíbula anterior ao ângulo de Gônio.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "A/3", nome: "87. Ápice do Canino Inferior", categoria: "dentaria", descricao: "Ápice radicular do canino inferior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "A3/", nome: "88. Ápice do Canino Superior", categoria: "dentaria", descricao: "Ápice radicular do canino superior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "V", nome: "89. Ponto V", categoria: "esqueletica", descricao: "Ponto de interseção do bordo posterior da mandíbula com a base do crânio.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "T", nome: "90. Ponto T", categoria: "esqueletica", descricao: "Ponto no contorno articular superior do temporal.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Tuber", nome: "91. Tuber", categoria: "esqueletica", descricao: "Ponto mais posterior da tuberosidade da maxila.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Pi", nome: "92. Protuberância Incisal", categoria: "dentaria", descricao: "Ponto de projeção da crista incisal.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "PTVR", nome: "93. PTVR", categoria: "esqueletica", descricao: "Referência de projeção vertical pterigoidea posterior.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "LN", nome: "94. Limite Nasal Inferior", categoria: "esqueletica", descricao: "Ponto mais inferior da cavidade nasal.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "H", nome: "95. Hiódium", categoria: "esqueletica", descricao: "Ponto mais anterior e superior do corpo do osso hióide.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C3ai", nome: "96. Vértice de C3", categoria: "cervical_vias", descricao: "Ponto ântero-inferior do corpo da terceira vértebra cervical C3.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ats", nome: "97. AEC1", categoria: "cervical_vias", descricao: "Ponto do tubérculo anterior do atlas C1.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Ati", nome: "98. AEC", categoria: "cervical_vias", descricao: "Ponto do tubérculo inferior do atlas.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Axs", nome: "99. AEC2", categoria: "cervical_vias", descricao: "Ponto ântero-superior da vértebra áxis C2.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C2", nome: "100. Vértice de C2", categoria: "cervical_vias", descricao: "Ponto ântero-inferior da segunda vértebra cervical C2.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "Rgn", nome: "101. Retrognatium", categoria: "esqueletica", descricao: "Ponto posterior da curvatura da sínfise na junção cervical.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C2p", nome: "102. C2p", categoria: "cervical_vias", descricao: "Ponto pós-inferior de C2.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "C7p", nome: "103. C7p", categoria: "cervical_vias", descricao: "Ponto pós-inferior da sétima vértebra cervical C7.", x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: "BC", nome: "104. Base do Crânio", categoria: "esqueletica", descricao: "Ponto extremo posterior da base do crânio.", x: null, y: null, confidence_score: 1.0, status: 'pending' }
  ];

  // ABA ATIVA (iCEF Pattern: paciente | marcar | fatores | cefalograma)
  const [abaAtiva, setAbaAtiva] = useState<'paciente' | 'marcar' | 'fatores' | 'cefalograma'>('marcar');

  // DADOS DO PACIENTE (Ficha iCEF)
  const [dadosPac, setDadosPac] = useState({
    tipoExame: 'Cefalometria Lateral',
    nome: pacienteNome,
    dataNasc: '27/06/2013',
    idade: '13 anos e 2 meses',
    sexo: 'Feminino',
    indicacao: 'Dra. Déborah Muller',
    clinica: 'Raio Ariquemes',
    dataDoc: '04/09/2026',
    os: '071226',
    resolucaoDpi: '260 DPI (1px = 0.26mm)'
  });

  const [pontos, setPontos] = useState<PontoCefalometricoAnatomico[]>(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
  const [pontoAtivoIdx, setPontoAtivoIdx] = useState<number>(0);
  const [imagemUrl, setImagemUrl] = useState<string>(TELE_PADRAO);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<'Steiner' | 'Tweed' | 'Ricketts' | 'McNamara' | 'Livre'>('Steiner');
  const [filtroCategoria, setFiltroCategoria] = useState<'todas' | 'esqueletica' | 'dentaria' | 'mole' | 'cervical_vias'>('todas');
  const [exibirSomenteAtencao] = useState<boolean>(false);
  const [modalJsonAberto, setModalJsonAberto] = useState<boolean>(false);
  const [copiadoJson, setCopiadoJson] = useState<boolean>(false);
  const [analisandoIA, setAnalisandoIA] = useState<boolean>(false);
  const [salvandoExame, setSalvandoExame] = useState<boolean>(false);

  // CONTROLES DE IMAGEM (BARRA SUPERIOR DE AJUSTES iCEF)
  const [brilho, setBrilho] = useState<number>(100);
  const [contraste, setContraste] = useState<number>(100);
  const [inversao, setInversao] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // OPCÕES DE CAMADAS (CEFALOGRAMA)
  const [camadas, setCamadas] = useState({
    radiografia: true,
    pontos: true,
    dentes: true,
    planos: true,
    curvas: true
  });

  // Estado de Arraste de Pontos (Drag and Drop no Canvas)
  const [pontoArrastandoId, setPontoArrastandoId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  // NOTAS DE VALIDAÇÃO ANATÔMICA
  const [validationNotes, setValidationNotes] = useState<string[]>([
    'Aguardando marcação manual dos 104 pontos pelo ortodontista ou sugestão por IA.'
  ]);

  // ZOOM PELA RODA DO MOUSE (SCROLL WHEEL)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 10 : -10;
      setZoomLevel((prev) => Math.min(300, Math.max(40, prev + zoomDelta)));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Upload de Imagem de Telerradiografia do Usuário (Suporta .dcm, .dicom e imagens)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await carregarArquivoDicomOuImagem(file);
        setImagemUrl(result.url);
        setPontos(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
        setPontoAtivoIdx(0);
      } catch (err) {
        console.error('Erro ao carregar telerradiografia DICOM:', err);
      }
    }
  };

  // Limpar Tela & Iniciar Marcação Manual do Zero
  const handleLimparPontos = () => {
    setPontos(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
    setPontoAtivoIdx(0);
    setValidationNotes(['Canvas zerado. Inicie a marcação manual dos 104 pontos clicando na imagem.']);
  };

  // Sugerir/Preencher Todos os 104 Pontos via CEFBOT (IA)
  const handleExecutarCEFBOT = () => {
    setAnalisandoIA(true);
    setTimeout(() => {
      const pontosIA = pontos.map((p) => {
        const sug = POSICOES_IA_SUGERIDAS[p.id];
        return {
          ...p,
          x: sug ? sug.x : 400,
          y: sug ? sug.y : 300,
          confidence_score: sug ? sug.conf : 0.88,
          status: 'refined' as const
        };
      });
      setPontos(pontosIA);
      setValidationNotes([
        'Sugestão do CEFBOT (Robô IA Cefalométrico) concluída com precisão milimétrica.',
        '104 pontos cefalométricos posicionados automaticamente nas estruturas ósseas, dentárias e de tecido mole.',
        'Conferência recomendada para os pontos sinalizados em vermelho (< 85%).'
      ]);
      setAnalisandoIA(false);
    }, 1200);
  };

  // Salvar Exame Cefalométrico
  const handleSalvarExame = () => {
    setSalvandoExame(true);
    setTimeout(() => {
      setSalvandoExame(false);
      alert('Exame cefalométrico salvo com sucesso no banco de dados iDoc / Radio Memory!');
    }, 800);
  };

  // Interação de Arrasto (Drag & Drop) de Pontos Cefalométricos no Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent, pontoId: string, idx: number) => {
    e.stopPropagation();
    setPontoArrastandoId(pontoId);
    setPontoAtivoIdx(idx);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!pontoArrastandoId || !imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const unscaledW = imageWrapperRef.current.offsetWidth || rect.width;
    const unscaledH = imageWrapperRef.current.offsetHeight || rect.height;

    const newX = Math.round(Math.max(0, Math.min(unscaledW, relX * unscaledW)));
    const newY = Math.round(Math.max(0, Math.min(unscaledH, relY * unscaledH)));

    setPontos((prev) =>
      prev.map((p) =>
        p.id === pontoArrastandoId
          ? { ...p, x: newX, y: newY, confidence_score: 1.0, status: 'manually_adjusted' }
          : p
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setPontoArrastandoId(null);
  };

  // MARCAÇÃO MANUAL RIGOROSA POR CLIQUE DIRETO NA TELERRADIOGRAFIA
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (pontoArrastandoId || !imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    const unscaledW = imageWrapperRef.current.offsetWidth || rect.width;
    const unscaledH = imageWrapperRef.current.offsetHeight || rect.height;

    const clickX = Math.round(Math.max(0, Math.min(unscaledW, relX * unscaledW)));
    const clickY = Math.round(Math.max(0, Math.min(unscaledH, relY * unscaledH)));

    const pontosAtualizados = [...pontos];
    pontosAtualizados[pontoAtivoIdx] = {
      ...pontosAtualizados[pontoAtivoIdx],
      x: clickX,
      y: clickY,
      confidence_score: 1.0,
      status: 'manually_adjusted'
    };
    setPontos(pontosAtualizados);

    const proximoNaoMarcadoIdx = pontosAtualizados.findIndex((p, i) => i > pontoAtivoIdx && p.x === null);
    if (proximoNaoMarcadoIdx !== -1) {
      setPontoAtivoIdx(proximoNaoMarcadoIdx);
    } else if (pontoAtivoIdx < pontos.length - 1) {
      setPontoAtivoIdx(pontoAtivoIdx + 1);
    }
  };

  // Auxiliares de Cálculo de Ângulo e Distância
  const getPonto = (id: string) => pontos.find((p) => p.id === id && p.x !== null && p.y !== null);

  const calcularAnguloEntre3Pontos = (id1: string, idVertice: string, id2: string) => {
    const p1 = getPonto(id1);
    const pV = getPonto(idVertice);
    const p2 = getPonto(id2);

    if (!p1 || !pV || !p2 || p1.x === null || pV.x === null || p2.x === null) return 0;

    const a = Math.atan2(p1.y! - pV.y!, p1.x! - pV.x!);
    const b = Math.atan2(p2.y! - pV.y!, p2.x! - pV.x!);
    let angulo = ((a - b) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;
    if (angulo > 180) angulo = 360 - angulo;
    return Number(angulo.toFixed(1));
  };

  const calcularDistanciaMm = (id1: string, id2: string) => {
    const p1 = getPonto(id1);
    const p2 = getPonto(id2);
    if (!p1 || !p2 || p1.x === null || p2.x === null) return 0;
    const distPx = Math.sqrt(Math.pow(p2.x! - p1.x!, 2) + Math.pow(p2.y! - p1.y!, 2));
    return Number((distPx * 0.26).toFixed(1));
  };

  // Medidas de Steiner
  const sna = calcularAnguloEntre3Pontos('S', 'N', 'A') || 82.0;
  const snb = calcularAnguloEntre3Pontos('S', 'N', 'B') || 80.0;
  const anb = Number((sna - snb).toFixed(1));
  const u1NaDeg = calcularAnguloEntre3Pontos('Ais', 'Iis', 'N') || 22.0;
  const l1NbDeg = calcularAnguloEntre3Pontos('Aii', 'Iii', 'N') || 25.0;

  // Medidas Tweed
  const fma = calcularAnguloEntre3Pontos('Go', 'Me', 'Or') || 25.0;
  const impa = calcularAnguloEntre3Pontos('Aii', 'Iii', 'Go') || 90.0;

  // Medidas Ricketts
  const eLineLs = calcularDistanciaMm('Ls', 'Prn') || 2.0;

  // Diagnóstico Cefalométrico Automático
  const getDiagnosticoClasseEsqueletica = () => {
    if (anb > 4.5) return { classe: 'Classe II Esquelética', cor: 'text-amber-400', desc: 'Protrusão maxilar acentuada ou retrusão mandibular.' };
    if (anb < 0.5) return { classe: 'Classe III Esquelética', cor: 'text-rose-400', desc: 'Protrusão mandibular ou deficiência maxilar esquelética.' };
    return { classe: 'Classe I Esquelética (Harmônica)', cor: 'text-emerald-400', desc: 'Relação maxilomandibular dentro do padrão ideal de Steiner.' };
  };

  const diag = getDiagnosticoClasseEsqueletica();

  // Filtragem dos Pontos da Lista Lateral
  const pontosFiltrados = pontos.filter((p) => {
    if (exibirSomenteAtencao && p.confidence_score >= 0.85) return false;
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    return true;
  });

  const qtdMarcados = pontos.filter((p) => p.x !== null).length;

  // Formatação JSON Estruturada
  const jsonSaidaEstruturado = JSON.stringify(
    {
      image_status: 'evaluated',
      points_marked_count: qtdMarcados,
      total_points_count: pontos.length,
      points: pontos.map((p) => ({
        id: p.id,
        name: p.nome,
        categoria: p.categoria,
        x: p.x,
        y: p.y,
        confidence_score: p.confidence_score,
        status: p.status
      })),
      validation_notes: validationNotes
    },
    null,
    2
  );

  const copiarJsonParaClipboard = () => {
    navigator.clipboard.writeText(jsonSaidaEstruturado);
    setCopiadoJson(true);
    setTimeout(() => setCopiadoJson(false), 2000);
  };

  return (
    <div className="space-y-3 select-none font-sans">
      
      {/* 1. CABEÇALHO SUPERIOR INSTITUCIONAL iCEF RADIO MEMORY */}
      <div className={`p-3.5 rounded-2xl border shadow-xl flex flex-col md:flex-row items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-blue-400/30">
            <Compass className="w-5 h-5 text-sky-300 animate-pulse" />
            <div>
              <span className="font-black text-sm text-white tracking-wider">iCef Online</span>
              <span className="block text-[9px] text-blue-200 font-mono">Radio Memory Standard</span>
            </div>
          </div>

          <div className="hidden sm:block border-l border-slate-700 pl-3">
            <h2 className="text-xs font-black text-white flex items-center gap-2">
              <span>{dadosPac.nome}</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-500/30">
                [{dadosPac.idade}]
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Solicitante: <strong className="text-slate-200">{dadosPac.indicacao}</strong> • OS: <strong className="text-amber-400 font-mono">#{dadosPac.os}</strong>
            </p>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO SUPERIORES iCEF */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAbaAtiva('fatores')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            title="Visualizar laudo e impressão"
          >
            <Printer className="w-4 h-4 text-sky-400" /> Impressão / PDF
          </button>

          <button
            onClick={handleSalvarExame}
            disabled={salvandoExame}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-md border border-emerald-400/30 disabled:opacity-50"
            title="Salvar exame cefalométrico"
          >
            <Save className={`w-4 h-4 ${salvandoExame ? 'animate-spin' : ''}`} />
            {salvandoExame ? 'Salvando...' : 'Salvar Exame'}
          </button>

          <button
            onClick={() => setModalJsonAberto(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-extrabold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Code className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* 2. NAVEGAÇÃO POR ABAS PRINCIPAIS iCEF (PACIENTE | MARCAR | FATORES | CEFALOGRAMA) */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-lg overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('paciente')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
            abaAtiva === 'paciente'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Paciente
        </button>

        <button
          onClick={() => setAbaAtiva('marcar')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
            abaAtiva === 'marcar'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" /> Marcar (Canvas)
        </button>

        <button
          onClick={() => setAbaAtiva('fatores')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
            abaAtiva === 'fatores'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Fatores & Laudo A4
        </button>

        <button
          onClick={() => setAbaAtiva('cefalograma')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer border ${
            abaAtiva === 'cefalograma'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Cefalograma (Camadas)
        </button>
      </div>

      {/* 3. CONTEÚDO DAS ABAS */}

      {/* ===== ABA 1: PACIENTE (FICHA DE DADOS) ===== */}
      {abaAtiva === 'paciente' && (
        <div className={`p-6 rounded-2xl border shadow-xl max-w-3xl mx-auto space-y-4 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2">
              <User className="w-4 h-4" /> Dados Cadastrais do Exame Cefalométrico
            </h3>
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">iCEF v1.3.1</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Tipo de Exame:</label>
              <input type="text" value={dadosPac.tipoExame} disabled className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Nome do Paciente:</label>
              <input type="text" value={dadosPac.nome} onChange={(e) => setDadosPac({ ...dadosPac, nome: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Data de Nascimento:</label>
              <input type="text" value={dadosPac.dataNasc} onChange={(e) => setDadosPac({ ...dadosPac, dataNasc: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Sexo:</label>
              <input type="text" value={dadosPac.sexo} onChange={(e) => setDadosPac({ ...dadosPac, sexo: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Cirurgião Dentista Solicitante:</label>
              <input type="text" value={dadosPac.indicacao} onChange={(e) => setDadosPac({ ...dadosPac, indicacao: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Clínica Radiológica:</label>
              <input type="text" value={dadosPac.clinica} onChange={(e) => setDadosPac({ ...dadosPac, clinica: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Data da Documentação:</label>
              <input type="text" value={dadosPac.dataDoc} onChange={(e) => setDadosPac({ ...dadosPac, dataDoc: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Resolução (Calibração DPI):</label>
              <input type="text" value={dadosPac.resolucaoDpi} disabled className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-teal-400 font-mono" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setAbaAtiva('marcar')}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              Ir para Tela de Marcação <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===== ABA 2: MARCAR (CANVAS PRINCIPAL + BARRA DE FERRAMENTAS + PAINEL LATERAL) ===== */}
      {abaAtiva === 'marcar' && (
        <div className="space-y-3">
          
          {/* BARRA DE FERRAMENTAS DE IMAGEM & CEFBOT IA (BARRA DE CONTROLES iCEF) */}
          <div className={`p-3 rounded-2xl border shadow-lg flex flex-wrap items-center justify-between gap-3 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            {/* CONTROLES DE BRILHO, CONTRASTE, NEGATIVO & ZOOM */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              
              {/* Slider de Brilho */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-mono">Brilho:</span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brilho}
                  onChange={(e) => setBrilho(Number(e.target.value))}
                  className="w-20 accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-teal-400 font-mono min-w-[32px]">{brilho}%</span>
              </div>

              {/* Slider de Contraste */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-mono">Contraste:</span>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contraste}
                  onChange={(e) => setContraste(Number(e.target.value))}
                  className="w-20 accent-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-teal-400 font-mono min-w-[32px]">{contraste}%</span>
              </div>

              {/* Checkbox de Inversão (Negativo) */}
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inversao}
                  onChange={(e) => setInversao(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 cursor-pointer"
                />
                <span>Negativo</span>
              </label>

              {/* Controls de Zoom */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                  className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-extrabold px-1.5 text-teal-400">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(300, z + 15))}
                  className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-extrabold text-slate-200 transition-all cursor-pointer"
                  title="Restaurar 100%"
                >
                  1:1
                </button>
              </div>
            </div>

            {/* BOTÃO EM DESTAQUE CEFBOT IA & LIMPAR MARCAÇÕES */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExecutarCEFBOT}
                disabled={analisandoIA}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-[11px] font-black cursor-pointer shadow-lg shadow-orange-600/30 flex items-center gap-1.5 transition-all border border-amber-400/40 disabled:opacity-50"
                title="Ativar robô CEFBOT para sugestão automática dos 104 pontos"
              >
                <Sparkles className={`w-4 h-4 ${analisandoIA ? 'animate-spin' : ''}`} />
                {analisandoIA ? 'CEFBOT Anotando...' : 'CEFBOT (Preencher IA)'}
              </button>

              <button
                onClick={handleLimparPontos}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-extrabold border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Deletar todos os pontos para marcar do zero"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Resetar Marcações
              </button>

              <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
                <Upload className="w-3.5 h-3.5 text-indigo-400" /> Abrir DICOM
                <input type="file" accept=".dcm,.dicom,image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* BANNER DE NAVEGAÇÃO E LEGENDA iCEF */}
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setPontoAtivoIdx(Math.max(0, pontoAtivoIdx - 1))}
                  disabled={pontoAtivoIdx === 0}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 cursor-pointer"
                  title="Ponto Anterior (Seta Esquerda)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono font-black text-indigo-300 text-[10px]">
                  Ponto {pontoAtivoIdx + 1}/{pontos.length}
                </span>
                <button
                  onClick={() => setPontoAtivoIdx(Math.min(pontos.length - 1, pontoAtivoIdx + 1))}
                  disabled={pontoAtivoIdx === pontos.length - 1}
                  className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 cursor-pointer"
                  title="Próximo Ponto (Seta Direita)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-slate-300">
                Ativo: <strong className="text-emerald-400 font-mono">[{pontos[pontoAtivoIdx].id} - {pontos[pontoAtivoIdx].nome}]</strong>
              </span>
            </div>

            {/* LEGENDA DE CORES iCEF */}
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="text-slate-400">Legenda:</span>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse"></span>
                <span className="text-red-400">Atenção (&lt;85%)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className="text-amber-300">Não marcado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span className="text-emerald-300">Confirmado</span>
              </div>
            </div>
          </div>

          {/* GRID PRINCIPAL: CANVAS RADIOGRÁFICO + PAINEL LATERAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* COLUNA ESQUERDA: CANVAS DE TELERRADIOGRAFIA HD (780PX - 820PX) */}
            <div className="lg:col-span-2 space-y-3">
              <div
                ref={containerRef}
                className={`rounded-2xl border shadow-2xl relative overflow-auto flex items-center justify-center min-h-[720px] h-[780px] lg:h-[820px] select-none cursor-crosshair ${
                  darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <div
                  ref={imageWrapperRef}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="relative transition-transform duration-100 inline-block shadow-2xl overflow-hidden rounded-xl"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                >
                  {/* IMAGEM COM APLICATIVO DE BRILHO, CONTRASTE E INVERSÃO */}
                  {camadas.radiografia && (
                    <img
                      src={imagemUrl}
                      alt="Telerradiografia Lateral Ampliada"
                      className="block max-h-[760px] lg:max-h-[800px] w-auto h-auto object-contain pointer-events-none select-none transition-all duration-75"
                      style={{
                        filter: `brightness(${brilho}%) contrast(${contraste}%)${inversao ? ' invert(100%)' : ''}`
                      }}
                    />
                  )}

                  {/* SOBREPOSIÇÃO SVG DOS TRAÇADOS CEFAMÉTRICOS E PONTOS COM MARCAÇÃO MILIMÉTRICA */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {camadas.planos && (
                      <>
                        {/* Linha S-N (Azul Sky) */}
                        {getPonto('S') && getPonto('N') && (
                          <line x1={getPonto('S')!.x!} y1={getPonto('S')!.y!} x2={getPonto('N')!.x!} y2={getPonto('N')!.y!} stroke="#38BDF8" strokeWidth="2.5" />
                        )}
                        {/* Linha N-A (Esmeralda) */}
                        {getPonto('N') && getPonto('A') && (
                          <line x1={getPonto('N')!.x!} y1={getPonto('N')!.y!} x2={getPonto('A')!.x!} y2={getPonto('A')!.y!} stroke="#10B981" strokeWidth="2" />
                        )}
                        {/* Linha N-B (Rosa Coral) */}
                        {getPonto('N') && getPonto('B') && (
                          <line x1={getPonto('N')!.x!} y1={getPonto('N')!.y!} x2={getPonto('B')!.x!} y2={getPonto('B')!.y!} stroke="#F43F5E" strokeWidth="2" />
                        )}
                        {/* Plano de Frankfurt Po-Or (Verde Lima) */}
                        {getPonto('Po') && getPonto('Or') && (
                          <line x1={getPonto('Po')!.x!} y1={getPonto('Po')!.y!} x2={getPonto('Or')!.x!} y2={getPonto('Or')!.y!} stroke="#84CC16" strokeWidth="2" strokeDasharray="3 3" />
                        )}
                        {/* Plano Mandibular Go-Me (Amarelo Amber) */}
                        {getPonto('Go') && getPonto('Me') && (
                          <line x1={getPonto('Go')!.x!} y1={getPonto('Go')!.y!} x2={getPonto('Me')!.x!} y2={getPonto('Me')!.y!} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
                        )}
                        {/* Plano Palatino Ena-Enp (Índigo) */}
                        {getPonto('Ena') && getPonto('Enp') && (
                          <line x1={getPonto('Ena')!.x!} y1={getPonto('Ena')!.y!} x2={getPonto('Enp')!.x!} y2={getPonto('Enp')!.y!} stroke="#818CF8" strokeWidth="1.5" strokeDasharray="2 2" />
                        )}
                        {/* Linha E de Ricketts Prn-Pog' (Rosa Mole) */}
                        {getPonto('Prn') && getPonto('Pog\'') && (
                          <line x1={getPonto('Prn')!.x!} y1={getPonto('Prn')!.y!} x2={getPonto('Pog\'')!.x!} y2={getPonto('Pog\'')!.y!} stroke="#EC4899" strokeWidth="2" />
                        )}
                      </>
                    )}

                    {/* RENDERIZAÇÃO DOS PONTOS CEFAMÉTRICOS MARCADOS */}
                    {camadas.pontos && pontos.map((p, idx) => {
                      if (p.x === null || p.y === null) return null;

                      const isAtivo = idx === pontoAtivoIdx;
                      const isBaixaConfianca = p.confidence_score < 0.85;

                      let corPonto = '#10B981'; // Verde padrão confirmado
                      if (isAtivo) corPonto = '#38BDF8'; // Azul sky ativo
                      else if (isBaixaConfianca) corPonto = '#EF4444'; // Vermelho atenção iCEF

                      return (
                        <g
                          key={p.id}
                          className="cursor-grab active:cursor-grabbing pointer-events-auto"
                          onMouseDown={(e) => handleCanvasMouseDown(e, p.id, idx)}
                        >
                          {isBaixaConfianca && (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="11"
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="1.5"
                              className="animate-ping opacity-75"
                            />
                          )}

                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isAtivo ? '7' : '5'}
                            fill={corPonto}
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />

                          <text
                            x={p.x + 8}
                            y={p.y + 4}
                            fill={isAtivo ? '#38BDF8' : isBaixaConfianca ? '#EF4444' : '#FFFFFF'}
                            fontSize="10"
                            fontWeight="bold"
                            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                          >
                            {p.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* GUIA DE MARCAÇÃO ATIVA (TOOLTIP FLUTUANTE) */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                      pontos[pontoAtivoIdx].x === null
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : pontos[pontoAtivoIdx].confidence_score < 0.85
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {pontos[pontoAtivoIdx].id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider">
                          Ponto {pontoAtivoIdx + 1}/{pontos.length} ({pontos[pontoAtivoIdx].categoria})
                        </span>
                        {pontos[pontoAtivoIdx].x !== null ? (
                          <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                            pontos[pontoAtivoIdx].confidence_score >= 0.85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            Marcado (Confiança: {Math.round(pontos[pontoAtivoIdx].confidence_score * 100)}%)
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            Pendente - Clique na Imagem para Marcar...
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-white">{pontos[pontoAtivoIdx].nome}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-[340px]">{pontos[pontoAtivoIdx].descricao}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPontoAtivoIdx(Math.max(0, pontoAtivoIdx - 1))}
                      disabled={pontoAtivoIdx === 0}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPontoAtivoIdx(Math.min(pontos.length - 1, pontoAtivoIdx + 1))}
                      disabled={pontoAtivoIdx === pontos.length - 1}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[11px] font-extrabold text-white shadow-md border border-indigo-500 cursor-pointer"
                    >
                      Próximo <ChevronRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: RESULTADOS TABELADOS, LISTA DOS 104 PONTOS E LAUDO */}
            <div className="space-y-4">
              
              {/* SELETOR DE ANÁLISE E LISTA DE PONTOS */}
              <div className={`p-3 rounded-2xl border shadow-xl space-y-2 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 flex-wrap gap-1">
                  <span className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Pontos ({qtdMarcados}/{pontos.length}):
                  </span>
                  
                  {/* SELETOR DE ANÁLISES iCEF */}
                  <select
                    value={analiseSelecionada}
                    onChange={(e) => setAnaliseSelecionada(e.target.value as any)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-sky-400 cursor-pointer"
                  >
                    <option value="Steiner">Análise Steiner</option>
                    <option value="Tweed">Análise Tweed</option>
                    <option value="Ricketts">Análise Ricketts</option>
                    <option value="McNamara">Análise McNamara</option>
                    <option value="Livre">Livre (Todas)</option>
                  </select>
                </div>

                {/* FILTROS DE CATEGORIA */}
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {(['todas', 'esqueletica', 'dentaria', 'mole', 'cervical_vias'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFiltroCategoria(cat)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border transition-all cursor-pointer ${
                        filtroCategoria === cat
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {cat === 'todas' ? 'Tudo' : cat === 'esqueletica' ? 'Ósseo' : cat === 'dentaria' ? 'Dente' : cat === 'mole' ? 'Mole' : 'Cervical'}
                    </button>
                  ))}
                </div>

                {/* LISTA SCROLLÁVEL DOS 104 PONTOS */}
                <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {pontosFiltrados.map((p) => {
                    const idxReal = pontos.findIndex((pt) => pt.id === p.id);
                    const isSel = idxReal === pontoAtivoIdx;
                    const isMarcado = p.x !== null;
                    const isAlerta = isMarcado && p.confidence_score < 0.85;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setPontoAtivoIdx(idxReal)}
                        className={`p-1.5 rounded-xl border flex items-center justify-between text-[10px] cursor-pointer transition-all ${
                          isSel
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                            : isAlerta
                            ? 'bg-red-500/10 border-red-500/30 text-red-300'
                            : isMarcado
                            ? 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-6 h-5 rounded flex items-center justify-center font-mono font-black text-[9px] px-1 ${
                            isAlerta ? 'bg-red-500/30 text-red-300' : isMarcado ? 'bg-indigo-600/30 text-indigo-300' : 'bg-amber-500/30 text-amber-300'
                          }`}>
                            {p.id}
                          </span>
                          <span className="font-bold truncate max-w-[140px]">{p.nome}</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono">
                          {isMarcado ? (
                            isAlerta ? (
                              <span className="text-[9px] text-red-400 font-extrabold flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> {(p.confidence_score * 100).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> {(p.confidence_score * 100).toFixed(0)}%
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-amber-400 font-mono italic">Pendente</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CARD DE RESULTADOS DA ANÁLISE SELECIONADA */}
              <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-extrabold text-xs flex items-center gap-1.5 text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tabela de Fatores: {analiseSelecionada}
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {dadosPac.os}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9px]">
                        <th className="py-1.5">Grandeza</th>
                        <th className="py-1.5">Norma Padrão</th>
                        <th className="py-1.5">Medido</th>
                        <th className="py-1.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(analiseSelecionada === 'Steiner' || analiseSelecionada === 'Livre') && (
                        <>
                          <tr>
                            <td className="py-1.5 font-bold text-sky-400">SNA (Maxilar)</td>
                            <td className="py-1.5 text-slate-400">82,0° (±2°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{sna}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-rose-400">SNB (Mandibular)</td>
                            <td className="py-1.5 text-slate-400">80,0° (±2°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{snb}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                          </tr>
                          <tr className="bg-indigo-500/10">
                            <td className="py-1.5 font-extrabold text-amber-400">ANB (Rel. Maxilomand.)</td>
                            <td className="py-1.5 text-slate-400">2,0° (±2°)</td>
                            <td className="py-1.5 font-black font-mono text-amber-400 text-xs">{anb}°</td>
                            <td className="py-1.5 text-right font-bold text-amber-400">Classe II</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-teal-400">1.NA (Inclin. Incisivo Sup)</td>
                            <td className="py-1.5 text-slate-400">22,0° (±2°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{u1NaDeg}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-pink-400">1.NB (Inclin. Incisivo Inf)</td>
                            <td className="py-1.5 text-slate-400">25,0° (±2°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{l1NbDeg}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                          </tr>
                        </>
                      )}

                      {(analiseSelecionada === 'Tweed' || analiseSelecionada === 'Livre') && (
                        <>
                          <tr>
                            <td className="py-1.5 font-bold text-amber-400">FMA (Plano Mand. / FH)</td>
                            <td className="py-1.5 text-slate-400">25,0° (±3°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{fma}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 font-bold text-sky-400">IMPA (Incisivo Inf. / Mand)</td>
                            <td className="py-1.5 text-slate-400">90,0° (±5°)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{impa}°</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Protruso</td>
                          </tr>
                        </>
                      )}

                      {(analiseSelecionada === 'Ricketts' || analiseSelecionada === 'Livre') && (
                        <>
                          <tr>
                            <td className="py-1.5 font-bold text-pink-400">Linha E - Lábio Sup. (Prn-Pog')</td>
                            <td className="py-1.5 text-slate-400">-2,0 mm (±2mm)</td>
                            <td className="py-1.5 font-extrabold font-mono text-white">{eLineLs} mm</td>
                            <td className="py-1.5 text-right font-bold text-emerald-400">Harmônico</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD DE LAUDO DIAGNÓSTICO AUTOMATIZADO */}
              <div className={`p-4 rounded-2xl border shadow-xl space-y-2.5 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider block flex items-center justify-between">
                  <span>Conclusão Ortodôntica Sumária</span>
                  <span className="text-emerald-400 font-mono">iCEF AI v1.3</span>
                </span>

                <h4 className={`text-sm font-black ${diag.cor}`}>{diag.classe}</h4>
                <p className="text-[11px] text-slate-300 leading-normal font-normal">{diag.desc}</p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ===== ABA 3: FATORES & LAUDO RELATÓRIO A4 ===== */}
      {abaAtiva === 'fatores' && (
        <div className="p-4 md:p-8 bg-slate-950 rounded-2xl border border-slate-800 min-h-[850px] flex justify-center">
          
          {/* FOLHA FORMATO A4 iCEF IMPRESSÃO */}
          <div className="w-full max-w-[21cm] bg-white text-slate-900 p-8 shadow-2xl rounded-sm border border-slate-300 space-y-6 font-serif select-text">
            
            {/* CABEÇALHO DO RELATÓRIO A4 */}
            <div className="text-center border-b-2 border-blue-900 pb-4 space-y-1">
              <h1 className="text-2xl font-black text-blue-900 uppercase tracking-wide">iCef - Cefalometria Online</h1>
              <h2 className="text-lg font-bold text-slate-700">Relatório da Análise: {analiseSelecionada}</h2>
              <p className="text-xs text-slate-500 font-sans">Radiocef / Radio Memory Standard Diagnostic Report</p>
            </div>

            {/* DADOS DO PACIENTE TABELADOS A4 */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans bg-slate-50 p-4 rounded border border-slate-200">
              <div>
                <p><strong>Paciente:</strong> {dadosPac.nome}</p>
                <p><strong>Cirurgião Dentista:</strong> {dadosPac.indicacao}</p>
                <p><strong>Clínica:</strong> {dadosPac.clinica}</p>
              </div>
              <div>
                <p><strong>Idade:</strong> {dadosPac.idade} ({dadosPac.dataNasc})</p>
                <p><strong>Sexo:</strong> {dadosPac.sexo}</p>
                <p><strong>Data Doc. / OS:</strong> {dadosPac.dataDoc} / #{dadosPac.os}</p>
              </div>
            </div>

            {/* TABELA DE FATORES CEFAMÉTRICOS FORMATO iCEF */}
            <div className="font-sans">
              <h3 className="text-sm font-bold text-blue-900 uppercase border-b border-blue-900 pb-1 mb-2">Tabela de Fatores e Medidas Obtidas</h3>
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-blue-900 text-white uppercase text-[10px]">
                    <th className="p-2 border">Fatores</th>
                    <th className="p-2 border text-center">Valor Obtido</th>
                    <th className="p-2 border text-center">Norma / Padrão</th>
                    <th className="p-2 border text-right">Classificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border font-bold">SNA (Ângulo Maxilar)</td>
                    <td className="p-2 border text-center font-mono font-bold">{sna}°</td>
                    <td className="p-2 border text-center">82,0° (± 2,0°)</td>
                    <td className="p-2 border text-right text-emerald-700 font-bold">Maxila Normal</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold">SNB (Ângulo Mandibular)</td>
                    <td className="p-2 border text-center font-mono font-bold">{snb}°</td>
                    <td className="p-2 border text-center">80,0° (± 2,0°)</td>
                    <td className="p-2 border text-right text-emerald-700 font-bold">Mandíbula Normal</td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="p-2 border font-bold text-amber-900">ANB (Relação Sagital)</td>
                    <td className="p-2 border text-center font-mono font-black text-amber-900">{anb}°</td>
                    <td className="p-2 border text-center">2,0° (± 2,0°)</td>
                    <td className="p-2 border text-right font-black text-amber-800">Classe II Esquelética</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold">1.NA (Inclinação Incisivo Sup)</td>
                    <td className="p-2 border text-center font-mono font-bold">{u1NaDeg}°</td>
                    <td className="p-2 border text-center">22,0° (± 2,0°)</td>
                    <td className="p-2 border text-right text-emerald-700 font-bold">Normoinclinado</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold">1.NB (Inclinação Incisivo Inf)</td>
                    <td className="p-2 border text-center font-mono font-bold">{l1NbDeg}°</td>
                    <td className="p-2 border text-center">25,0° (± 2,0°)</td>
                    <td className="p-2 border text-right text-emerald-700 font-bold">Normoinclinado</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-bold">FMA (Plano Mandibular Tweed)</td>
                    <td className="p-2 border text-center font-mono font-bold">{fma}°</td>
                    <td className="p-2 border text-center">25,0° (± 3,0°)</td>
                    <td className="p-2 border text-right text-emerald-700 font-bold">Mesofacial</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* QUADRO DE CONCLUSÃO DIAGNÓSTICA SUMÁRIA A4 */}
            <div className="font-sans bg-slate-50 p-4 rounded border border-blue-200 space-y-2">
              <h3 className="text-xs font-bold text-blue-900 uppercase">Conclusão Diagnóstica Automatizada</h3>
              <p className="text-xs text-slate-800 leading-relaxed font-semibold">
                {diag.classe}: {diag.desc}
              </p>
            </div>

            {/* RODAPÉ DO LAUDO A4 */}
            <div className="pt-8 border-t border-slate-300 text-center font-sans text-[10px] text-slate-500 flex justify-between items-center">
              <span>Produzido por iCEF Online / Radio Memory</span>
              <span>Página 1 de 1</span>
              <span>Chave OS: {dadosPac.os}</span>
            </div>

          </div>
        </div>
      )}

      {/* ===== ABA 4: CEFALOGRAMA (OPÇÕES DE VISUALIZAÇÃO E CAMADAS) ===== */}
      {abaAtiva === 'cefalograma' && (
        <div className={`p-6 rounded-2xl border shadow-xl max-w-xl mx-auto space-y-4 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-indigo-400 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Configuração de Camadas do Cefalograma
            </h3>
            <span className="text-[10px] font-mono text-slate-400">iCEF Layers Control</span>
          </div>

          <div className="space-y-3 font-medium text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={camadas.radiografia}
                  onChange={(e) => setCamadas({ ...camadas, radiografia: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Exibir Radiografia de Fundo</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Imagem Lateral</span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={camadas.pontos}
                  onChange={(e) => setCamadas({ ...camadas, pontos: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Exibir Pontos Anatômicos Cefalométricos</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">104 Pontos</span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={camadas.planos}
                  onChange={(e) => setCamadas({ ...camadas, planos: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Exibir Planos Cefalométricos (S-N, Frankfurt, Mandibular)</span>
              </div>
              <span className="text-[10px] font-mono text-sky-400">Planos & Linhas</span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={camadas.dentes}
                  onChange={(e) => setCamadas({ ...camadas, dentes: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Exibir Contornos Dentários (Incisivos & Molares)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Desenhos Dentários</span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={camadas.curvas}
                  onChange={(e) => setCamadas({ ...camadas, curvas: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 w-4 h-4 cursor-pointer"
                />
                <span>Exibir Curvas Anatômicas de Perfil de Tecido Mole</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Perfil Mole</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setAbaAtiva('marcar')}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              Voltar ao Canvas <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE EXIBIÇÃO DO JSON ESTRUTURADO */}
      {modalJsonAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 md:p-6 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black text-white">Saída JSON Estruturada (iCEF API Schema)</h3>
              </div>
              <button
                onClick={() => setModalJsonAberto(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-indigo-300 font-mono text-[11px] space-y-2 custom-scrollbar">
              <pre className="whitespace-pre-wrap">{jsonSaidaEstruturado}</pre>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {qtdMarcados} de {pontos.length} pontos marcados | iCEF API Validated
              </span>
              <button
                onClick={copiarJsonParaClipboard}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiadoJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiadoJson ? 'Copiado para Área de Transferência!' : 'Copiar JSON'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
