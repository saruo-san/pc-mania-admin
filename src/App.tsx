import { useEffect, useState, type FormEvent } from 'react'
import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth'
import { agregarProducto, type Producto } from './api'
import { configFaltante, isConfigOk } from './config'
import './App.css'

const FORM_INICIAL = { nombre: '', marca: '', categoria: '', precio: '', stock: '' }

function App() {
  const [logueado, setLogueado] = useState(false)
  const [cargandoSesion, setCargandoSesion] = useState(isConfigOk)
  const [form, setForm] = useState(FORM_INICIAL)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agregados, setAgregados] = useState<Producto[]>([])

  useEffect(() => {
    if (!isConfigOk) return

    fetchAuthSession()
      .then((session) => setLogueado(!!session.tokens))
      .catch(() => setLogueado(false))
      .finally(() => setCargandoSesion(false))
  }, [])

  if (!isConfigOk) {
    return <div className="aviso-config"><p className="eyebrow">PC MANIA / CONFIGURACION</p><h1>Conecta tu panel</h1><p>Completa estos valores en el archivo <code>.env</code> cuando configures Cognito:</p><ul>{configFaltante().map((clave) => <li key={clave}><code>{clave}</code></li>)}</ul></div>
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const nuevo = await agregarProducto({
        nombre: form.nombre,
        marca: form.marca,
        categoria: form.categoria,
        precio: Number(form.precio),
        stock: Number(form.stock),
      })
      setAgregados((prev) => [nuevo, ...prev])
      setForm(FORM_INICIAL)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header"><div><p className="eyebrow">PC MANIA / OPERACIONES</p><h1>Panel de inventario</h1></div>{!cargandoSesion && (logueado ? <button onClick={() => signOut()}>Cerrar sesion</button> : <button onClick={() => signInWithRedirect()}>Iniciar sesion</button>)}</header>
      {cargandoSesion && <p className="mensaje">Verificando sesion...</p>}
      {!cargandoSesion && !logueado && <p className="mensaje">Inicia sesion como personal para agregar productos.</p>}
      {logueado && <main><form onSubmit={onSubmit} className="formulario"><label>Nombre<input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label><label>Marca<input required value={form.marca} onChange={(event) => setForm({ ...form, marca: event.target.value })} /></label><label>Categoria<input required value={form.categoria} onChange={(event) => setForm({ ...form, categoria: event.target.value })} /></label><label>Precio<input required type="number" min="0.01" step="0.01" value={form.precio} onChange={(event) => setForm({ ...form, precio: event.target.value })} /></label><label>Stock<input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label><button type="submit" disabled={enviando}>{enviando ? 'Agregando...' : 'Agregar al inventario'}</button></form>{error && <p className="error">No se pudo agregar: {error}</p>}{agregados.length > 0 && <section><h2>Agregados en esta sesion</h2><ul className="lista-agregados">{agregados.map((producto) => <li key={producto.id}>#{producto.id} - {producto.nombre} ({producto.marca}) - ${producto.precio.toLocaleString('es-CL')} - stock {producto.stock}</li>)}</ul></section>}</main>}
    </div>
  )
}

export default App
