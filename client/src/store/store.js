/* ── Acadmix MongoDB API Store ── */

export const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://main-acadmix.vercel.app/api')

function getHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('acadmix_user') || '{}')
    return {
      'Content-Type': 'application/json',
      ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
    }
  } catch {
    return { 'Content-Type': 'application/json' }
  }
}

export function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('acadmix_user') || '{}')
    return user.token || ''
  } catch { return '' }
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('acadmix_user') || 'null')
  } catch { return null }
}

export async function getProducts(filters = '') {
  try {
    const res = await fetch(`${API_URL}/products${filters}`)
    const data = await res.json()
    return data.products || []
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function saveProduct(product) {
  try {
    const method = product._id ? 'PUT' : 'POST'
    const url = product._id ? `${API_URL}/products/${product._id}` : `${API_URL}/products`
    const res = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(product),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'Failed to save product')
    return data
  } catch (err) {
    console.error(err)
    throw err
  }
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers: getHeaders() })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.message || 'Failed to delete product')
    }
  } catch (err) {
    console.error(err)
    throw err
  }
}

export async function getProductById(id) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`)
    return await res.json()
  } catch (err) { return null }
}

export async function getProductsByType(type) {
  return await getProducts(`?type=${type}`)
}

/* Convert Google Drive share link → embeddable preview URL */
export function driveEmbedUrl(link) {
  if (!link) return ''
  const match = link.match(/[-\w]{25,}/)
  if (match) return `https://drive.google.com/file/d/${match[0]}/preview`
  return link
}
