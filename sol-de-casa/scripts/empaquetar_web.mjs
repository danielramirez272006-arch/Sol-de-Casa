// Empaquetador reproducible: compila el código fuente modular de web/
// en un único entregable autocontenido: entregables/Sol_de_Casa_tablero.html
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..') // sol-de-casa/
const WEB_DIR = path.join(ROOT, 'web')
const OUT_FILE = path.join(ROOT, '..', 'entregables', 'Sol_de_Casa_tablero.html')

let html = fs.readFileSync(path.join(WEB_DIR, 'index.html'), 'utf8')

// 1. Inyectar hoja de estilos CSS en línea
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="\.\/src\/css\/editorial\.css"\s*\/?>/,
  () => {
    const css = fs.readFileSync(path.join(WEB_DIR, 'src/css/editorial.css'), 'utf8')
    return `<style>\n${css}\n  </style>`
  },
)

// 2. Incrustar fotografías editoriales en Base64 para que el entregable sea 100% autónomo en 1 solo archivo
html = html.replace(/src="\.\/assets\/images\/([^"]+\.jpg)"/g, (_, fileName) => {
  const imgPath = path.join(WEB_DIR, 'assets/images', fileName)
  const b64 = fs.readFileSync(imgPath).toString('base64')
  return `src="data:image/jpeg;base64,${b64}"`
})

// 3. Ajustar ruta relativa de descarga del Excel maestro dentro de entregables/
html = html.replace('href="../../entregables/Sol_de_Casa_Completo.xlsx"', 'href="./Sol_de_Casa_Completo.xlsx"')

// 4. Inyectar los módulos JS vanilla al final del body manteniendo orden determinista de ejecución
const jsFiles = [
  'src/js/domain/modelo.js',
  'src/js/domain/referidos.js',
  'src/js/ui/graficos.js',
  'src/js/ui/animaciones.js',
  'src/js/ui/app.js',
  'src/js/ui/referidos-ui.js',
]

// Quitar las etiquetas <script defer src="./src/js/..."></script> del <head>
html = html.replace(/\s*<script\s+defer\s+src="\.\/src\/js\/[^"]+"><\/script>/g, '')

const inlineScripts = jsFiles
  .map((rel) => {
    const code = fs.readFileSync(path.join(WEB_DIR, rel), 'utf8')
    return `  <script>\n${code}\n  </script>`
  })
  .join('\n')

html = html.replace('</body>', () => `${inlineScripts}\n</body>`)

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, html, 'utf8')
console.log(`Entregable autocontenido generado: ${path.relative(ROOT, OUT_FILE)} (${Math.round(fs.statSync(OUT_FILE).size / 1024)} KB)`)
