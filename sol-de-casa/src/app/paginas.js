import TableroPage from '@/features/tablero/TableroPage.jsx'
import ResultadosPage from '@/features/resultados/ResultadosPage.jsx'
import SupuestosPage from '@/features/supuestos/SupuestosPage.jsx'
import RecomendacionPage from '@/features/recomendacion/RecomendacionPage.jsx'
import GraficosPage from '@/features/graficos/GraficosPage.jsx'
import SimuladorPage from '@/features/simulador/SimuladorPage.jsx'
import ExcelPage from '@/features/excel/ExcelPage.jsx'

// Registro de páginas: agregar una nueva = una línea aquí.
export const PAGINAS = [
  { id: 'tablero', titulo: 'Tablero en vivo (Nivel 2)', Componente: TableroPage },
  { id: 'resultados', titulo: 'Escenarios (Nivel 1)', Componente: ResultadosPage },
  { id: 'graficos', titulo: 'Gráficos', Componente: GraficosPage },
  { id: 'recomendacion', titulo: 'Recomendación', Componente: RecomendacionPage },
  { id: 'simulador', titulo: 'Simulador 24 meses (Nivel 3)', Componente: SimuladorPage },
  { id: 'supuestos', titulo: 'Supuestos', Componente: SupuestosPage },
  { id: 'excel', titulo: 'Conexión Excel', Componente: ExcelPage },
]
